import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const { clientId, serviceId, variantId, staffId, startTime, endTime, status, notes, clientNotes } = body

    const business = await db.business.findUnique({
      where: { accountId: session.accountId },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Attività non trovata' },
        { status: 404 }
      )
    }

    const appointment = await db.appointment.findFirst({
      where: { id, businessId: business.id },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appuntamento non trovato' },
        { status: 404 }
      )
    }

    const updated = await db.appointment.update({
      where: { id },
      data: {
        ...(clientId !== undefined && { clientId }),
        ...(serviceId !== undefined && { serviceId }),
        ...(variantId !== undefined && { variantId }),
        ...(staffId !== undefined && { staffId }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(clientNotes !== undefined && { clientNotes }),
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        service: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        variant: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        staff: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nell\'aggiornamento appuntamento:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento appuntamento' },
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

    const appointment = await db.appointment.findFirst({
      where: { id, businessId: business.id },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appuntamento non trovato' },
        { status: 404 }
      )
    }

    // Cancel instead of delete
    const cancelled = await db.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        service: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        variant: {
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        staff: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    return NextResponse.json(cancelled)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nella cancellazione appuntamento:', error)
    return NextResponse.json(
      { error: 'Errore nella cancellazione appuntamento' },
      { status: 500 }
    )
  }
}
