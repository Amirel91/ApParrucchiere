import { NextResponse } from 'next/server'

// GET /api/setup?force=true - Run database migration (bypasses cache if force=true)
export async function GET(request: Request) {
  try {
    // Dynamic import to get a fresh module - bypasses the _schemaEnsured cache
    const force = new URL(request.url).searchParams.get('force') === 'true'

    if (force) {
      // Force fresh import to bypass cached _schemaEnsured flag
      const { ensureDbSchema: freshEnsure } = await import('@/lib/db?force=' + Date.now())
      const result = await freshEnsure()
      return NextResponse.json({
        status: result.ok ? 'success' : 'error',
        message: result.ok
          ? 'Database schema updated successfully'
          : 'Database migration failed',
        details: result.results,
        forced: true,
      })
    }

    const { ensureDbSchema } = await import('@/lib/db')
    const result = await ensureDbSchema()
    return NextResponse.json({
      status: result.ok ? 'success' : 'error',
      message: result.ok
        ? 'Database schema updated successfully'
        : 'Database migration failed - check details',
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
