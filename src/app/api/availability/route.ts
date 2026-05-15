import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeStr = searchParams.get('time')
    const totalDuration = parseInt(searchParams.get('totalDuration') || '60')

    if (!timeStr) {
      return NextResponse.json(
        { error: 'Orario richiesto' },
        { status: 400 }
      )
    }

    const [reqHours, reqMinutes] = timeStr.split(':').map(Number)
    const reqTimeMinutes = reqHours * 60 + reqMinutes
    const reqEndMinutes = reqTimeMinutes + totalDuration

    // Get all business hours indexed by dayOfWeek
    const allHours = await db.businessHours.findMany()
    const hoursByDay: Record<number, any> = {}
    for (const bh of allHours) {
      hoursByDay[bh.dayOfWeek] = bh
    }

    // Get today for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check next 30 days
    const dates: { date: string; available: boolean; dayName: string }[] = []
    const DAYS_AHEAD = 30

    for (let i = 1; i <= DAYS_AHEAD; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dayOfWeek = d.getDay()
      const dateStr = d.toISOString().split('T')[0]

      const bh = hoursByDay[dayOfWeek]

      // Day is closed
      if (!bh || bh.closed) {
        dates.push({ date: dateStr, available: false, dayName: '' })
        continue
      }

      const [openH, openM] = bh.openTime.split(':').map(Number)
      const [closeH, closeM] = bh.closeTime.split(':').map(Number)
      const openMin = openH * 60 + openM
      const closeMin = closeH * 60 + closeM

      // Requested time doesn't fit within business hours
      if (reqTimeMinutes < openMin || reqEndMinutes > closeMin) {
        dates.push({ date: dateStr, available: false, dayName: '' })
        continue
      }

      // Check for conflicts with existing appointments
      const startOfDay = new Date(d)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(d)
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

      // Check if requested slot [reqTime, reqEnd] conflicts with any appointment
      const slotStart = new Date(d)
      slotStart.setHours(reqHours, reqMinutes, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60 * 1000)

      const hasConflict = existingAppointments.some((apt) => {
        const aptStart = new Date(apt.startTime)
        const aptEnd = new Date(apt.endTime)
        return slotStart < aptEnd && slotEnd > aptStart
      })

      dates.push({ date: dateStr, available: !hasConflict, dayName: '' })
    }

    return NextResponse.json({ dates })
  } catch (err) {
    console.error('[API /availability GET] Error:', err)
    return NextResponse.json(
      { error: 'Errore nel calcolo della disponibilita' },
      { status: 500 }
    )
  }
}
