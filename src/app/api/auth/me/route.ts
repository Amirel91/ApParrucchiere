import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const fullAccount = await db.account.findUnique({
      where: { id: session.accountId },
      include: {
        business: {
          include: {
            services: {
              select: { id: true },
            },
            staff: {
              select: { id: true },
            },
            clients: {
              select: { id: true },
            },
            appointments: {
              select: { id: true },
            },
          },
        },
      },
    })

    if (!fullAccount || !fullAccount.business) {
      return NextResponse.json(
        { error: 'Account o attività non trovati' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      account: {
        id: fullAccount.id,
        email: fullAccount.email,
        name: fullAccount.name,
        phone: fullAccount.phone,
        createdAt: fullAccount.createdAt,
      },
      business: {
        ...fullAccount.business,
        _counts: {
          services: fullAccount.business.services.length,
          staff: fullAccount.business.staff.length,
          clients: fullAccount.business.clients.length,
          appointments: fullAccount.business.appointments.length,
        },
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Non autenticato') {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    console.error('Errore nel recupero dati sessione:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dati' },
      { status: 500 }
    )
  }
}
