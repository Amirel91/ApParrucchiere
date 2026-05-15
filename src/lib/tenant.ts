import { db, ensureDbSchema } from './db'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const MAIN_DOMAINS = ['localhost', 'intelligenda.it', 'www.intelligenda.it']

/**
 * Extract tenant slug from request (cookie set by middleware)
 */
export function getTenantSlugFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get('tenant_slug')
  return cookie?.value || null
}

/**
 * Get tenant slug from cookies (for server components)
 */
export async function getTenantSlugFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('tenant_slug')
  return cookie?.value || null
}

/**
 * Check if request is for the main domain (landing page)
 */
export function isMainDomain(request: NextRequest): boolean {
  const hostname = request.headers.get('host') || ''
  const domain = hostname.split(':')[0] // Remove port
  return MAIN_DOMAINS.some(d => domain === d || domain.endsWith('.' + d) === false && domain.split('.').length <= 2)
}

/**
 * Resolve tenant from slug
 */
export async function getTenantBySlug(slug: string) {
  await ensureDbSchema()
  return db.tenant.findUnique({
    where: { slug, active: true },
    include: { config: true },
  })
}

/**
 * Get the full tenant + config for the current request
 */
export async function getTenantConfig(request: NextRequest) {
  const slug = getTenantSlugFromRequest(request)
  if (!slug) return null

  const tenant = await getTenantBySlug(slug)
  return tenant?.config || null
}

/**
 * Get config for server components (from cookies)
 */
export async function getTenantConfigFromCookies() {
  const slug = await getTenantSlugFromCookies()
  if (!slug) return null

  const tenant = await getTenantBySlug(slug)
  return tenant?.config || null
}

/**
 * Require tenant config (throws if not found)
 */
export async function requireTenantConfig(request: NextRequest) {
  const config = await getTenantConfig(request)
  if (!config) throw new Error('TenantNotFound')
  return config
}
