import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const business = await db.business.findUnique({
      where: { accountId: session.accountId },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Attività non trovata' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const staffId = searchParams.get('staffId')

    const where: Record<string, unknown> = { businessId: business.id }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)

      where.startTime = {
        gte: startDate,
        lt: endDate,
      }
    }

    if (staffId) {
      where.staffId = staffId
    }

    const appointments = await db.appointment.findMany({
      where,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        service: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        variant: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        staff: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json(appointments)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nel recupero appuntamenti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero appuntamenti' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()
    const {
      clientId,
      serviceId,
      variantId,
      staffId,
      startTime,
      endTime,
      status,
      notes,
      clientNotes,
    } = body

    if (!clientId || !serviceId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Cliente, servizio, data inizio e data fine sono obbligatori' },
        { status: 400 }
      )
    }

    const business = await db.business.findUnique({
      where: { accountId: session.accountId },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Attività non trovata' },
        { status: 404 }
      )
    }

    // Verify client belongs to business
    const client = await db.client.findFirst({
      where: { id: clientId, businessId: business.id },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    // Verify service belongs to business
    const service = await db.service.findFirst({
      where: { id: serviceId, businessId: business.id },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Servizio non trovato' },
        { status: 404 }
      )
    }

    // Verify variant if provided
    if (variantId) {
      const variant = await db.serviceVariant.findFirst({
        where: { id: variantId, serviceId },
      })
      if (!variant) {
        return NextResponse.json(
          { error: 'Variante non trovata' },
          { status: 404 }
        )
      }
    }

    // Verify staff if provided
    if (staffId) {
      const staff = await db.staff.findFirst({
        where: { id: staffId, businessId: business.id },
      })
      if (!staff) {
        return NextResponse.json(
          { error: 'Membro del personale non trovato' },
          { status: 404 }
        )
      }
    }

    const appointment = await db.appointment.create({
      data: {
        clientId,
        serviceId,
        variantId: variantId || null,
        staffId: staffId || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || 'CONFIRMED',
        notes: notes || null,
        clientNotes: clientNotes || null,
        businessId: business.id,
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        service: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        variant: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        staff: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nella creazione appuntamento:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione appuntamento' },
      { status: 500 }
    )
  }
}
