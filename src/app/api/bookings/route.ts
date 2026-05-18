import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { bookingSchema } from '@/lib/validations'
import { isSlotAvailable, findFreeResource } from '@/lib/slot-algorithm'
import { getTenantConfig, requireTenantConfig } from '@/lib/tenant'

// GET /api/bookings - Admin: get all bookings
export async function GET(request: NextRequest) {
  try {
    await ensureDbSchema()
    await requireAdmin()

    const config = await requireTenantConfig(request)

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('from')
    const dateTo = searchParams.get('to')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { configId: config.id }
    if (dateFrom && dateTo) {
      where.startTime = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      }
    } else if (dateFrom) {
      where.startTime = { gte: new Date(dateFrom) }
    }
    if (status) {
      where.status = status
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        services: {
          include: { service: true },
        },
        resource: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json(bookings)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'TenantNotFound') {
      return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
    }
    console.error('GET /api/bookings error:', error)
    return NextResponse.json({ error: 'Errore nel caricamento delle prenotazioni' }, { status: 500 })
  }
}

// POST /api/bookings - Public: create booking
export async function POST(request: NextRequest) {
  try {
    await ensureDbSchema()
    const body = await request.json()
    const data = bookingSchema.parse(body)

    const config = await getTenantConfig(request)
    if (!config) {
      return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
    }

    // Get services to calculate total price and duration
    const services = await db.service.findMany({
      where: { id: { in: data.serviceIds }, configId: config.id },
    })

    if (services.length !== data.serviceIds.length) {
      return NextResponse.json({ error: 'Uno o più servizi non trovati' }, { status: 400 })
    }

    const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes + (s.cleanupMinutes || 0) + (s.bufferMinutes || 0), 0)
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0)

    // Double-check slot availability (prevent race conditions)
    const available = await isSlotAvailable(data.date, data.time, totalDuration, config.id)
    if (!available) {
      return NextResponse.json(
        { error: 'Lo slot selezionato non è più disponibile. Si prega di selezionarne un altro.' },
        { status: 409 }
      )
    }

    const startTime = new Date(`${data.date}T${data.time}:00`)
    const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000)

    // Auto-assign to the first available resource
    const resourceId = await findFreeResource(data.date, data.time, totalDuration, config.id)

    // Create booking with services
    const booking = await db.booking.create({
      data: {
        customerName: data.customer.customerName,
        customerSurname: data.customer.customerSurname,
        customerPhone: data.customer.customerPhone,
        customerEmail: data.customer.customerEmail || null,
        startTime,
        endTime,
        totalPrice,
        status: 'confirmed',
        configId: config.id,
        ...(resourceId && { resourceId }),
        services: {
          create: data.serviceIds.map((serviceId: string) => ({
            serviceId,
          })),
        },
      },
      include: {
        services: { include: { service: true } },
        resource: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Dati non validi', details: error }, { status: 400 })
    }
    console.error('POST /api/bookings error:', error)
    return NextResponse.json({ error: 'Errore nella creazione della prenotazione' }, { status: 500 })
  }
}
