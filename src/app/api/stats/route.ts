import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    const config = await db.businessConfig.findFirst()
    if (!config) {
      return NextResponse.json({ bookingsCount: 0, revenue: 0, totalBookings: 0, totalRevenue: 0, topServices: [] })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const todayBookings = await db.booking.findMany({
      where: {
        configId: config.id,
        startTime: { gte: todayStart },
        status: { in: ['confirmed', 'pending'] },
      },
      include: { services: { include: { service: true } } },
    })

    const revenue = todayBookings.reduce((sum, b) => sum + b.totalPrice, 0)

    // Top services
    const serviceCount: Record<string, { name: string; count: number; revenue: number }> = {}
    for (const b of todayBookings) {
      for (const bs of b.services) {
        if (!serviceCount[bs.service.name]) {
          serviceCount[bs.service.name] = { name: bs.service.name, count: 0, revenue: 0 }
        }
        serviceCount[bs.service.name].count++
        serviceCount[bs.service.name].revenue += bs.service.price
      }
    }
    const topServices = Object.values(serviceCount).sort((a, b) => b.count - a.count).slice(0, 5)

    const totalBookings = await db.booking.count({
      where: { configId: config.id, status: { in: ['confirmed', 'pending'] } },
    })
    const allRevenue = await db.booking.aggregate({
      where: { configId: config.id, status: { in: ['confirmed', 'pending'] } },
      _sum: { totalPrice: true },
    })

    return NextResponse.json({
      bookingsCount: todayBookings.length,
      revenue,
      totalBookings,
      totalRevenue: allRevenue._sum.totalPrice || 0,
      topServices,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
