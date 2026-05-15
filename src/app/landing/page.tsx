'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CalendarDays,
  ArrowRight,
  Brain,
  Smartphone,
  LayoutDashboard,
  Check,
  User,
  Store,
  Globe,
  Mail,
  Lock,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react'

// ==================== FORM STATE ====================

const initialForm = {
  fullName: '',
  businessName: '',
  slug: '',
  email: '',
  password: '',
}

// ==================== LANDING PAGE ====================

export default function LandingPage() {
  // Detect if running on vercel.app (no custom domain / subdomain support)
  const isVercelDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')
  const baseUrl = isVercelDomain ? window.location.origin : 'https://intelligenda.it'
  const getTenantUrl = (slug: string) => isVercelDomain ? `${baseUrl}/t/${slug}` : `https://${slug}.intelligenda.it`
  const getAdminUrl = (slug: string) => isVercelDomain ? `${baseUrl}/t/${slug}/admin/login` : `https://${slug}.intelligenda.it/admin/login`

  // Registration form state
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugChecking, setSlugChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  // Slug availability check (debounced)
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current)

    const slug = form.slug
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      setSlugChecking(false)
      return
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setSlugAvailable(false)
      setSlugChecking(false)
      return
    }

    setSlugChecking(true)
    slugTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/register?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()
        setSlugAvailable(data.available)
      } catch {
        setSlugAvailable(null)
      } finally {
        setSlugChecking(false)
      }
    }, 400)

    return () => {
      if (slugTimerRef.current) clearTimeout(slugTimerRef.current)
    }
  }, [form.slug])

  // ==================== FORM HANDLING ====================

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (!form.fullName.trim()) errs.fullName = 'Obbligatorio'
    if (!form.businessName.trim()) errs.businessName = 'Obbligatorio'
    if (!form.slug.trim()) {
      errs.slug = 'Obbligatorio'
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      errs.slug = 'Solo lettere minuscole, numeri e trattini'
    } else if (form.slug.length < 3) {
      errs.slug = 'Minimo 3 caratteri'
    } else if (slugAvailable === false) {
      errs.slug = 'Questo indirizzo è già occupato'
    }
    if (!form.email.trim()) {
      errs.email = 'Obbligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email non valida'
    }
    if (!form.password) {
      errs.password = 'Obbligatorio'
    } else if (form.password.length < 6) {
      errs.password = 'Minimo 6 caratteri'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error || 'Errore nella registrazione')
        return
      }

      setSuccess(true)
    } catch {
      setServerError('Errore di connessione. Riprova.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    setServerError('')
  }

  // ==================== RENDER ====================

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Account creato!</h2>
            <p className="text-stone-500 mb-6">
              Il tuo sito è pronto su{' '}
              <a
                href={getTenantUrl(form.slug)}
                className="text-stone-900 font-medium underline underline-offset-4"
              >
                {isVercelDomain ? `${baseUrl}/t/${form.slug}` : `${form.slug}.intelligenda.it`}
              </a>
            </p>
            <a
              href={getAdminUrl(form.slug)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-2xl text-lg font-medium hover:bg-stone-800 transition-colors"
            >
              Vai al pannello admin <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ==================== HERO ==================== */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <CalendarDays className="w-16 h-16 text-stone-900 mb-6" />
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 max-w-2xl leading-tight">
          IntelliGenda — L&apos;agenda intelligente che pianifica al posto tuo.
        </h1>
        <p className="mt-4 text-lg text-stone-500 max-w-xl">
          Automatizza le prenotazioni della tua attività. Il nostro algoritmo smart calcola i tempi dei servizi
          e incastra gli appuntamenti alla perfezione, azzerando i tempi morti.
        </p>
        <a
          href="#registrati"
          className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-2xl text-lg font-medium hover:bg-stone-800 transition-colors"
        >
          Crea il tuo account <ArrowRight className="w-5 h-5" />
        </a>
      </section>

      {/* ==================== PUNTI DI FORZA ==================== */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-12">
            Perché scegliere IntelliGenda
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200">
              <Brain className="w-10 h-10 text-stone-900 mb-4" />
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                Algoritmo Smart dei Tempi
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Il cliente seleziona più servizi e il sistema calcola la durata totale,
                incastrandola alla perfezione nel tuo calendario senza creare buchi o
                sovrapposizioni.
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200">
              <Smartphone className="w-10 h-10 text-stone-900 mb-4" />
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                Nessuna Registrazione per il Cliente
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                I tuoi clienti prenotano in meno di un minuto direttamente dallo smartphone,
                senza dover creare password o scaricare applicazioni.
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200">
              <LayoutDashboard className="w-10 h-10 text-stone-900 mb-4" />
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                Tutto Sotto Controllo
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Un pannello di controllo completo per gestire i tuoi servizi, i prezzi, gli orari
                di apertura e visualizzare l&apos;agenda giornaliera in un click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PREZZO ==================== */}
      <section className="py-20 px-6 bg-stone-50">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            Un unico piano, tutto incluso.
          </h2>
          <p className="text-stone-500 mb-8">40€ / mese</p>
          <div className="bg-white p-8 rounded-2xl border border-stone-200">
            <div className="text-4xl font-bold text-stone-900 mb-4">
              40€<span className="text-lg font-normal text-stone-400"> / mese</span>
            </div>
            <ul className="space-y-3 text-left text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Sito web dedicato con il
                tuo dominio
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Prenotazioni online 24/7
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Calendario smart con
                gestione automatica
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Pannello di controllo
                admin completo
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Nessuna commissione sulle
                prenotazioni
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Disdici quando vuoi
              </li>
            </ul>
          </div>
          <p className="mt-4 text-xs text-stone-400">
            Nessun costo nascosto. Nessuna commissione sulle prenotazioni. Disdici quando vuoi.
          </p>
        </div>
      </section>

      {/* ==================== REGISTRAZIONE ==================== */}
      <section id="registrati" className="py-20 px-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Sparkles className="w-10 h-10 text-stone-900 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Crea il tuo account</h2>
            <p className="text-stone-500 text-sm">
              Inizia a ricevere prenotazioni in meno di 2 minuti.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center flex items-center justify-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                {serverError}
              </div>
            )}

            {/* Nome e Cognome */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Nome e Cognome del titolare
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => updateField('fullName', e.target.value)}
                  placeholder="Mario Rossi"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-white text-stone-900 placeholder-stone-400 outline-none transition-colors ${
                    errors.fullName ? 'border-red-400' : 'border-stone-200 focus:border-stone-900'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Nome Attività */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Nome dell&apos;Attività
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => updateField('businessName', e.target.value)}
                  placeholder="Barberia Rock"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-white text-stone-900 placeholder-stone-400 outline-none transition-colors ${
                    errors.businessName
                      ? 'border-red-400'
                      : 'border-stone-200 focus:border-stone-900'
                  }`}
                />
              </div>
              {errors.businessName && (
                <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>
              )}
            </div>

            {/* Indirizzo sito */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Indirizzo del sito desiderato
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={form.slug}
                  onChange={e =>
                    updateField(
                      'slug',
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    )
                  }
                  placeholder="barberia-rock"
                  className={`w-full pl-11 pr-40 py-3 rounded-xl border-2 bg-white text-stone-900 placeholder-stone-400 outline-none transition-colors ${
                    errors.slug ? 'border-red-400' : 'border-stone-200 focus:border-stone-900'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 pointer-events-none">
                  .intelligenda.it
                </div>
              </div>
              <div className="mt-1 min-h-[20px]">
                {slugChecking && (
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Verifica disponibilità...
                  </span>
                )}
                {!slugChecking && slugAvailable === true && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Disponibile
                  </span>
                )}
                {!slugChecking && slugAvailable === false && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" /> Non disponibile
                  </span>
                )}
              </div>
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="mario@email.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-white text-stone-900 placeholder-stone-400 outline-none transition-colors ${
                    errors.email ? 'border-red-400' : 'border-stone-200 focus:border-stone-900'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={e => updateField('password', e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-white text-stone-900 placeholder-stone-400 outline-none transition-colors ${
                    errors.password ? 'border-red-400' : 'border-stone-200 focus:border-stone-900'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-stone-900 text-white text-lg font-medium flex items-center justify-center gap-2 hover:bg-stone-800 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Creazione in corso...
                </>
              ) : (
                <>
                  Crea il tuo account <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="py-8 text-center border-t border-stone-100">
        <p className="text-xs text-stone-400">&copy; {new Date().getFullYear()} IntelliGenda</p>
      </footer>
    </div>
  )
}
