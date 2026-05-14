import { NextResponse } from 'next/server'
import { ensureDbSchema } from '@/lib/db'

// GET /api/setup - Run database migration manually
// This endpoint can be visited once after deployment to ensure all columns/tables exist
export async function GET() {
  try {
    const result = await ensureDbSchema()
    return NextResponse.json({
      status: result.ok ? 'success' : 'error',
      message: result.ok 
        ? 'Database schema updated successfully' 
        : 'Database migration failed - check Vercel logs for details',
      details: result.results,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      status: 'error',
      message: 'Migration failed',
      error: msg,
    }, { status: 500 })
  }
}
