import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/slot-algorithm'

// GET /api/slots?date=YYYY-MM-DD&duration=60
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const duration = searchParams.get('duration')

    if (!date || !duration) {
      return NextResponse.json(
        { error: 'Parametri date e duration sono obbligatori' },
        { status: 400 }
      )
    }

    const durationMinutes = parseInt(duration, 10)
    if (isNaN(durationMinutes) || durationMinutes < 5) {
      return NextResponse.json(
        { error: 'La durata deve essere un numero valido (minimo 5 minuti)' },
        { status: 400 }
      )
    }

    const result = await getAvailableSlots(date, durationMinutes)
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/slots error:', error)
    return NextResponse.json({ error: 'Errore nel calcolo degli slot disponibili' }, { status: 500 })
  }
}
