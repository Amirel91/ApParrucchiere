import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const appointment = await db.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { service: true },
    })

    return NextResponse.json(appointment)
  } catch {
    return NextResponse.json(
      { error: 'Errore nell\'annullamento dell\'appuntamento' },
      { status: 500 }
    )
  }
}
