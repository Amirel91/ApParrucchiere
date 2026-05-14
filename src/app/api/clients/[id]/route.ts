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

    const client = await db.client.findFirst({
      where: { id, businessId: business.id },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nel recupero cliente:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero cliente' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const { firstName, lastName, phone, email, notes, gender } = body

    const business = await db.business.findUnique({
      where: { accountId: session.accountId },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Attività non trovata' },
        { status: 404 }
      )
    }

    const client = await db.client.findFirst({
      where: { id, businessId: business.id },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    // Check phone uniqueness if being changed
    if (phone && phone !== client.phone) {
      const existing = await db.client.findUnique({
        where: {
          businessId_phone: {
            businessId: business.id,
            phone,
          },
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Esiste già un cliente con questo numero di telefono' },
          { status: 409 }
        )
      }
    }

    const updated = await db.client.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(notes !== undefined && { notes }),
        ...(gender !== undefined && { gender }),
      },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nell\'aggiornamento cliente:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento cliente' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const client = await db.client.findFirst({
      where: { id, businessId: business.id },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    await db.client.delete({ where: { id } })

    return NextResponse.json({ message: 'Cliente eliminato con successo' })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nell\'eliminazione cliente:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione cliente' },
      { status: 500 }
    )
  }
}
