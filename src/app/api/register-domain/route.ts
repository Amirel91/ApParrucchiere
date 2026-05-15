import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDbSchema } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getTenantConfig } from '@/lib/tenant'

const DOMAIN_BASE = 'intelligenda.it'

/**
 * POST /api/register-domain - Register the current tenant's subdomain on Vercel.
 * Requires admin authentication. Useful for existing tenants created before
 * the Vercel API integration.
 *
 * Also supports: POST /api/register-domain?slug=xxx (admin of any tenant)
 */
export async function POST(request: NextRequest) {
  try {
    await ensureDbSchema()

    // Check for explicit slug parameter (allows registering any tenant domain)
    const explicitSlug = new URL(request.url).searchParams.get('slug')

    if (!explicitSlug) {
      // Require admin and register current tenant's domain
      const session = await requireAdmin()
      const config = await getTenantConfig(request)
      if (!config || !config.tenantId) {
        return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 })
      }

      const tenant = await db.tenant.findUnique({ where: { id: config.tenantId } })
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 })
      }

      const result = await registerVercelDomain(tenant.slug)
      return NextResponse.json({
        ok: result.ok,
        domain: `${tenant.slug}.${DOMAIN_BASE}`,
        message: result.ok ? 'Dominio registrato su Vercel' : `Errore: ${result.msg}`,
      })
    }

    // Register a specific tenant's domain by slug
    const token = process.env.VERCEL_API_TOKEN
    const projectId = process.env.VERCEL_PROJECT_ID
    if (!token || !projectId) {
      return NextResponse.json(
        { error: 'VERCEL_API_TOKEN e VERCEL_PROJECT_ID non configurati' },
        { status: 500 }
      )
    }

    const tenant = await db.tenant.findUnique({ where: { slug: explicitSlug } })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 })
    }

    const result = await registerVercelDomain(explicitSlug)
    return NextResponse.json({
      ok: result.ok,
      domain: `${explicitSlug}.${DOMAIN_BASE}`,
      message: result.ok ? 'Dominio registrato su Vercel' : `Errore: ${result.msg}`,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    console.error('POST /api/register-domain error:', error)
    return NextResponse.json({ error: 'Errore nella registrazione del dominio' }, { status: 500 })
  }
}

async function registerVercelDomain(subdomain: string): Promise<{ ok: boolean; msg: string }> {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID

  if (!token || !projectId) {
    return { ok: false, msg: 'VERCEL_API_TOKEN or VERCEL_PROJECT_ID not configured' }
  }

  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: `${subdomain}.${DOMAIN_BASE}` }),
      }
    )

    if (res.ok) {
      console.log(`[registerVercelDomain] Registered ${subdomain}.${DOMAIN_BASE} on Vercel`)
      return { ok: true, msg: 'Domain registered' }
    }

    const data = await res.json()
    const errMsg = data.error?.message || data.message || `HTTP ${res.status}`
    console.error(`[registerVercelDomain] Failed: ${errMsg}`)

    if (res.status === 409 || errMsg.includes('already')) {
      return { ok: true, msg: 'Domain already exists' }
    }

    return { ok: false, msg: errMsg }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[registerVercelDomain] Error: ${msg}`)
    return { ok: false, msg }
  }
}
