import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const totalDuration = parseInt(searchParams.get('totalDuration') || '60')

    // Get all business hours to find the time range
    const allHours = await db.businessHours.findMany({
      where: { closed: false },
    })

    if (allHours.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    // Find max close time across all open days
    let maxCloseMinutes = 0
    let minOpenMinutes = 24 * 60

    for (const bh of allHours) {
      const [oH, oM] = bh.openTime.split(':').map(Number)
      const [cH, cM] = bh.closeTime.split(':').map(Number)
      const openMin = oH * 60 + oM
      const closeMin = cH * 60 + cM
      if (closeMin > maxCloseMinutes) maxCloseMinutes = closeMin
      if (openMin < minOpenMinutes) minOpenMinutes = openMin
    }

    const slots: string[] = []
    const SLOT_INCREMENT = 15

    for (let time = minOpenMinutes; time + totalDuration <= maxCloseMinutes; time += SLOT_INCREMENT) {
      const hours = String(Math.floor(time / 60)).padStart(2, '0')
      const minutes = String(time % 60).padStart(2, '0')
      slots.push(`${hours}:${minutes}`)
    }

    return NextResponse.json({ slots })
  } catch (err) {
    console.error('[API /time-options GET] Error:', err)
    return NextResponse.json(
      { error: 'Errore nel calcolo degli orari' },
      { status: 500 }
    )
  }
}
