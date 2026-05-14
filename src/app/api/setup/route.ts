import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/setup - Initialize database with seed data
export async function POST() {
  try {
    const existingUsers = await db.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({
        success: true,
        message: 'Database already initialized',
        users: existingUsers,
      })
    }

    const admin = await db.user.create({
      data: {
        name: 'Mario Rossi',
        email: 'admin@barber.it',
        password: 'admin',
        phone: '+39 333 1234567',
        role: 'ADMIN',
      },
    })

    const client1 = await db.user.create({
      data: {
        name: 'Luca Bianchi',
        email: 'luca@email.it',
        password: 'client',
        phone: '+39 345 9876543',
        role: 'CLIENT',
      },
    })

    const client2 = await db.user.create({
      data: {
        name: 'Anna Verdi',
        email: 'anna@email.it',
        password: 'client',
        phone: '+39 346 1112233',
        role: 'CLIENT',
      },
    })

    // Services - UOMO
    const uomoServices = await Promise.all([
      db.service.create({ data: { name: 'Taglio Capelli Uomo', description: 'Taglio classico con styling finale', durationMinutes: 30, price: 18.00, bufferMinutes: 10, gender: 'UOMO' } }),
      db.service.create({ data: { name: 'Barba', description: 'Rasatura tradizionale con panno caldo', durationMinutes: 20, price: 12.00, bufferMinutes: 10, gender: 'UOMO' } }),
      db.service.create({ data: { name: 'Taglio + Barba', description: 'Taglio completo con rasatura barba', durationMinutes: 45, price: 25.00, bufferMinutes: 10, gender: 'UOMO' } }),
      db.service.create({ data: { name: 'Shampoo + Taglio', description: 'Lavaggio con shampoo professionale e taglio', durationMinutes: 40, price: 22.00, bufferMinutes: 10, gender: 'UOMO' } }),
      db.service.create({ data: { name: 'Colore Uomo', description: 'Colorazione capelli con prodotti professionali', durationMinutes: 45, price: 30.00, bufferMinutes: 10, gender: 'UOMO' } }),
    ])

    // Services - DONNA
    const donnaServices = await Promise.all([
      db.service.create({ data: { name: 'Taglio Capelli Donna', description: 'Taglio e piega con consulenza stile', durationMinutes: 45, price: 25.00, bufferMinutes: 10, gender: 'DONNA' } }),
      db.service.create({ data: { name: 'Piega', description: 'Piega professionale con asciugatura', durationMinutes: 30, price: 18.00, bufferMinutes: 10, gender: 'DONNA' } }),
      db.service.create({ data: { name: 'Shampoo + Piega', description: 'Lavaggio e piega completa', durationMinutes: 40, price: 22.00, bufferMinutes: 10, gender: 'DONNA' } }),
      db.service.create({ data: { name: 'Colore', description: 'Colorazione completa con prodotti professionali', durationMinutes: 60, price: 40.00, bufferMinutes: 15, gender: 'DONNA' } }),
      db.service.create({ data: { name: 'Meches', description: 'Schiariture e meches personalizzate', durationMinutes: 90, price: 55.00, bufferMinutes: 15, gender: 'DONNA' } }),
    ])

    // UNISEX
    await db.service.create({ data: { name: 'Taglio Bambini', description: 'Taglio per bambini fino a 12 anni', durationMinutes: 20, price: 12.00, bufferMinutes: 10, gender: 'UNISEX' } })

    // Business hours
    await Promise.all([
      db.businessHours.create({ data: { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', closed: false } }),
      db.businessHours.create({ data: { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', closed: false } }),
      db.businessHours.create({ data: { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', closed: false } }),
      db.businessHours.create({ data: { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', closed: false } }),
      db.businessHours.create({ data: { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', closed: false } }),
      db.businessHours.create({ data: { dayOfWeek: 6, openTime: '09:00', closeTime: '13:00', closed: false } }),
      db.businessHours.create({ data: { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', closed: true } }),
    ])

    // Sample appointments
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)

    const dayAfterTomorrow = new Date()
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    dayAfterTomorrow.setHours(14, 0, 0, 0)

    await db.appointment.create({
      data: {
        clientId: client1.id,
        serviceId: uomoServices[0].id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000),
        status: 'CONFIRMED',
        clientName: client1.name,
        clientPhone: client1.phone,
        clientEmail: client1.email,
        groupCode: 'demo-1',
      },
    })

    await db.appointment.create({
      data: {
        clientId: client2.id,
        serviceId: donnaServices[0].id,
        startTime: dayAfterTomorrow,
        endTime: new Date(dayAfterTomorrow.getTime() + 45 * 60 * 1000),
        status: 'CONFIRMED',
        clientName: client2.name,
        clientPhone: client2.phone,
        clientEmail: client2.email,
        groupCode: 'demo-2',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Database initialized',
      data: { users: 3, services: 11, businessHours: 7, appointments: 2 },
    })
  } catch (err) {
    console.error('[API /setup POST] Error:', err)
    return NextResponse.json(
      { error: 'Errore nell\'inizializzazione', details: String(err) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const userCount = await db.user.count()
    const serviceCount = await db.service.count()
    return NextResponse.json({ initialized: userCount > 0, users: userCount, services: serviceCount })
  } catch (err) {
    console.error('[API /setup GET] Error:', err)
    return NextResponse.json({ initialized: false, error: 'Database not connected' }, { status: 500 })
  }
}
