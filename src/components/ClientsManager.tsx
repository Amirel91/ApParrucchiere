'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Client {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  notes: string | null
  gender: string | null
  _count: { appointments: number }
  appointments: { startTime: string }[]
}

interface ClientFormData {
  firstName: string
  lastName: string
  phone: string
  email: string
  notes: string
  gender: string
}

export default function ClientsManager() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '', lastName: '', phone: '', email: '', notes: '', gender: '',
  })
  const [saving, setSaving] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getToken = () => localStorage.getItem('session_token')

  const loadClients = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/clients${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load clients:', err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { loadClients() }, [loadClients])

  const openCreate = () => {
    setEditingId(null)
    setFormData({ firstName: '', lastName: '', phone: '', email: '', notes: '', gender: '' })
    setDialogOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditingId(client.id)
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone || '',
      email: client.email || '',
      notes: client.notes || '',
      gender: client.gender || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName) return
    setSaving(true)
    try {
      const token = getToken()
      const url = editingId ? `/api/clients/${editingId}` : '/api/clients'
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore')
      }
      setDialogOpen(false)
      loadClients()
    } catch (err) {
      console.error('Failed to save client:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const token = getToken()
      await fetch(`/api/clients/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setDeleteDialogOpen(false)
      setDeletingId(null)
      loadClients()
    } catch {
      console.error('Failed to delete client')
    }
  }

  const getLastAppointment = (client: Client) => {
    if (client.appointments.length === 0) return null
    const last = client.appointments[0]
    return new Date(last.startTime).toLocaleDateString('it-IT')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clienti</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} clienti totali</p>
        </div>
        <Button className="gap-2 min-h-[44px] rounded-xl" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nuovo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per nome o telefono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 min-h-[44px] max-w-md"
        />
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : clients.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="font-medium">Nessun cliente trovato</p>
            <p className="text-sm text-muted-foreground mt-1">Aggiungi il tuo primo cliente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {clients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">
                          {client.firstName} {client.lastName}
                        </h3>
                        {client.gender && (
                          <span className="text-xs text-muted-foreground">
                            {client.gender === 'UOMO' ? '♂' : client.gender === 'DONNA' ? '♀' : '⚡'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {client.phone || '—'} • {client._count.appointments} appuntamenti
                        {getLastAppointment(client) && ` • Ultimo: ${getLastAppointment(client)}`}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => openEdit(client)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive" onClick={() => { setDeletingId(client.id); setDeleteDialogOpen(true) }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifica Cliente' : 'Nuovo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="min-h-[44px]" />
              </div>
              <div className="space-y-2">
                <Label>Cognome *</Label>
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="min-h-[44px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="min-h-[44px]" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="min-h-[44px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Genere</Label>
              <div className="flex gap-2">
                {[
                  { value: 'DONNA', label: '♀ Donna' },
                  { value: 'UOMO', label: '♂ Uomo' },
                  { value: 'ALTRO', label: '⚡ Altro' },
                ].map((g) => (
                  <Button
                    key={g.value}
                    variant={formData.gender === g.value ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 min-h-[40px] rounded-lg text-xs"
                    onClick={() => setFormData({ ...formData, gender: formData.gender === g.value ? '' : g.value })}
                  >
                    {g.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="min-h-[80px]" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setDialogOpen(false)}>Annulla</Button>
              <Button className="flex-1 min-h-[44px]" disabled={!formData.firstName || !formData.lastName || saving} onClick={handleSave}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Salva' : 'Crea'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il cliente?</AlertDialogTitle>
            <AlertDialogDescription>Questa azione non può essere annullata.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Annulla</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90" onClick={handleDelete}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
