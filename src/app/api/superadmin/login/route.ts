import { NextRequest, NextResponse } from 'next/server'
import { createSuperAdminToken } from '@/lib/auth'
import { cookies } from 'next/headers'

const SUPERADMIN_COOKIE = 'superadmin_token'

/**
 * POST /api/superadmin/login
 * Authenticates the platform owner with a password set via env var.
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const expectedPassword = process.env.SUPERADMIN_PASSWORD

    if (!expectedPassword) {
      console.error('[superadmin/login] SUPERADMIN_PASSWORD env var not set')
      return NextResponse.json(
        { error: 'Configurazione server non completa' },
        { status: 500 }
      )
    }

    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Password non corretta' },
        { status: 401 }
      )
    }

    // Create JWT and set cookie
    const token = await createSuperAdminToken()
    const cookieStore = await cookies()
    cookieStore.set(SUPERADMIN_COOKIE, token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore durante il login' }, { status: 500 })
  }
}
