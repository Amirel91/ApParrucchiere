import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { closedDateSchema } from '@/lib/validations'

// GET /api/closed-dates - Public: get all closed dates
// Supports ?from=YYYY-MM-DD&to=YYYY-MM-DD for filtering
export async function GET(request: NextRequest) {
  try {
    await ensureDbSchema()
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const config = await db.businessConfig.findFirst({
      select: { id: true },
    })

    if (!config) {
      return NextResponse.json([])
    }

    const where: Record<string, unknown> = { configId: config.id }

    if (from && to) {
      where.date = { gte: from, lte: to }
    } else if (from) {
      where.date = { gte: from }
    } else if (to) {
      where.date = { lte: to }
    }

    const closedDates = await db.closedDate.findMany({
      where,
      orderBy: { date: 'asc' },
    })

    return NextResponse.json(closedDates)
  } catch (error) {
    console.error('GET /api/closed-dates error:', error)
    return NextResponse.json({ error: 'Errore nel caricamento delle date chiuse' }, { status: 500 })
  }
}

// POST /api/closed-dates - Admin: add a closed date
export async function POST(request: NextRequest) {
  try {
    await ensureDbSchema()
    await requireAdmin()
    const body = await request.json()
    const data = closedDateSchema.parse(body)

    const config = await db.businessConfig.findFirst({
      select: { id: true },
    })

    if (!config) {
      return NextResponse.json({ error: 'Configurazione non trovata' }, { status: 404 })
    }

    // Check if already exists
    const existing = await db.closedDate.findUnique({
      where: {
        configId_date: {
          configId: config.id,
          date: data.date,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Questa data e gia chiusa' }, { status: 409 })
    }

    const closedDate = await db.closedDate.create({
      data: {
        configId: config.id,
        date: data.date,
        reason: data.reason || '',
      },
    })

    return NextResponse.json(closedDate, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 })
    }
    console.error('POST /api/closed-dates error:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiunta della data chiusa' }, { status: 500 })
  }
}

// DELETE /api/closed-dates - Admin: remove a closed date
export async function DELETE(request: NextRequest) {
  try {
    await ensureDbSchema()
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const id = searchParams.get('id')

    if (!date && !id) {
      return NextResponse.json({ error: 'Specificare date o id' }, { status: 400 })
    }

    if (id) {
      await db.closedDate.delete({
        where: { id },
      })
    } else {
      const config = await db.businessConfig.findFirst({
        select: { id: true },
      })
      if (!config) {
        return NextResponse.json({ error: 'Configurazione non trovata' }, { status: 404 })
      }

      await db.closedDate.deleteMany({
        where: {
          configId: config.id,
          date: date!,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    console.error('DELETE /api/closed-dates error:', error)
    return NextResponse.json({ error: 'Errore nella rimozione della data chiusa' }, { status: 500 })
  }
}
