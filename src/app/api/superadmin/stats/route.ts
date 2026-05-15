import { NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/auth'

/**
 * GET /api/superadmin/stats
 * Returns platform-wide macro statistics.
 */
export async function GET() {
  try {
    await requireSuperAdmin()
    await ensureDbSchema()

    const [
      totalTenants,
      activeTenants,
      totalBookings,
      suspendedTenants,
    ] = await Promise.all([
      db.tenant.count(),
      db.tenant.count({ where: { active: true } }),
      db.booking.count(),
      db.tenant.count({ where: { active: false } }),
    ])

    const monthlyRevenue = activeTenants * 40 // 40€ per active tenant

    return NextResponse.json({
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalBookings,
      monthlyRevenue,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'SuperAdminUnauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    console.error('GET /api/superadmin/stats error:', error)
    return NextResponse.json({ error: 'Errore nel caricamento delle statistiche' }, { status: 500 })
  }
}
