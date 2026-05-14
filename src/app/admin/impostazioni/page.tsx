'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Store, Clock, Key, Check } from 'lucide-react'

interface BusinessConfig {
  id: string
  shopName: string
  shopDescription: string
  shopPhone?: string
  shopEmail?: string
  shopAddress?: string
}

interface WorkingHour {
  id: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  closed: boolean
}

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

const defaultHours: WorkingHour[] = Array.from({ length: 7 }, (_, i) => ({
  id: '',
  dayOfWeek: i + 1,
  openTime: i < 5 ? '09:00' : '09:00',
  closeTime: i < 5 ? '18:00' : '13:00',
  closed: i === 6,
}))

export default function AdminImpostazioni() {
  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [hours, setHours] = useState<WorkingHour[]>(defaultHours)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/config').then(r => r.json()),
      fetch('/api/working-hours').then(r => r.json()),
    ]).then(([cfg, wh]) => {
      setConfig(cfg)
      if (Array.isArray(wh) && wh.length > 0) {
        setHours(wh)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const saveConfig = async () => {
    if (!config) return
    setSaving(true)
    setSaved(false)

    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      await fetch('/api/working-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hours),
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { /* silent */ }
    finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (passwords.new !== passwords.confirm) {
      setPasswordError('Le password non coincidono')
      return
    }
    if (passwords.new.length < 6) {
      setPasswordError('La nuova password deve avere almeno 6 caratteri')
      return
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore')
      }

      setPasswordSuccess('Password aggiornata con successo')
      setPasswords({ current: '', new: '', confirm: '' })
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Errore')
    }
  }

  const updateHour = (index: number, field: keyof WorkingHour, value: string | boolean) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Impostazioni</h1>
          <p className="text-stone-500 text-sm mt-1">Configura il tuo negozio</p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-all"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Salvato!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? 'Salvataggio...' : 'Salva'}
            </>
          )}
        </button>
      </div>

      {/* Shop Info */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Store className="w-5 h-5 text-stone-500" />
          <h2 className="font-semibold text-stone-900">Informazioni Negozio</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Nome del Negozio</label>
            <input
              type="text"
              value={config?.shopName || ''}
              onChange={e => setConfig(prev => prev ? { ...prev, shopName: e.target.value } : prev)}
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 outline-none focus:border-stone-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Descrizione</label>
            <textarea
              value={config?.shopDescription || ''}
              onChange={e => setConfig(prev => prev ? { ...prev, shopDescription: e.target.value } : prev)}
              rows={3}
              placeholder="Descrivi la tua attività..."
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors resize-none"
            />
            <p className="text-xs text-stone-400 mt-1">Questa descrizione appare nella homepage del cliente</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Telefono</label>
              <input
                type="tel"
                value={config?.shopPhone || ''}
                onChange={e => setConfig(prev => prev ? { ...prev, shopPhone: e.target.value } : prev)}
                placeholder="+39 02 1234567"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={config?.shopEmail || ''}
                onChange={e => setConfig(prev => prev ? { ...prev, shopEmail: e.target.value } : prev)}
                placeholder="info@negozio.it"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Indirizzo</label>
            <input
              type="text"
              value={config?.shopAddress || ''}
              onChange={e => setConfig(prev => prev ? { ...prev, shopAddress: e.target.value } : prev)}
              placeholder="Via Roma 42, Milano"
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-stone-500" />
          <h2 className="font-semibold text-stone-900">Orari di Apertura</h2>
        </div>

        <div className="space-y-3">
          {hours.map((wh, i) => (
            <div key={wh.dayOfWeek} className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium text-stone-700 shrink-0">
                {DAY_NAMES[i]}
              </div>

              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <div
                  onClick={() => updateHour(i, 'closed', !wh.closed)}
                  className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                    wh.closed ? 'bg-red-400' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      wh.closed ? 'translate-x-[18px]' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-xs text-stone-500 w-10">
                  {wh.closed ? 'Chiuso' : 'Aperto'}
                </span>
              </label>

              {!wh.closed && (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={wh.openTime}
                    onChange={e => updateHour(i, 'openTime', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-900 outline-none focus:border-stone-900 transition-colors"
                  />
                  <span className="text-stone-400">—</span>
                  <input
                    type="time"
                    value={wh.closeTime}
                    onChange={e => updateHour(i, 'closeTime', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-900 outline-none focus:border-stone-900 transition-colors"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Key className="w-5 h-5 text-stone-500" />
          <h2 className="font-semibold text-stone-900">Cambia Password</h2>
        </div>

        {passwordError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{passwordError}</div>
        )}
        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm">{passwordSuccess}</div>
        )}

        <div className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Password Attuale</label>
            <input
              type="password"
              value={passwords.current}
              onChange={e => setPasswords(prev => ({ ...prev, current: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Nuova Password</label>
            <input
              type="password"
              value={passwords.new}
              onChange={e => setPasswords(prev => ({ ...prev, new: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Conferma Nuova Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={e => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors"
            />
          </div>

          <button
            onClick={handleChangePassword}
            className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Aggiorna Password
          </button>
        </div>
      </div>
    </div>
  )
}
