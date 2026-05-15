import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { serviceSchema } from '@/lib/validations'
import { getTenantConfig, requireTenantConfig } from '@/lib/tenant'

// GET /api/services - Public: get active services (for client booking)
export async function GET(request: NextRequest) {
  try {
    await ensureDbSchema()
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('all') === 'true'

    const config = await getTenantConfig(request)
    if (!config) {
      return NextResponse.json([])
    }

    const services = await db.service.findMany({
      where: {
        configId: config.id,
        ...(includeInactive ? {} : { active: true }),
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('GET /api/services error:', error)
    return NextResponse.json({ error: 'Errore nel caricamento dei servizi' }, { status: 500 })
  }
}

// POST /api/services - Admin: create service
export async function POST(request: NextRequest) {
  try {
    await ensureDbSchema()
    await requireAdmin()
    const body = await request.json()
    const data = serviceSchema.parse(body)

    const config = await requireTenantConfig(request)

    const service = await db.service.create({
      data: {
        ...data,
        configId: config.id,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'TenantNotFound') {
      return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
    }
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Dati non validi', details: error }, { status: 400 })
    }
    console.error('POST /api/services error:', error)
    return NextResponse.json({ error: 'Errore nella creazione del servizio' }, { status: 500 })
  }
}
