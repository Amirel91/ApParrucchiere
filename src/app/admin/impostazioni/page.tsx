'use client'

import { useState, useEffect } from 'react'
import { Save, Store, Clock, Key, Check, AlertCircle, Image, UtensilsCrossed } from 'lucide-react'

interface BusinessConfig {
  id: string
  shopName: string
  shopDescription: string
  shopPhone?: string
  shopEmail?: string
  shopAddress?: string
  businessType: string
  selectedImages: string
  lunchBreakEnabled: boolean
  lunchBreakStart: string
  lunchBreakEnd: string
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

const defaultConfig: BusinessConfig = {
  id: '',
  shopName: '',
  shopDescription: '',
  shopPhone: '',
  shopEmail: '',
  shopAddress: '',
  businessType: 'parrucchiere',
  selectedImages: '[]',
  lunchBreakEnabled: false,
  lunchBreakStart: '12:30',
  lunchBreakEnd: '14:00',
}

// Preset images organized by business type
const GALLERY_IMAGES: Record<string, { src: string; label: string }[]> = {
  parrucchiere: [
    { src: '/images/gallery/parrucchiere-1.png', label: 'Salone elegante' },
    { src: '/images/gallery/parrucchiere-2.png', label: 'Attrezzature professionali' },
    { src: '/images/gallery/estetica-1.png', label: 'Area relax' },
    { src: '/images/gallery/estetica-2.png', label: 'Prodotti premium' },
  ],
  barbiere: [
    { src: '/images/gallery/barbiere-1.png', label: 'Barberia moderna' },
    { src: '/images/gallery/barbiere-2.png', label: 'Attrezzature classiche' },
    { src: '/images/gallery/parrucchiere-1.png', label: 'Area lavoro' },
  ],
  estetica: [
    { src: '/images/gallery/estetica-1.png', label: 'Spa treatment room' },
    { src: '/images/gallery/estetica-2.png', label: 'Skincare products' },
    { src: '/images/gallery/parrucchiere-2.png', label: 'Attrezzature' },
  ],
  unghie: [
    { src: '/images/gallery/unghie-1.png', label: 'Stazione nail art' },
    { src: '/images/gallery/unghie-2.png', label: 'Design creativi' },
    { src: '/images/gallery/estetica-2.png', label: 'Prodotti' },
  ],
}

const BUSINESS_TYPES = [
  { value: 'parrucchiere', label: 'Parrucchiere' },
  { value: 'barbiere', label: 'Barbiere' },
  { value: 'estetica', label: 'Estetica / Spa' },
  { value: 'unghie', label: 'Nail Art / Unghie' },
]

export default function AdminImpostazioni() {
  const [config, setConfig] = useState<BusinessConfig>(defaultConfig)
  const [hours, setHours] = useState<WorkingHour[]>(defaultHours)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'negozio' | 'galleria' | 'orari' | 'password'>('negozio')

  // Parse selected images
  const selectedImages: string[] = (() => {
    try {
      return JSON.parse(config.selectedImages || '[]')
    } catch { return [] }
  })()

  useEffect(() => {
    let configLoaded = false
    let hoursLoaded = false
    const checkDone = () => { if (configLoaded && hoursLoaded) setLoading(false) }

    fetch('/api/config')
      .then(r => { if (!r.ok) throw new Error('Errore API config'); return r.json() })
      .then(data => {
        if (data && typeof data === 'object') {
          setConfig({
            id: data.id || '',
            shopName: data.shopName || '',
            shopDescription: data.shopDescription || '',
            shopPhone: data.shopPhone || '',
            shopEmail: data.shopEmail || '',
            shopAddress: data.shopAddress || '',
            businessType: data.businessType || 'parrucchiere',
            selectedImages: data.selectedImages || '[]',
            lunchBreakEnabled: data.lunchBreakEnabled || false,
            lunchBreakStart: data.lunchBreakStart || '12:30',
            lunchBreakEnd: data.lunchBreakEnd || '14:00',
          })
        }
      })
      .catch(err => console.error('Config fetch error:', err))
      .finally(() => { configLoaded = true; checkDone() })

    fetch('/api/working-hours')
      .then(r => { if (!r.ok) throw new Error('Errore API working-hours'); return r.json() })
      .then(data => { if (Array.isArray(data) && data.length > 0) setHours(data) })
      .catch(err => console.error('Working hours fetch error:', err))
      .finally(() => { hoursLoaded = true; checkDone() })
  }, [])

  const saveConfig = async () => {
    setSaving(true); setSaved(false); setSaveError('')
    try {
      const configRes = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })
      if (!configRes.ok) { const errData = await configRes.json(); throw new Error(errData.error || 'Errore nel salvataggio della configurazione') }

      const hoursRes = await fetch('/api/working-hours', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hours) })
      if (!hoursRes.ok) { const errData = await hoursRes.json(); throw new Error(errData.error || "Errore nel salvataggio degli orari") }

      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Errore nel salvataggio')
    } finally { setSaving(false) }
  }

  const updateConfigField = (field: keyof BusinessConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const toggleImage = (src: string) => {
    const current = selectedImages
    const updated = current.includes(src)
      ? current.filter(s => s !== src)
      : [...current, src]
    setConfig(prev => ({ ...prev, selectedImages: JSON.stringify(updated) }))
  }

  const handleChangePassword = async () => {
    setPasswordError(''); setPasswordSuccess('')
    if (passwords.new !== passwords.confirm) { setPasswordError('Le password non coincidono'); return }
    if (passwords.new.length < 6) { setPasswordError('La nuova password deve avere almeno 6 caratteri'); return }
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new }) })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Errore') }
      setPasswordSuccess('Password aggiornata con successo'); setPasswords({ current: '', new: '', confirm: '' }); setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err) { setPasswordError(err instanceof Error ? err.message : 'Errore') }
  }

  const updateHour = (index: number, field: keyof WorkingHour, value: string | boolean) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }

  if (loading) {
    return (<div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full" /></div>)
  }

  const availableImages = GALLERY_IMAGES[config.businessType] || GALLERY_IMAGES.parrucchiere

  const tabs = [
    { id: 'negozio' as const, label: 'Negozio', icon: Store },
    { id: 'galleria' as const, label: 'Galleria', icon: Image },
    { id: 'orari' as const, label: 'Orari', icon: Clock },
    { id: 'password' as const, label: 'Password', icon: Key },
  ]

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Impostazioni</h1>
          <p className="text-stone-500 text-sm mt-1">Configura il tuo negozio</p>
        </div>
        <button onClick={saveConfig} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-all">
          {saved ? (<><Check className="w-4 h-4" />Salvato!</>) : (<><Save className="w-4 h-4" />{saving ? 'Salvataggio...' : 'Salva tutto'}</>)}
        </button>
      </div>

      {saveError && (<div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-600 text-sm"><AlertCircle className="w-5 h-5 shrink-0" /><span>{saveError}</span></div>)}
      {saved && (<div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-600 text-sm"><Check className="w-5 h-5 shrink-0" /><span>Tutte le modifiche sono state salvate con successo.</span></div>)}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-stone-100 rounded-xl p-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab: Negozio */}
      {activeTab === 'negozio' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Tipo di Attivita</label>
              <select value={config.businessType} onChange={e => updateConfigField('businessType', e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 outline-none focus:border-stone-900 transition-colors">
                {BUSINESS_TYPES.map(bt => (<option key={bt.value} value={bt.value}>{bt.label}</option>))}
              </select>
              <p className="text-xs text-stone-400 mt-1">Le immagini nella galleria cambieranno in base al tipo selezionato</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Nome del Negozio *</label>
              <input type="text" value={config.shopName} onChange={e => updateConfigField('shopName', e.target.value)} placeholder="Es: Studio Bellezza Anna" className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Descrizione</label>
              <textarea value={config.shopDescription} onChange={e => updateConfigField('shopDescription', e.target.value)} rows={3} placeholder="Descrivi la tua attivita..." className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors resize-none" />
              <p className="text-xs text-stone-400 mt-1">Appare sulla homepage del cliente</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Telefono</label>
                <input type="tel" value={config.shopPhone || ''} onChange={e => updateConfigField('shopPhone', e.target.value)} placeholder="+39 02 1234567" className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
                <input type="email" value={config.shopEmail || ''} onChange={e => updateConfigField('shopEmail', e.target.value)} placeholder="info@negozio.it" className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Indirizzo</label>
              <input type="text" value={config.shopAddress || ''} onChange={e => updateConfigField('shopAddress', e.target.value)} placeholder="Via Roma 42, Milano" className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors" />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Galleria */}
      {activeTab === 'galleria' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-5 h-5 text-stone-500" />
            <h2 className="font-semibold text-stone-900">Galleria Immagini</h2>
          </div>
          <p className="text-stone-500 text-sm mb-5">Seleziona le immagini da mostrare nella homepage. Le immagini cambiano in base al tipo di attivita selezionato.</p>

          {selectedImages.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-stone-600 mb-2">Selezionate ({selectedImages.length}):</p>
              <div className="grid grid-cols-2 gap-3">
                {selectedImages.map(src => (
                  <div key={src} className="relative group rounded-xl overflow-hidden aspect-video">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => toggleImage(src)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">X</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs font-medium text-stone-600 mb-3">Disponibili per: {BUSINESS_TYPES.find(b => b.value === config.businessType)?.label || 'Parrucchiere'}</p>
          <div className="grid grid-cols-2 gap-3">
            {availableImages.map(img => {
              const isSelected = selectedImages.includes(img.src)
              return (
                <button key={img.src} onClick={() => toggleImage(img.src)} className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${isSelected ? 'border-stone-900 ring-2 ring-stone-900/20' : 'border-stone-200 hover:border-stone-400'}`}>
                  <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-stone-900/10' : 'bg-black/0 hover:bg-black/5'}`} />
                  <div className={`absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent`}>
                    <span className="text-white text-xs font-medium">{img.label}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Orari */}
      {activeTab === 'orari' && (
        <>
          {/* Working Hours */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5 text-stone-500" />
              <h2 className="font-semibold text-stone-900">Orari di Apertura</h2>
            </div>
            <div className="space-y-3">
              {hours.map((wh, i) => (
                <div key={wh.dayOfWeek} className="flex items-center gap-3">
                  <div className="w-28 text-sm font-medium text-stone-700 shrink-0">{DAY_NAMES[i]}</div>
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <div onClick={() => updateHour(i, 'closed', !wh.closed)} className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${wh.closed ? 'bg-red-400' : 'bg-stone-300'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${wh.closed ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-xs text-stone-500 w-10">{wh.closed ? 'Chiuso' : 'Aperto'}</span>
                  </label>
                  {!wh.closed && (
                    <div className="flex items-center gap-2 text-sm">
                      <input type="time" value={wh.openTime} onChange={e => updateHour(i, 'openTime', e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-900 outline-none focus:border-stone-900 transition-colors" />
                      <span className="text-stone-400">&mdash;</span>
                      <input type="time" value={wh.closeTime} onChange={e => updateHour(i, 'closeTime', e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-900 outline-none focus:border-stone-900 transition-colors" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Lunch Break */}
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <UtensilsCrossed className="w-5 h-5 text-stone-500" />
              <h2 className="font-semibold text-stone-900">Pausa Pranzo</h2>
            </div>
            <p className="text-stone-500 text-sm mb-4">I clienti non potranno prenotare durante l&apos;orario di pausa pranzo.</p>

            <div className="flex items-center gap-3 mb-4">
              <div onClick={() => updateConfigField('lunchBreakEnabled', !config.lunchBreakEnabled)} className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${config.lunchBreakEnabled ? 'bg-stone-900' : 'bg-stone-300'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${config.lunchBreakEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-stone-700">{config.lunchBreakEnabled ? 'Pausa pranzo attiva' : 'Pausa pranzo disattiva'}</span>
            </div>

            {config.lunchBreakEnabled && (
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Dalle</label>
                  <input type="time" value={config.lunchBreakStart} onChange={e => updateConfigField('lunchBreakStart', e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-900 outline-none focus:border-stone-900 transition-colors" />
                </div>
                <span className="text-stone-400 mt-5">&mdash;</span>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Alle</label>
                  <input type="time" value={config.lunchBreakEnd} onChange={e => updateConfigField('lunchBreakEnd', e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-900 outline-none focus:border-stone-900 transition-colors" />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab: Password */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Key className="w-5 h-5 text-stone-500" />
            <h2 className="font-semibold text-stone-900">Cambia Password</h2>
          </div>
          {passwordError && (<div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{passwordError}</div>)}
          {passwordSuccess && (<div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm">{passwordSuccess}</div>)}
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Password Attuale</label>
              <input type="password" value={passwords.current} onChange={e => setPasswords(prev => ({ ...prev, current: e.target.value }))} className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Nuova Password</label>
              <input type="password" value={passwords.new} onChange={e => setPasswords(prev => ({ ...prev, new: e.target.value }))} className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Conferma Nuova Password</label>
              <input type="password" value={passwords.confirm} onChange={e => setPasswords(prev => ({ ...prev, confirm: e.target.value }))} className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors" />
            </div>
            <button onClick={handleChangePassword} className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors">Aggiorna Password</button>
          </div>
        </div>
      )}
    </div>
  )
}
