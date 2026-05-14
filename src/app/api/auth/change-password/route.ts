import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, verifyPassword, hashPassword } from '@/lib/auth'
import { changePasswordSchema } from '@/lib/validations'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const data = changePasswordSchema.parse(body)

    const user = await db.adminUser.findUnique({ where: { id: session.id } })
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    const isValid = await verifyPassword(data.currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 401 })
    }

    const newHash = await hashPassword(data.newPassword)
    await db.adminUser.update({
      where: { id: user.id },
      data: { password: newHash },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    console.error('POST /api/auth/change-password error:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
