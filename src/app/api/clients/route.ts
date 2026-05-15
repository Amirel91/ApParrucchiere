import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const business = await db.business.findUnique({
      where: { accountId: session.accountId },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Attività non trovata' },
        { status: 404 }
      )
    }

    const clients = await db.client.findMany({
      where: { businessId: business.id },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(clients)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nel recupero clienti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero clienti' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()
    const { firstName, lastName, phone, email, notes, gender } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Nome e cognome sono obbligatori' },
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

    // Check uniqueness if phone provided
    if (phone) {
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

    const client = await db.client.create({
      data: {
        firstName,
        lastName,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        gender: gender || null,
        businessId: business.id,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nella creazione cliente:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione cliente' },
      { status: 500 }
    )
  }
}
