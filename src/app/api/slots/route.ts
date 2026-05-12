import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')

    if (!dateStr || !serviceId) {
      return NextResponse.json(
        { error: 'Data e servizio sono richiesti' },
        { status: 400 }
      )
    }

    const date = new Date(dateStr + 'T00:00:00')
    const dayOfWeek = date.getDay()

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

    // Get existing appointments for this day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

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

    // Get current time for today's comparison
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const slots: string[] = []
    const SLOT_INCREMENT = 15

    for (let time = openMinutes; time + totalDuration <= closeMinutes; time += SLOT_INCREMENT) {
      // For today, skip past slots (add some buffer for booking)
      if (isToday && time <= currentMinutes + 30) {
        continue
      }

      const slotStart = new Date(date)
      slotStart.setHours(Math.floor(time / 60), time % 60, 0, 0)

      const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60 * 1000)

      // Check overlap with existing appointments
      const hasConflict = existingAppointments.some((apt) => {
        const aptStart = new Date(apt.startTime)
        const aptEnd = new Date(apt.endTime)

        // The new slot's available window (including buffer) must not overlap
        const bufferEnd = new Date(slotStart.getTime() + totalDuration * 60 * 1000)
        return slotStart < aptEnd && bufferEnd > aptStart
      })

      if (!hasConflict) {
        const hours = String(Math.floor(time / 60)).padStart(2, '0')
        const minutes = String(time % 60).padStart(2, '0')
        slots.push(`${hours}:${minutes}`)
      }
    }

    return NextResponse.json({ slots })
  } catch {
    return NextResponse.json(
      { error: 'Errore nel calcolo degli slot' },
      { status: 500 }
    )
  }
}
