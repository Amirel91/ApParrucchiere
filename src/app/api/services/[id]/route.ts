import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, durationMinutes, price, bufferMinutes, active } = body

    const service = await db.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(durationMinutes && { durationMinutes: parseInt(durationMinutes) }),
        ...(price && { price: parseFloat(price) }),
        ...(bufferMinutes !== undefined && { bufferMinutes: parseInt(bufferMinutes) }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json(service)
  } catch {
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del servizio' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.service.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del servizio' },
      { status: 500 }
    )
  }
}
