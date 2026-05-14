import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { serviceSchema } from '@/lib/validations'

// GET /api/services - Public: get active services (for client booking)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('all') === 'true'
    
    // Check if this is an admin request
    const authHeader = request.headers.get('cookie') || ''
    const isAdmin = authHeader.includes('admin_token')

    let config = await db.businessConfig.findFirst()
    if (!config) {
      return NextResponse.json([])
    }

    const services = await db.service.findMany({
      where: {
        configId: config.id,
        ...(isAdmin || includeInactive ? {} : { active: true }),
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
    await requireAdmin()
    const body = await request.json()
    const data = serviceSchema.parse(body)

    const config = await db.businessConfig.findFirst()
    if (!config) {
      return NextResponse.json({ error: 'Configurazione non trovata' }, { status: 404 })
    }

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
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Dati non validi', details: error }, { status: 400 })
    }
    console.error('POST /api/services error:', error)
    return NextResponse.json({ error: 'Errore nella creazione del servizio' }, { status: 500 })
  }
}
