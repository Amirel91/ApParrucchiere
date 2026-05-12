import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const userId = searchParams.get('userId')

    if (role === 'CLIENT' && userId) {
      const appointments = await db.appointment.findMany({
        where: { clientId: userId },
        include: { service: true },
        orderBy: { startTime: 'desc' },
      })
      return NextResponse.json(appointments)
    }

    // Admin: return all appointments
    const appointments = await db.appointment.findMany({
      include: { service: true, client: { select: { name: true, email: true, phone: true } } },
      orderBy: { startTime: 'desc' },
    })
    return NextResponse.json(appointments)
  } catch {
    return NextResponse.json(
      { error: 'Errore nel recupero degli appuntamenti' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, serviceId, startTime, clientName, clientPhone, clientEmail } = body

    if (!clientId || !serviceId || !startTime || !clientName) {
      return NextResponse.json(
        { error: 'Dati mancanti per la prenotazione' },
        { status: 400 }
      )
    }

    const service = await db.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Servizio non trovato' },
        { status: 404 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000)

    const appointment = await db.appointment.create({
      data: {
        clientId,
        serviceId,
        startTime: start,
        endTime: end,
        status: 'CONFIRMED',
        clientName,
        clientPhone: clientPhone || null,
        clientEmail: clientEmail || null,
      },
      include: { service: true },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'appuntamento' },
      { status: 500 }
    )
  }
}
