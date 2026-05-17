'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, ArrowLeft, Loader2, Globe } from 'lucide-react'

/**
 * Global Login Page — /login
 * Allows existing tenants to access their admin panel.
 * On Vercel domains, shows a slug input field.
 * On custom domains, auto-detects the subdomain.
 */
export default function GlobalLoginPage() {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanSlug = slug.trim().toLowerCase()
    if (!cleanSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      setError('Inserisci un indirizzo valido (es. barberia-rock)')
      return
    }

    setLoading(true)

    const isVercel = typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')

    if (isVercel) {
      // On Vercel: check tenant exists, then redirect via /t/slug to set cookie
      try {
        const res = await fetch(`/api/register?slug=${encodeURIComponent(cleanSlug)}`)
        const data = await res.json()
        if (!data.available) {
          window.location.href = `/t/${cleanSlug}/admin/login`
        } else {
          setError('Nessuna attivita trovata con questo indirizzo.')
        }
      } catch {
        setError('Errore di connessione. Riprova.')
      } finally {
        setLoading(false)
      }
    } else {
      // On custom domain: redirect to subdomain admin login
      window.location.href = `https://${cleanSlug}.intelligenda.it/admin/login`
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Accedi</h1>
          <p className="text-sm text-stone-500 mt-1">IntelliGenda — Pannello attivita</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Indirizzo della tua attivita
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setError('') }}
                placeholder="barberia-rock"
                className="w-full pl-11 pr-40 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 pointer-events-none">
                .intelligenda.it
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !slug.trim()}
            className="w-full py-3.5 rounded-xl bg-stone-900 text-white font-medium flex items-center justify-center gap-2 hover:bg-stone-800 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <LogIn className="w-5 h-5" />
                Accedi al pannello
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/landing')}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Torna alla home
          </button>
        </div>
      </div>
    </div>
  )
}
