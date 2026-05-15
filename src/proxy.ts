import { NextRequest, NextResponse } from 'next/server'

const MAIN_DOMAINS = ['localhost:3000', 'localhost', 'intelligenda.it', 'www.intelligenda.it']

/**
 * Proxy handler for Next.js 16 — subdomain-based multi-tenant routing.
 *
 * Custom subdomain:  amir.intelligenda.it  → extracts "amir" → sets tenant_slug cookie
 * Main domains:      intelligenda.it       → clears cookie → landing page
 * Vercel fallback:   *.vercel.app/t/amir   → sets cookie + redirects to /
 */
export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const domain = hostname.split(':')[0] // Remove port
  const url = request.nextUrl.clone()

  // Vercel default domains (*.vercel.app) don't support subdomains
  const isVercelDomain = domain.endsWith('.vercel.app')

  // ============ /t/[slug] — Subdomain fallback for Vercel ============
  if (isVercelDomain && url.pathname.startsWith('/t/')) {
    const slug = url.pathname.split('/')[2]
    if (slug && slug.length > 0) {
      const response = NextResponse.redirect(new URL('/', request.url))
      response.cookies.set('tenant_slug', slug, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
      })
      return response
    }
  }

  // ============ Main domain detection ============
  const isMainDomain = MAIN_DOMAINS.some(d => {
    const base = d.split(':')[0]
    return domain === base
  }) || isVercelDomain

  if (isMainDomain) {
    if (isVercelDomain) {
      // On Vercel domains, do NOT clear the tenant cookie.
      // The cookie is set via /t/[slug] above.
      // The homepage (page.tsx) checks /api/config and redirects to /landing
      // if no tenant is found, so no cookie = landing page automatically.
      return NextResponse.next()
    }

    // On custom main domains (intelligenda.it, www), clear cookie → landing page
    const response = NextResponse.next()
    response.cookies.set('tenant_slug', '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  }

  // ============ Custom domain with subdomain (e.g., amir.intelligenda.it) ============
  const parts = domain.split('.')
  const slug = parts[0] // e.g., "amir" from "amir.intelligenda.it"

  if (!slug || slug === 'www') {
    const response = NextResponse.next()
    response.cookies.set('tenant_slug', '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  }

  // Set tenant slug as cookie for all downstream handlers
  const response = NextResponse.next()
  response.cookies.set('tenant_slug', slug, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // Client components need to read this
  })

  return response
}

// Route matcher — skip static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
