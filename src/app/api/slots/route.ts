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
    const serviceId = searchParams.get('serviceId')
    const staffId = searchParams.get('staffId')
    const tzOffset = parseInt(searchParams.get('tzOffset') || '0', 10)

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Data e servizio sono obbligatori' },
        { status: 400 }
      )
    }

    // Get service duration
    const service = await db.service.findFirst({
      where: { id: serviceId, businessId: business.id },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Servizio non trovato' },
        { status: 404 }
      )
    }

    const serviceDuration = service.durationMinutes + service.bufferMinutes
    const SLOT_MINUTES = 15

    // Parse date in local timezone
    const localDate = new Date(date)
    const dayOfWeek = localDate.getDay()

    // Get working hours for this day
    const wh = await db.workingHours.findUnique({
      where: {
        businessId_dayOfWeek: {
          businessId: business.id,
          dayOfWeek,
        },
      },
    })

    if (!wh || wh.closed) {
      return NextResponse.json({ slots: [], date, dayOfWeek, closed: true })
    }

    // Parse working hours and apply timezone offset to get UTC ranges
    const [openH, openM] = wh.openTime.split(':').map(Number)
    const [closeH, closeM] = wh.closeTime.split(':').map(Number)

    // Build the date boundaries using the provided timezone offset
    // tzOffset is in minutes (e.g., -120 for UTC+2 in winter Italy)
    // We construct the local date-time then adjust to UTC
    const openTimeLocal = new Date(localDate)
    openTimeLocal.setHours(openH, openM, 0, 0)
    openTimeLocal.setMinutes(openTimeLocal.getMinutes() - tzOffset)

    const closeTimeLocal = new Date(localDate)
    closeTimeLocal.setHours(closeH, closeM, 0, 0)
    closeTimeLocal.setMinutes(closeTimeLocal.getMinutes() - tzOffset)

    // Get existing appointments for this business on this date
    const whereClause: Record<string, unknown> = {
      businessId: business.id,
      startTime: { gte: openTimeLocal, lt: closeTimeLocal },
      status: { notIn: ['CANCELLED'] },
    }

    if (staffId) {
      whereClause.staffId = staffId
    }

    const appointments = await db.appointment.findMany({
      where: whereClause,
      select: {
        startTime: true,
        endTime: true,
        staffId: true,
      },
    })

    // Generate 15-minute slots
    const slots: string[] = []
    const current = new Date(openTimeLocal)

    while (current.getTime() + serviceDuration * 60 * 1000 <= closeTimeLocal.getTime()) {
      const slotEnd = new Date(current.getTime() + serviceDuration * 60 * 1000)

      // Check if slot overlaps with any existing appointment
      const hasConflict = appointments.some((apt) => {
        if (staffId && apt.staffId !== staffId) return false
        return current < new Date(apt.endTime) && slotEnd > new Date(apt.startTime)
      })

      if (!hasConflict) {
        slots.push(current.toISOString())
      }

      current.setMinutes(current.getMinutes() + SLOT_MINUTES)
    }

    return NextResponse.json({
      slots,
      date,
      dayOfWeek,
      closed: false,
      workingHours: { open: wh.openTime, close: wh.closeTime },
      serviceDuration: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nel calcolo disponibilità:', error)
    return NextResponse.json(
      { error: 'Errore nel calcolo della disponibilità' },
      { status: 500 }
    )
  }
}
