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

    const member = await db.staff.findFirst({
      where: { id, businessId: business.id },
      include: {
        staffServices: {
          select: { serviceId: true },
        },
        _count: {
          select: { appointments: true },
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Membro del personale non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...member,
      serviceIds: member.staffServices.map((ss) => ss.serviceId),
      staffServices: undefined,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nel recupero personale:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero personale' },
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
    const { name, phone, email, role, color, active } = body

    const business = await db.business.findUnique({
      where: { accountId: session.accountId },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Attività non trovata' },
        { status: 404 }
      )
    }

    const member = await db.staff.findFirst({
      where: { id, businessId: business.id },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Membro del personale non trovato' },
        { status: 404 }
      )
    }

    const updated = await db.staff.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(color !== undefined && { color }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nell\'aggiornamento personale:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento personale' },
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

    const member = await db.staff.findFirst({
      where: { id, businessId: business.id },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Membro del personale non trovato' },
        { status: 404 }
      )
    }

    await db.staff.delete({ where: { id } })

    return NextResponse.json({ message: 'Membro del personale eliminato con successo' })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nell\'eliminazione personale:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione personale' },
      { status: 500 }
    )
  }
}
