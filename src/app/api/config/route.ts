import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { configSchema } from '@/lib/validations'

// GET /api/config - Public: get business config (for client homepage)
export async function GET() {
  try {
    await ensureDbSchema()
    let config = await db.businessConfig.findFirst()
    
    // Auto-create default if none exists
    if (!config) {
      config = await db.businessConfig.create({
        data: {
          shopName: 'Il Mio Negozio',
          shopDescription: '',
          businessType: 'parrucchiere',
          selectedImages: '[]',
        },
      })
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
    await ensureDbSchema()
    await requireAdmin()
    const body = await request.json()
    const data = configSchema.parse(body)

    let config = await db.businessConfig.findFirst()

    if (!config) {
      config = await db.businessConfig.create({ data })
    } else {
      config = await db.businessConfig.update({
        where: { id: config.id },
        data,
      })
    }

    return NextResponse.json(config)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 })
    }
    console.error('PUT /api/config error:', error)
    return NextResponse.json({ error: 'Errore nell\'aggiornamento della configurazione' }, { status: 500 })
  }
}
