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

    const staff = await db.staff.findMany({
      where: { businessId: business.id },
      include: {
        staffServices: {
          select: { serviceId: true },
        },
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = staff.map((s) => ({
      ...s,
      serviceIds: s.staffServices.map((ss) => ss.serviceId),
      staffServices: undefined,
    }))

    return NextResponse.json(result)
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

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()
    const { name, phone, email, role, color, active } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Il nome è obbligatorio' },
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

    const member = await db.staff.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        role: role || 'OPERATOR',
        color: color || '#6366f1',
        active: active ?? true,
        businessId: business.id,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nella creazione personale:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione personale' },
      { status: 500 }
    )
  }
}
