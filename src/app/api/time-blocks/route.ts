import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { requireTenantConfig } from '@/lib/tenant'

/**
 * POST /api/time-blocks
 * Create a manual time block (pause, phone appointment, etc.)
 * Stored as a booking with status="blocked".
 */
export async function POST(request: NextRequest) {
  try {
    await ensureDbSchema()
    await requireAdmin()

    const config = await requireTenantConfig(request)

    const body = await request.json()
    const { title, date, startTime, durationMinutes } = body

    if (!title || !date || !startTime || !durationMinutes) {
      return NextResponse.json({ error: 'Compila tutti i campi' }, { status: 400 })
    }

    const mins = parseInt(durationMinutes, 10)
    if (isNaN(mins) || mins < 5 || mins > 480) {
      return NextResponse.json({ error: 'Durata non valida (5-480 min)' }, { status: 400 })
    }

    const start = new Date(`${date}T${startTime}:00`)
    const end = new Date(start.getTime() + mins * 60 * 1000)

    const block = await db.booking.create({
      data: {
        customerName: title,
        customerSurname: '',
        customerPhone: '',
        startTime: start,
        endTime: end,
        totalPrice: 0,
        status: 'blocked',
        configId: config.id,
      },
    })

    return NextResponse.json(block, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'TenantNotFound') {
      return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
    }
    console.error('POST /api/time-blocks error:', error)
    return NextResponse.json({ error: 'Errore nella creazione del blocco' }, { status: 500 })
  }
}
