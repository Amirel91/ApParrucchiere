import { NextRequest, NextResponse } from 'next/server'
import { createSuperAdminToken } from '@/lib/auth'

/**
 * POST /api/superadmin/login
 * Authenticates the platform owner. Returns the JWT token in the response body.
 * Client stores it in localStorage and sends it as Bearer token on each request.
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

    // Create JWT and return it in the response body
    const token = await createSuperAdminToken()
    return NextResponse.json({ success: true, token })
  } catch {
    return NextResponse.json({ error: 'Errore durante il login' }, { status: 500 })
  }
}
