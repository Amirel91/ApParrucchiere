import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// ============ AUTO-MIGRATION (uses native pg, bypasses Prisma pooling) ============

const MIGRATION_SQL = [
  // BusinessConfig columns
  `ALTER TABLE "BusinessConfig" ADD COLUMN IF NOT EXISTS "businessType" TEXT DEFAULT 'parrucchiere'`,
  `ALTER TABLE "BusinessConfig" ADD COLUMN IF NOT EXISTS "selectedImages" TEXT DEFAULT '[]'`,
  `ALTER TABLE "BusinessConfig" ADD COLUMN IF NOT EXISTS "lunchBreakEnabled" BOOLEAN DEFAULT false`,
  `ALTER TABLE "BusinessConfig" ADD COLUMN IF NOT EXISTS "lunchBreakStart" TEXT DEFAULT '12:30'`,
  `ALTER TABLE "BusinessConfig" ADD COLUMN IF NOT EXISTS "lunchBreakEnd" TEXT DEFAULT '14:00'`,
  // Service columns
  `ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "cleanupMinutes" INTEGER DEFAULT 0`,
  // ClosedDate table
  `CREATE TABLE IF NOT EXISTS "ClosedDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "configId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClosedDate_configId_fkey') THEN
      ALTER TABLE "ClosedDate" ADD CONSTRAINT "ClosedDate_configId_fkey"
        FOREIGN KEY ("configId") REFERENCES "BusinessConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ClosedDate_configId_date_key" ON "ClosedDate"("configId", "date")`,
]

let _schemaEnsured = false

export async function ensureDbSchema(): Promise<{ ok: boolean; results: string[] }> {
  if (_schemaEnsured) return { ok: true, results: ['cached'] }
  
  const results: string[] = []
  
  try {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      console.error('[ensureDbSchema] No DATABASE_URL found')
      return { ok: false, results: ['ERROR: No DATABASE_URL'] }
    }

    // Use native pg client - bypasses Prisma pooling issues
    const client = new pg.Client({ connectionString })
    await client.connect()
    
    for (const sql of MIGRATION_SQL) {
      try {
        await client.query(sql)
        results.push(`OK: ${sql.substring(0, 60)}...`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        results.push(`WARN: ${msg.substring(0, 80)}`)
        console.warn(`[ensureDbSchema] Statement failed (may be ok): ${msg}`)
      }
    }
    
    await client.end()
    _schemaEnsured = true
    console.log('[ensureDbSchema] Database schema verified/updated successfully')
    return { ok: true, results }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[ensureDbSchema] Fatal error:', msg)
    return { ok: false, results: [`FATAL: ${msg}`] }
  }
}
