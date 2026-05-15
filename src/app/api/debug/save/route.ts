import { NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/debug/save - Tests the config save flow step by step
export async function GET() {
  const steps: { step: string; ok: boolean; detail: string }[] = []

  // Step 1: Ensure DB schema
  try {
    const migration = await ensureDbSchema()
    steps.push({ step: '1_ensureDbSchema', ok: migration.ok, detail: migration.results.join(', ') })
  } catch (e: unknown) {
    steps.push({ step: '1_ensureDbSchema', ok: false, detail: String(e) })
  }

  // Step 2: Auth check
  try {
    const session = await requireAdmin()
    steps.push({ step: '2_auth', ok: true, detail: `User: ${session.username}` })
  } catch (e: unknown) {
    steps.push({ step: '2_auth', ok: false, detail: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ steps })
  }

  // Step 3: Find config
  let configId = ''
  try {
    const config = await db.businessConfig.findFirst()
    if (!config) {
      steps.push({ step: '3_findConfig', ok: false, detail: 'No config found' })
    } else {
      configId = config.id
      steps.push({
        step: '3_findConfig',
        ok: true,
        detail: `id=${config.id}, lunchBreakEnabled=${config.lunchBreakEnabled}`,
      })
    }
  } catch (e: unknown) {
    steps.push({ step: '3_findConfig', ok: false, detail: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ steps })
  }

  // Step 4: Test simple update with ONLY old fields (shopName)
  try {
    const current = await db.businessConfig.findFirst({ where: { id: configId } })
    const originalName = current?.shopName || ''
    const updated = await db.businessConfig.update({
      where: { id: configId },
      data: { shopName: 'Test Debug' },
    })
    steps.push({ step: '4_updateBasic', ok: true, detail: `OK shopName="${updated.shopName}"` })
    // Restore
    await db.businessConfig.update({ where: { id: configId }, data: { shopName: originalName } })
  } catch (e: unknown) {
    steps.push({ step: '4_updateBasic', ok: false, detail: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ steps })
  }

  // Step 5: Test update with new fields
  try {
    const updated = await db.businessConfig.update({
      where: { id: configId },
      data: {
        lunchBreakEnabled: false,
        lunchBreakStart: '12:30',
        lunchBreakEnd: '14:00',
      },
    })
    steps.push({ step: '5_updateNewFields', ok: true, detail: `OK lunchBreakEnabled=${updated.lunchBreakEnabled}` })
  } catch (e: unknown) {
    steps.push({ step: '5_updateNewFields', ok: false, detail: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ steps })
  }

  // Step 6: Test full update all fields
  try {
    await db.businessConfig.update({
      where: { id: configId },
      data: {
        shopName: 'Il Mio Negozio',
        shopDescription: '',
        shopPhone: '',
        shopEmail: '',
        shopAddress: '',
        lunchBreakEnabled: false,
        lunchBreakStart: '12:30',
        lunchBreakEnd: '14:00',
      },
    })
    steps.push({ step: '6_updateFull', ok: true, detail: 'All fields updated OK' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    steps.push({ step: '6_updateFull', ok: false, detail: msg })
    return NextResponse.json({ steps })
  }

  return NextResponse.json({ steps })
}
