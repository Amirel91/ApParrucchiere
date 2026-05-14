'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Clock, Euro, GripVertical } from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  active: boolean
  sortOrder: number
}

const emptyForm = {
  name: '',
  description: '',
  price: 0,
  durationMinutes: 30,
  active: true,
  sortOrder: 0,
}

export default function AdminServizi() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchServices = () => {
    fetch('/api/services?all=true')
      .then(res => res.json())
      .then(data => {
        setServices(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchServices() }, [])

  const openNew = () => {
    setForm({ ...emptyForm, sortOrder: services.length + 1 })
    setEditingId(null)
    setShowForm(true)
    setError('')
  }

  const openEdit = (s: Service) => {
    setForm({
      name: s.name,
      description: s.description || '',
      price: s.price,
      durationMinutes: s.durationMinutes,
      active: s.active,
      sortOrder: s.sortOrder,
    })
    setEditingId(s.id)
    setShowForm(true)
    setError('')
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Il nome è obbligatorio')
      return
    }

    setSaving(true)
    setError('')

    try {
      const url = editingId ? `/api/services/${editingId}` : '/api/services'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore')
      }

      setShowForm(false)
      fetchServices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo servizio?')) return

    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      fetchServices()
    } catch {
      setError('Errore nell\'eliminazione')
    }
  }

  const toggleActive = async (s: Service) => {
    try {
      await fetch(`/api/services/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s, active: !s.active }),
      })
      fetchServices()
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Servizi</h1>
          <p className="text-stone-500 text-sm mt-1">{services.length} servizi configurati</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuovo Servizio
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {/* Services list */}
      <div className="space-y-2">
        {services.map(service => (
          <div
            key={service.id}
            className={`bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4 transition-opacity ${
              !service.active ? 'opacity-50' : ''
            }`}
          >
            <GripVertical className="w-4 h-4 text-stone-300 shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-900">{service.name}</span>
                {!service.active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-500 font-medium">
                    Inattivo
                  </span>
                )}
              </div>
              {service.description && (
                <p className="text-sm text-stone-500 truncate">{service.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium text-stone-900">
                  <Euro className="w-3.5 h-3.5" />
                  {service.price.toFixed(2)}
                </div>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <Clock className="w-3 h-3" />
                  {service.durationMinutes} min
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive(service)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    service.active ? 'bg-stone-900' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      service.active ? 'translate-x-[18px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(service)}
                  className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-700 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-stone-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="text-center py-16 text-stone-400">
            <p className="text-lg mb-2">Nessun servizio configurato</p>
            <p className="text-sm">Crea il tuo primo servizio per iniziare</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-stone-900">
                  {editingId ? 'Modifica Servizio' : 'Nuovo Servizio'}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-stone-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Nome *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="es. Taglio Donna"
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Descrizione</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrizione opzionale del servizio..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Prezzo (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={e => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Durata (min) *</label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={form.durationMinutes}
                      onChange={e => setForm(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 30 }))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-stone-900 placeholder-stone-400 outline-none focus:border-stone-900 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
                      className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                        form.active ? 'bg-stone-900' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          form.active ? 'translate-x-[18px]' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                    <span className="text-sm text-stone-700">Attivo</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-700 font-medium hover:bg-stone-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
