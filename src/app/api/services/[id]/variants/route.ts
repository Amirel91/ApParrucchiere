import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    const business = await db.business.findUnique({
      where: { accountId: session.accountId },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Attività non trovata' },
        { status: 404 }
      )
    }

    const service = await db.service.findFirst({
      where: { id, businessId: business.id },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Servizio non trovato' },
        { status: 404 }
      )
    }

    const variants = await db.serviceVariant.findMany({
      where: { serviceId: id },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(variants)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nel recupero varianti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero varianti' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const { name, description, durationMinutes, price, active } = body

    if (!name || durationMinutes === undefined || price === undefined) {
      return NextResponse.json(
        { error: 'Nome, durata e prezzo sono obbligatori' },
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

    const service = await db.service.findFirst({
      where: { id, businessId: business.id },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Servizio non trovato' },
        { status: 404 }
      )
    }

    const variant = await db.serviceVariant.create({
      data: {
        name,
        description: description || null,
        durationMinutes,
        price,
        active: active ?? true,
        serviceId: id,
      },
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nella creazione variante:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione variante' },
      { status: 500 }
    )
  }
}
