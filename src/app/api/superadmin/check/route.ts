import { NextResponse } from 'next/server'

/**
 * GET /api/superadmin/check - Health check endpoint (no auth required).
 * Returns diagnostic info to debug the superadmin setup.
 */
export async function GET() {
  const env = {
    hasPassword: !!process.env.SUPERADMIN_PASSWORD,
    hasJwtSecret: !!(process.env.JWT_SECRET || process.env.SUPERADMIN_JWT_SECRET),
    nodeEnv: process.env.NODE_ENV || 'unknown',
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env,
    message: env.hasPassword
      ? 'SUPERADMIN_PASSWORD is configured'
      : 'WARNING: SUPERADMIN_PASSWORD is NOT set on Vercel!',
  })
}
