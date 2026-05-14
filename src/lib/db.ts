import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Auto-migration: ensures all new columns/tables exist in the database.
// This runs once per serverless function cold start (idempotent DDL).
let _schemaEnsured = false

export async function ensureDbSchema() {
  if (_schemaEnsured) return
  _schemaEnsured = true
  try {
    // BusinessConfig - add new columns if missing
    const bccColumns = [
      { col: 'businessType', type: "TEXT DEFAULT 'parrucchiere'" },
      { col: 'selectedImages', type: "TEXT DEFAULT '[]'" },
      { col: 'lunchBreakEnabled', type: "BOOLEAN DEFAULT false" },
      { col: 'lunchBreakStart', type: "TEXT DEFAULT '12:30'" },
      { col: 'lunchBreakEnd', type: "TEXT DEFAULT '14:00'" },
    ]
    for (const c of bccColumns) {
      await db.$executeRawUnsafe(
        `ALTER TABLE "BusinessConfig" ADD COLUMN IF NOT EXISTS "${c.col}" ${c.type}`
      )
    }

    // Service - add cleanupMinutes if missing
    await db.$executeRawUnsafe(
      `ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "cleanupMinutes" INTEGER DEFAULT 0`
    )

    // ClosedDate - create table if not exists
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ClosedDate" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "date" TEXT NOT NULL,
        "reason" TEXT NOT NULL DEFAULT '',
        "configId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ClosedDate_configId_fkey" FOREIGN KEY ("configId") REFERENCES "BusinessConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)
    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ClosedDate_configId_date_key" ON "ClosedDate"("configId", "date")
    `)

    console.log('[ensureDbSchema] Database schema verified/updated successfully')
  } catch (error) {
    console.error('[ensureDbSchema] Error during auto-migration:', error)
    // Don't throw - allow the app to continue, the actual query will fail
    // with a clearer error if columns are truly missing
  }
}
