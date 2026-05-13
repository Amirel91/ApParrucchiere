import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    // Client timezone offset in minutes (e.g., -120 for UTC+2 Italy summer)
    const tzOffset = parseInt(searchParams.get('tzOffset') || '-120')

    if (!dateStr || !serviceId) {
      return NextResponse.json(
        { error: 'Data e servizio sono richiesti' },
        { status: 400 }
      )
    }

    // Parse date components to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number)

    // Create midnight in the CLIENT's timezone as UTC timestamp
    // Example: midnight Italy (UTC+2) = previous day 22:00 UTC
    const midnightClientUTC = Date.UTC(year, month - 1, day, 0, 0, 0) + tzOffset * 60 * 1000
    const endOfDayClientUTC = midnightClientUTC + 24 * 60 * 60 * 1000

    const startOfDay = new Date(midnightClientUTC)
    const endOfDay = new Date(endOfDayClientUTC)

    // Get the day of week directly from the calendar date (not UTC timestamp)
    // to avoid off-by-one near timezone midnight boundaries
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay() // 0=Sun, 1=Mon, ... 6=Sat

    // Get business hours for this day
    const businessHours = await db.businessHours.findUnique({
      where: { dayOfWeek },
    })

    if (!businessHours || businessHours.closed) {
      return NextResponse.json({ slots: [] })
    }

    // Get the service for duration calculation
    const service = await db.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Servizio non trovato' },
        { status: 404 }
      )
    }

    const [openH, openM] = businessHours.openTime.split(':').map(Number)
    const [closeH, closeM] = businessHours.closeTime.split(':').map(Number)

    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    const totalDuration = service.durationMinutes + service.bufferMinutes

    // Get existing appointments for this day (in CLIENT's timezone range)
    const existingAppointments = await db.appointment.findMany({
      where: {
        startTime: { gte: startOfDay, lt: endOfDay },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

    // Get current time for today's comparison (in client timezone)
    const now = new Date()
    const nowClientMidnight = Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
      0, 0, 0
    ) + tzOffset * 60 * 1000
    const isToday = midnightClientUTC === nowClientMidnight
    const currentMinutesInClientTz = Math.floor(
      (now.getTime() - nowClientMidnight) / (60 * 1000)
    )

    const slots: string[] = []
    const SLOT_INCREMENT = 15

    for (let time = openMinutes; time + totalDuration <= closeMinutes; time += SLOT_INCREMENT) {
      // For today, skip past slots (add 30 min buffer for booking)
      if (isToday && time <= currentMinutesInClientTz + 30) {
        continue
      }

      // Slot start in UTC (using client's timezone)
      const slotStartUTC = midnightClientUTC + time * 60 * 1000
      // Slot end including buffer, in UTC
      const bufferEndUTC = slotStartUTC + totalDuration * 60 * 1000

      // Check overlap with existing appointments (all in UTC)
      const hasConflict = existingAppointments.some((apt) => {
        const aptStartUTC = new Date(apt.startTime).getTime()
        const aptEndUTC = new Date(apt.endTime).getTime()
        // Overlap: slot starts before appointment ends AND slot ends after appointment starts
        return slotStartUTC < aptEndUTC && bufferEndUTC > aptStartUTC
      })

      if (!hasConflict) {
        const hours = String(Math.floor(time / 60)).padStart(2, '0')
        const minutes = String(time % 60).padStart(2, '0')
        slots.push(`${hours}:${minutes}`)
      }
    }

    return NextResponse.json({ slots })
  } catch (err) {
    console.error('[API /slots GET] Error:', err)
    return NextResponse.json(
      { error: 'Errore nel calcolo degli slot' },
      { status: 500 }
    )
  }
}
