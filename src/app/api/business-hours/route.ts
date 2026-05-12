import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const hours = await db.businessHours.findMany({
      orderBy: { dayOfWeek: 'asc' },
    })
    return NextResponse.json(hours)
  } catch {
    return NextResponse.json(
      { error: 'Errore nel recupero degli orari' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { hours } = body

    if (!Array.isArray(hours)) {
      return NextResponse.json(
        { error: 'Formato orari non valido' },
        { status: 400 }
      )
    }

    // Update each day's hours
    await Promise.all(
      hours.map(
        (h: { dayOfWeek: number; openTime: string; closeTime: string; closed: boolean }) =>
          db.businessHours.upsert({
            where: { dayOfWeek: h.dayOfWeek },
            update: {
              openTime: h.openTime,
              closeTime: h.closeTime,
              closed: h.closed,
            },
            create: {
              dayOfWeek: h.dayOfWeek,
              openTime: h.openTime,
              closeTime: h.closeTime,
              closed: h.closed,
            },
          })
      )
    )

    const updated = await db.businessHours.findMany({
      orderBy: { dayOfWeek: 'asc' },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento degli orari' },
      { status: 500 }
    )
  }
}
