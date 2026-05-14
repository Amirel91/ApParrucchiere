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

    const workingHours = await db.workingHours.findMany({
      where: { businessId: business.id },
      orderBy: { dayOfWeek: 'asc' },
    })

    return NextResponse.json(workingHours)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nel recupero orari:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero degli orari di lavoro' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()
    const { hours } = body as { hours: { dayOfWeek: number; openTime: string; closeTime: string; closed: boolean }[] }

    if (!hours || !Array.isArray(hours)) {
      return NextResponse.json(
        { error: 'Array di orari non valido' },
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

    // Delete existing working hours
    await db.workingHours.deleteMany({
      where: { businessId: business.id },
    })

    // Create new working hours
    const workingHours = await db.workingHours.createMany({
      data: hours.map((wh) => ({
        dayOfWeek: wh.dayOfWeek,
        openTime: wh.openTime,
        closeTime: wh.closeTime,
        closed: wh.closed ?? false,
        businessId: business.id,
      })),
    })

    // Return the created hours
    const created = await db.workingHours.findMany({
      where: { businessId: business.id },
      orderBy: { dayOfWeek: 'asc' },
    })

    return NextResponse.json(created)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nell\'aggiornamento orari:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento degli orari di lavoro' },
      { status: 500 }
    )
  }
}
