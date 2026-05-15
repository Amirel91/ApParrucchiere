import { NextResponse } from 'next/server'

/**
 * DELETE /api/superadmin/logout - Clear the superadmin cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('superadmin_token', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
