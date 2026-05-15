import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * DELETE /api/superadmin/logout - Clear the superadmin cookie.
 */
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set('superadmin_token', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return NextResponse.json({ success: true })
}
