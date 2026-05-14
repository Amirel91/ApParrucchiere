import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id, vid } = await params
    const body = await request.json()
    const { name, description, durationMinutes, price, active } = body

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

    const variant = await db.serviceVariant.findFirst({
      where: { id: vid, serviceId: id },
    })

    if (!variant) {
      return NextResponse.json(
        { error: 'Variante non trovata' },
        { status: 404 }
      )
    }

    const updated = await db.serviceVariant.update({
      where: { id: vid },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(durationMinutes !== undefined && { durationMinutes }),
        ...(price !== undefined && { price }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nell\'aggiornamento variante:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento variante' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id, vid } = await params

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

    const variant = await db.serviceVariant.findFirst({
      where: { id: vid, serviceId: id },
    })

    if (!variant) {
      return NextResponse.json(
        { error: 'Variante non trovata' },
        { status: 404 }
      )
    }

    await db.serviceVariant.delete({ where: { id: vid } })

    return NextResponse.json({ message: 'Variante eliminata con successo' })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nell\'eliminazione variante:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione variante' },
      { status: 500 }
    )
  }
}
