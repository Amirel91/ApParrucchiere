import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// GET /api/auth/me - Check if admin is logged in
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    return NextResponse.json({ authenticated: true, username: session.username })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

// POST /api/auth/me - Logout
export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
