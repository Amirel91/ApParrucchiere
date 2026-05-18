'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Clock,
  Wrench,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { getSuggestions } from '@/lib/service-suggestions'
import { toast } from 'sonner'

interface ServiceVariant {
  id: string
  name: string
  duration: number
  price: number
}

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  buffer: number
  category: string
  active: boolean
  requiresStaff: boolean
  variants: ServiceVariant[]
  appointmentCount?: number
}

interface ServiceFormData {
  name: string
  description: string
  duration: number
  price: number
  buffer: number
  category: string
  active: boolean
  requiresStaff: boolean
}

interface VariantFormData {
  name: string
  duration: number
  price: number
}

const emptyService: ServiceFormData = {
  name: '',
  description: '',
  duration: 30,
  price: 0,
  buffer: 0,
  category: '',
  active: true,
  requiresStaff: true,
}

const emptyVariant: VariantFormData = {
  name: '',
  duration: 0,
  price: 0,
}

export default function ServicesManager() {
  const { session } = useAppStore()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ServiceFormData>(emptyService)
  const [saving, setSaving] = useState(false)

  // Variant dialog
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [variantServiceId, setVariantServiceId] = useState<string | null>(null)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [variantForm, setVariantForm] = useState<VariantFormData>(emptyVariant)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const token = session?.token

  // Derive suggestions from session's activity type
  const activityType = session?.business?.activityType || 'ALTRO'
  const suggestions = getSuggestions(activityType)

  const fetchServices = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/services', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setServices(await res.json())
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const categories = [...new Set(services.map((s) => s.category).filter(Boolean))]

  const filtered = services.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || s.category === categoryFilter
    return matchSearch && matchCategory
  })

  function openCreate() {
    setEditingId(null)
    setForm(emptyService)
    setDialogOpen(true)
  }

  function openEdit(service: Service) {
    setEditingId(service.id)
    setForm({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      buffer: service.buffer,
      category: service.category,
      active: service.active,
      requiresStaff: service.requiresStaff,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = editingId
        ? `/api/services/${editingId}`
        : '/api/services'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success(editingId ? 'Servizio aggiornato' : 'Servizio creato')
      setDialogOpen(false)
      fetchServices()
    } catch {
      toast.error('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  function openDelete(service: Service) {
    if (service.appointmentCount && service.appointmentCount > 0) {
      toast.error('Impossibile eliminare: il servizio ha appuntamenti collegati')
      return
    }
    setDeletingId(service.id)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/services/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      toast.success('Servizio eliminato')
      setServices((prev) => prev.filter((s) => s.id !== deletingId))
    } catch {
      toast.error('Errore durante l\'eliminazione')
    } finally {
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  async function toggleActive(service: Service) {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...service, active: !service.active }),
      })
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id ? { ...s, active: !s.active } : s
          )
        )
        toast.success(service.active ? 'Servizio disattivato' : 'Servizio attivato')
      }
    } catch {
      toast.error('Errore')
    }
  }

  // Variant functions
  function openCreateVariant(serviceId: string) {
    setVariantServiceId(serviceId)
    setEditingVariantId(null)
    setVariantForm(emptyVariant)
    setVariantDialogOpen(true)
  }

  function openEditVariant(serviceId: string, variant: ServiceVariant) {
    setVariantServiceId(serviceId)
    setEditingVariantId(variant.id)
    setVariantForm({
      name: variant.name,
      duration: variant.duration,
      price: variant.price,
    })
    setVariantDialogOpen(true)
  }

  async function handleSaveVariant() {
    if (!variantForm.name.trim() || !variantServiceId) return
    try {
      const url = editingVariantId
        ? `/api/services/${variantServiceId}/variants/${editingVariantId}`
        : `/api/services/${variantServiceId}/variants`
      const method = editingVariantId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(variantForm),
      })
      if (!res.ok) throw new Error()
      toast.success(editingVariantId ? 'Variante aggiornata' : 'Variante creata')
      setVariantDialogOpen(false)
      fetchServices()
    } catch {
      toast.error('Errore')
    }
  }

  async function handleDeleteVariant(variantId: string) {
    if (!variantServiceId) return
    try {
      const res = await fetch(
        `/api/services/${variantServiceId}/variants/${variantId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (res.ok) {
        toast.success('Variante eliminata')
        fetchServices()
      }
    } catch {
      toast.error('Errore')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Servizi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestisci i servizi della tua attività
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 min-h-[44px] bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="w-4 h-4" />
          Nuovo Servizio
        </Button>
      </div>

      {/* Quick suggestion badges */}
      {suggestions.length > 0 && !dialogOpen && (
        <div className="bg-muted/50 rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Suggerimenti rapidi</span>
            <span className="text-xs text-muted-foreground">— clicca per precompilare il form</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm({ ...emptyService, name: s.name, duration: s.durationMinutes })
                  setDialogOpen(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-card text-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {s.name} <span className="text-muted-foreground">({s.durationMinutes} min)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca servizi..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!categoryFilter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('')}
              className="min-h-[36px]"
            >
              Tutti
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                className="min-h-[36px]"
              >
                {cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Service list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-60" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              {search || categoryFilter
                ? 'Nessun servizio trovato'
                : 'Nessun servizio ancora'}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search || categoryFilter
                ? 'Prova a modificare la ricerca'
                : 'Inizia aggiungendo il tuo primo servizio'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((service) => {
            const isExpanded = expandedId === service.id
            return (
              <motion.div key={service.id} layout>
                <Card
                  className={`transition-colors ${!service.active ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 shrink-0">
                        <Clock className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base">
                            {service.name}
                          </h3>
                          {service.category && (
                            <Badge variant="secondary" className="text-xs">
                              {service.category}
                            </Badge>
                          )}
                          {!service.active && (
                            <Badge variant="outline" className="text-xs">
                              Inattivo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {service.duration} min • {formatPrice(service.price)}
                          {service.variants.length > 0 &&
                            ` • ${service.variants.length} variant${service.variants.length > 1 ? 'i' : 'e'}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(service)}
                          className="min-w-[36px] min-h-[36px]"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDelete(service)}
                          className="min-w-[36px] min-h-[36px] text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Switch
                          checked={service.active}
                          onCheckedChange={() => toggleActive(service)}
                        />
                        {service.variants.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : service.id)
                            }
                            className="min-w-[36px] min-h-[36px]"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Variants */}
                    <AnimatePresence>
                      {isExpanded && service.variants.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pl-4 border-l-2 border-amber-200 space-y-2">
                            {service.variants.map((variant) => (
                              <div
                                key={variant.id}
                                className="flex items-center gap-2 text-sm py-1"
                              >
                                <span className="font-medium">
                                  {variant.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {variant.duration > 0
                                    ? `${variant.duration} min`
                                    : `${service.duration} min`}
                                  {' • '}
                                  {formatPrice(variant.price)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    openEditVariant(service.id, variant)
                                  }
                                  className="ml-auto min-h-[32px] min-w-[32px] p-1"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteVariant(variant.id)
                                  }
                                  className="min-h-[32px] min-w-[32px] p-1 text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 gap-1 min-h-[36px]"
                              onClick={() => openCreateVariant(service.id)}
                            >
                              <Plus className="w-3 h-3" /> Aggiungi variante
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Service Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifica Servizio' : 'Nuovo Servizio'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Modifica i dettagli del servizio'
                : 'Inserisci i dettagli del nuovo servizio'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Es: Servizio Standard"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descrizione opzionale del servizio..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Durata (min)</Label>
                <Input
                  type="number"
                  min={5}
                  value={form.duration}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Prezzo (€)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Pausa (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.buffer}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      buffer: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Es: Standard, Premium"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="svc-active" className="text-sm">
                Attivo
              </Label>
              <Switch
                id="svc-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="svc-staff" className="text-sm">
                Richiede operatore
              </Label>
              <Switch
                id="svc-staff"
                checked={form.requiresStaff}
                onCheckedChange={(v) =>
                  setForm({ ...form, requiresStaff: v })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="min-h-[44px]"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="min-h-[44px] bg-amber-600 hover:bg-amber-700"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Salva' : 'Crea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variant Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingVariantId ? 'Modifica Variante' : 'Nuova Variante'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={variantForm.name}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, name: e.target.value })
                }
                placeholder="Es: Lungo, Corto"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Durata (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={variantForm.duration}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      duration: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0 = default"
                />
              </div>
              <div className="space-y-2">
                <Label>Prezzo (€)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={variantForm.price}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0 = default"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVariantDialogOpen(false)}
              className="min-h-[44px]"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSaveVariant}
              disabled={!variantForm.name.trim()}
              className="min-h-[44px] bg-amber-600 hover:bg-amber-700"
            >
              {editingVariantId ? 'Salva' : 'Aggiungi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il servizio?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il servizio verrà
              eliminato definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 min-h-[44px]"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


