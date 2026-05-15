import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { configSchema } from '@/lib/validations'
import { getTenantConfig, requireTenantConfig } from '@/lib/tenant'

// GET /api/config - Public: get business config (for client homepage)
export async function GET(request: NextRequest) {
  try {
    await ensureDbSchema()
    const config = await getTenantConfig(request)

    if (!config) {
      return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('GET /api/config error:', error)
    return NextResponse.json({ error: 'Errore nel caricamento della configurazione' }, { status: 500 })
  }
}

// PUT /api/config - Admin: update business config
export async function PUT(request: NextRequest) {
  try {
    // Step 1: Ensure DB schema is up to date
    const migration = await ensureDbSchema()
    if (!migration.ok) {
      console.error('PUT /api/config: migration failed', migration.results)
      return NextResponse.json(
        { error: 'Errore di migrazione database. Riprova tra qualche secondo.', details: migration.results },
        { status: 500 }
      )
    }

    // Step 2: Auth check
    await requireAdmin()

    // Step 3: Parse and validate
    const body = await request.json()

    console.log('PUT /api/config: received fields', Object.keys(body))

    let data: Record<string, unknown>
    try {
      data = configSchema.parse(body) as Record<string, unknown>
    } catch (zodErr: unknown) {
      if (zodErr && typeof zodErr === 'object' && 'issues' in zodErr) {
        const issues = (zodErr as { issues: Array<{ path: (string | number)[]; message: string }> }).issues
        console.error('PUT /api/config: validation error', issues.map(i => `${i.path.join('.')}: ${i.message}`))
        return NextResponse.json({ error: 'Dati non validi', details: issues }, { status: 400 })
      }
      throw zodErr
    }

    // Step 4: Update tenant's config
    const config = await requireTenantConfig(request)

    const updated = await db.businessConfig.update({
      where: { id: config.id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'TenantNotFound') {
      return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
    }
    console.error('PUT /api/config error:', error)
    return NextResponse.json(
      { error: "Errore nell'aggiornamento della configurazione", debug: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
