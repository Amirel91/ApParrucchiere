import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/auth'

/**
 * GET /api/superadmin/tenants
 * Lists all tenants with their booking count.
 */
export async function GET() {
  try {
    await requireSuperAdmin()
    await ensureDbSchema()

    const tenants = await db.tenant.findMany({
      include: {
        _count: {
          select: {
            bookings: true,
            admins: true,
          },
        },
        config: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map to a clean response format
    const mapped = tenants.map(t => ({
      id: t.id,
      slug: t.slug,
      businessName: t.businessName,
      ownerName: t.ownerName,
      ownerEmail: t.ownerEmail,
      active: t.active,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      bookingCount: t._count.bookings,
      adminCount: t._count.admins,
      hasConfig: !!t.config,
    }))

    return NextResponse.json(mapped)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'SuperAdminUnauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    console.error('GET /api/superadmin/tenants error:', error)
    return NextResponse.json({ error: 'Errore nel caricamento dei tenant' }, { status: 500 })
  }
}
