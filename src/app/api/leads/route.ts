import { NextRequest, NextResponse } from 'next/server'
import { db, ensureLeadTable } from '@/lib/db'

/**
 * POST /api/leads
 * Saves an email lead for the launch discount campaign.
 * Idempotent: duplicate emails are silently ignored (ON CONFLICT DO NOTHING).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 })
    }

    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Email non valida' }, { status: 400 })
    }

    // Ensure the Lead table exists (idempotent DDL via Neon HTTP API)
    await ensureLeadTable()

    try {
      await db.$executeRaw`
        INSERT INTO "Lead" ("id", "email", "source", "createdAt")
        VALUES (${crypto.randomUUID()}, ${trimmed}, ${'launch-discount'}, NOW())
        ON CONFLICT ("email") DO NOTHING
      `
    } catch (dbError) {
      console.error('[/api/leads] DB insert error:', dbError)
      return NextResponse.json({ error: 'Errore nel salvataggio. Riprova.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
