import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { requireTenantConfig } from '@/lib/tenant'

// GET /api/bookings/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbSchema()
    await requireAdmin()
    const { id } = await params

    const config = await requireTenantConfig(request)

    const booking = await db.booking.findUnique({
      where: { id },
      include: { services: { include: { service: true } } },
    })

    if (!booking || booking.configId !== config.id) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'TenantNotFound') {
      return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

// PATCH /api/bookings/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbSchema()
    await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const config = await requireTenantConfig(request)

    // Verify booking belongs to current tenant
    const existing = await db.booking.findUnique({ where: { id } })
    if (!existing || existing.configId !== config.id) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
    }

    const booking = await db.booking.update({
      where: { id },
      data: { status: body.status },
      include: { services: { include: { service: true } } },
    })

    return NextResponse.json(booking)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'TenantNotFound') {
      return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

// DELETE /api/bookings/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbSchema()
    await requireAdmin()
    const { id } = await params

    const config = await requireTenantConfig(request)

    // Verify booking belongs to current tenant
    const existing = await db.booking.findUnique({ where: { id } })
    if (!existing || existing.configId !== config.id) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
    }

    await db.booking.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'TenantNotFound') {
      return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
