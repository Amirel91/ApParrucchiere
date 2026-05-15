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
    const { serviceIds } = body as { serviceIds?: string[] }

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

    // Delete all existing StaffService relations for this staff member
    await db.staffService.deleteMany({
      where: { staffId: id },
    })

    // Create new relations
    if (serviceIds && serviceIds.length > 0) {
      await db.staffService.createMany({
        data: serviceIds.map((serviceId) => ({
          staffId: id,
          serviceId,
        })),
      })
    }

    // Return updated staff with service IDs
    const updated = await db.staff.findFirst({
      where: { id },
      include: {
        staffServices: {
          select: { serviceId: true },
        },
      },
    })

    return NextResponse.json({
      ...updated!,
      serviceIds: updated!.staffServices.map((ss) => ss.serviceId),
      staffServices: undefined,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nell\'aggiornamento servizi personale:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento servizi del personale' },
      { status: 500 }
    )
  }
}
