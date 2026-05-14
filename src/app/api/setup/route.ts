import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Try to clean existing data safely
    const models = ['appointment', 'workingHours', 'session', 'business', 'account', 'service', 'staff', 'client'] as const
    for (const model of models) {
      try {
        if ((db as any)[model] && typeof (db as any)[model].deleteMany === 'function') {
          await (db as any)[model].deleteMany()
        }
      } catch {}
    }

    // Also try junction tables
    for (const model of ['staffService', 'serviceVariant']) {
      try {
        if ((db as any)[model] && typeof (db as any)[model].deleteMany === 'function') {
          await (db as any)[model].deleteMany()
        }
      } catch {}
    }

    // Create Account
    const account = await db.account.create({
      data: {
        name: 'Mario Rossi',
        email: 'demo@gestionale.it',
        password: 'demo123',
        phone: '+39 333 1234567',
      },
    })

    // Create Business
    const business = await db.business.create({
      data: {
        accountId: account.id,
        name: 'Salon Bella Vista',
        slug: 'salon-bella-vista',
        activityType: 'SALONE',
        description: 'Salone di parrucchiere e centro estetico',
        address: 'Via Roma 42',
        city: 'Milano',
        province: 'MI',
        phone: '+39 02 1234567',
        email: 'info@salonbellavista.it',
        website: 'https://salonbellavista.it',
      },
    })

    // Create Working Hours
    await db.workingHours.createMany({
      data: [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', closed: false, businessId: business.id },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', closed: false, businessId: business.id },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', closed: false, businessId: business.id },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', closed: false, businessId: business.id },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', closed: false, businessId: business.id },
        { dayOfWeek: 6, openTime: '09:00', closeTime: '13:00', closed: false, businessId: business.id },
        { dayOfWeek: 0, openTime: '09:00', closeTime: '13:00', closed: true, businessId: business.id },
      ],
    })

    // Create Services
    const services = await Promise.all([
      db.service.create({ data: { businessId: business.id, name: 'Taglio Donna', description: 'Taglio e styling per donna', durationMinutes: 45, price: 35, bufferMinutes: 10, category: 'Tagli', active: true } }),
      db.service.create({ data: { businessId: business.id, name: 'Taglio Uomo', description: 'Taglio classico per uomo', durationMinutes: 30, price: 20, bufferMinutes: 10, category: 'Tagli', active: true } }),
      db.service.create({ data: { businessId: business.id, name: 'Piega', description: 'Piega con asciugatura', durationMinutes: 30, price: 25, bufferMinutes: 5, category: 'Styling', active: true } }),
      db.service.create({ data: { businessId: business.id, name: 'Colore', description: 'Colorazione completa', durationMinutes: 60, price: 55, bufferMinutes: 15, category: 'Colore', active: true } }),
      db.service.create({ data: { businessId: business.id, name: 'Trattamento Cheratina', description: 'Trattamento lisciante alla cheratina', durationMinutes: 90, price: 90, bufferMinutes: 15, category: 'Trattamenti', active: true } }),
    ])

    // Create Staff
    const staff1 = await db.staff.create({
      data: { businessId: business.id, name: 'Laura Bianchi', phone: '+39 333 9876543', role: 'OWNER', color: '#ec4899', active: true },
    })
    const staff2 = await db.staff.create({
      data: { businessId: business.id, name: 'Marco Verdi', phone: '+39 333 5551234', role: 'OPERATOR', color: '#10b981', active: true },
    })

    // Create Clients
    const client1 = await db.client.create({ data: { businessId: business.id, firstName: 'Giulia', lastName: 'Ferrari', phone: '+39 345 1112233', gender: 'DONNA' } })
    const client2 = await db.client.create({ data: { businessId: business.id, firstName: 'Alessandro', lastName: 'Romano', phone: '+39 345 4445566', gender: 'UOMO' } })
    const client3 = await db.client.create({ data: { businessId: business.id, firstName: 'Chiara', lastName: 'Esposito', phone: '+39 345 7778899', gender: 'DONNA' } })

    // Create Appointments
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)
    dayAfter.setHours(14, 0, 0, 0)

    await db.appointment.create({ data: { businessId: business.id, clientId: client1.id, serviceId: services[0].id, staffId: staff1.id, startTime: tomorrow, endTime: new Date(tomorrow.getTime() + 45 * 60 * 1000), status: 'CONFIRMED' } })
    await db.appointment.create({ data: { businessId: business.id, clientId: client2.id, serviceId: services[1].id, staffId: staff2.id, startTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), endTime: new Date(tomorrow.getTime() + 90 * 60 * 1000), status: 'CONFIRMED' } })
    await db.appointment.create({ data: { businessId: business.id, clientId: client3.id, serviceId: services[3].id, staffId: staff1.id, startTime: dayAfter, endTime: new Date(dayAfter.getTime() + 60 * 60 * 1000), status: 'PENDING' } })

    // Create Session
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    await db.session.create({ data: { token, accountId: account.id, expiresAt } })

    return NextResponse.json({
      message: 'Dati demo creati con successo',
      token,
      account: { id: account.id, email: account.email, password: account.password, name: account.name },
      business: { id: business.id, name: business.name, slug: business.slug, activityType: business.activityType },
      stats: { services: 5, staff: 2, clients: 3, appointments: 3 },
    }, { status: 201 })
  } catch (error) {
    console.error('Setup error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Errore nella creazione dei dati demo', details: msg }, { status: 500 })
  }
}
