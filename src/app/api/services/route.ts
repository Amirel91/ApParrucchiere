import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { active: true },
      orderBy: { durationMinutes: 'asc' },
    })
    return NextResponse.json(services)
  } catch {
    return NextResponse.json(
      { error: 'Errore nel recupero dei servizi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, durationMinutes, price, bufferMinutes } = body

    if (!name || !durationMinutes || !price) {
      return NextResponse.json(
        { error: 'Nome, durata e prezzo sono richiesti' },
        { status: 400 }
      )
    }

    const service = await db.service.create({
      data: {
        name,
        description: description || null,
        durationMinutes: parseInt(durationMinutes),
        price: parseFloat(price),
        bufferMinutes: bufferMinutes ? parseInt(bufferMinutes) : 10,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Errore nella creazione del servizio' },
      { status: 500 }
    )
  }
}
