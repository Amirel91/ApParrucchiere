import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatori' },
        { status: 400 }
      )
    }

    const account = await db.account.findUnique({
      where: { email },
      include: { business: true },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    if (account.password !== password) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await db.session.create({
      data: {
        token,
        accountId: account.id,
        expiresAt,
      },
    })

    return NextResponse.json({
      token,
      account: {
        id: account.id,
        email: account.email,
        name: account.name,
        phone: account.phone,
      },
      business: account.business,
    })
  } catch (error) {
    console.error('Errore durante il login:', error)
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    )
  }
}
