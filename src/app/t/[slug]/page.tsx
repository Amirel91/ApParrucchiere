'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'

/**
 * /t/[slug] - Tenant resolver for Vercel default domain
 * The middleware handles this by setting the cookie and redirecting to /.
 * This page is a client-side fallback in case the middleware doesn't fire.
 */
export default function TenantRedirect() {
  const params = useParams()
  const slug = params.slug as string

  useEffect(() => {
    if (!slug) return
    // Set cookie and redirect client-side
    document.cookie = `tenant_slug=${slug};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    window.location.replace('/')
  }, [slug])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-400 text-sm">Caricamento...</p>
    </div>
  )
}
