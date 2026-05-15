import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { workingHoursSchema } from '@/lib/validations'
import { getTenantConfig, requireTenantConfig } from '@/lib/tenant'

// GET /api/working-hours - Public: get working hours
export async function GET(request: NextRequest) {
  try {
    await ensureDbSchema()
    const config = await getTenantConfig(request)

    if (!config) {
      // Return default hours if no tenant context
      const defaults = Array.from({ length: 7 }, (_, i) => ({
        id: '',
        dayOfWeek: i + 1,
        openTime: i < 5 ? '09:00' : '09:00',
        closeTime: i < 5 ? '18:00' : '13:00',
        closed: i === 6,
      }))
      return NextResponse.json(defaults)
    }

    const hours = await db.workingHours.findMany({
      where: { configId: config.id },
      orderBy: { dayOfWeek: 'asc' },
    })

    // Ensure all 7 days exist
    const result = Array.from({ length: 7 }, (_, i) => {
      const existing = hours.find(h => h.dayOfWeek === i + 1)
      return existing || {
        id: '',
        dayOfWeek: i + 1,
        openTime: '09:00',
        closeTime: i < 6 ? '18:00' : '13:00',
        closed: i === 6,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/working-hours error:', error)
    return NextResponse.json(
      { error: 'Errore nel caricamento degli orari' },
      { status: 500 }
    )
  }
}

// PUT /api/working-hours - Admin: update working hours
export async function PUT(request: NextRequest) {
  try {
    await ensureDbSchema()
    await requireAdmin()

    const body = await request.json()
    const hoursData = Array.isArray(body) ? body : [body]

    // Validate all entries
    for (const entry of hoursData) {
      workingHoursSchema.parse(entry)
    }

    const config = await requireTenantConfig(request)

    // Upsert each day
    const results: Awaited<ReturnType<typeof db.workingHours.update>>[] = []
    for (const entry of hoursData) {
      const existing = await db.workingHours.findUnique({
        where: {
          configId_dayOfWeek: {
            configId: config.id,
            dayOfWeek: entry.dayOfWeek,
          },
        },
      })

      if (existing) {
        const updated = await db.workingHours.update({
          where: { id: existing.id },
          data: {
            openTime: entry.openTime,
            closeTime: entry.closeTime,
            closed: entry.closed,
          },
        })
        results.push(updated)
      } else {
        const created = await db.workingHours.create({
          data: {
            configId: config.id,
            dayOfWeek: entry.dayOfWeek,
            openTime: entry.openTime,
            closeTime: entry.closeTime,
            closed: entry.closed,
          },
        })
        results.push(created)
      }
    }

    return NextResponse.json(results)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'TenantNotFound') {
      return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
    }
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 })
    }
    console.error('PUT /api/working-hours error:', error)
    return NextResponse.json(
      { error: "Errore nell'aggiornamento degli orari" },
      { status: 500 }
    )
  }
}
