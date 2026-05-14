'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Phone,
  Mail,
  Scissors,
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
import { Checkbox } from '@/components/ui/checkbox'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface StaffMember {
  id: string
  name: string
  phone: string
  email: string
  role: 'OWNER' | 'OPERATOR' | 'ASSISTANT'
  color: string
  serviceIds: string[]
  services?: { id: string; name: string }[]
  appointmentCount?: number
}

interface StaffFormData {
  name: string
  phone: string
  email: string
  role: 'OWNER' | 'OPERATOR' | 'ASSISTANT'
  color: string
}

const PRESET_COLORS = [
  'bg-amber-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
]

const emptyForm: StaffFormData = {
  name: '',
  phone: '',
  email: '',
  role: 'OPERATOR',
  color: 'bg-amber-500',
}

const roleLabels: Record<string, string> = {
  OWNER: 'Proprietario',
  OPERATOR: 'Operatore',
  ASSISTANT: 'Assistente',
}

export default function StaffManager() {
  const { session } = useAppStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [allServices, setAllServices] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<StaffFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignStaffId, setAssignStaffId] = useState<string | null>(null)
  const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([])

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const token = session?.token

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [staffRes, svcRes] = await Promise.all([
        fetch('/api/staff', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/services', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      if (staffRes.ok) setStaff(await staffRes.json())
      if (svcRes.ok) {
        const svcs = await svcRes.json()
        setAllServices(svcs.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
      }
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(member: StaffMember) {
    setEditingId(member.id)
    setForm({
      name: member.name,
      phone: member.phone,
      email: member.email,
      role: member.role,
      color: member.color,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = editingId ? `/api/staff/${editingId}` : '/api/staff'
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
      toast.success(editingId ? 'Membro aggiornato' : 'Membro aggiunto')
      setDialogOpen(false)
      fetchData()
    } catch {
      toast.error('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  function openAssign(member: StaffMember) {
    setAssignStaffId(member.id)
    setAssignedServiceIds(member.serviceIds || [])
    setAssignOpen(true)
  }

  async function handleAssignSave() {
    if (!assignStaffId) return
    try {
      const res = await fetch(`/api/staff/${assignStaffId}/services`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ serviceIds: assignedServiceIds }),
      })
      if (!res.ok) throw new Error()
      toast.success('Servizi assegnati')
      setAssignOpen(false)
      fetchData()
    } catch {
      toast.error('Errore')
    }
  }

  function openDelete(member: StaffMember) {
    if (member.appointmentCount && member.appointmentCount > 0) {
      toast.error('Impossibile eliminare: il membro ha appuntamenti collegati')
      return
    }
    setDeletingId(member.id)
    setDeleteOpen(true)
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/staff/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      toast.success('Membro eliminato')
      setStaff((prev) => prev.filter((m) => m.id !== deletingId))
      if (selectedStaff?.id === deletingId) setSelectedStaff(null)
    } catch {
      toast.error('Errore')
    } finally {
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestisci i membri del tuo team
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 min-h-[44px] bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Membro
        </Button>
      </div>

      {/* Staff list */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : staff.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              Nessun membro nello staff
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Inizia aggiungendo il primo membro del team
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staff.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Card
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  selectedStaff?.id === member.id
                    ? 'ring-2 ring-amber-300'
                    : ''
                }`}
                onClick={() =>
                  setSelectedStaff(
                    selectedStaff?.id === member.id ? null : member
                  )
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-11 h-11 shrink-0">
                      <AvatarFallback
                        className={`${member.color} text-white text-sm font-semibold`}
                      >
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {member.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs mt-0.5">
                        {roleLabels[member.role] || member.role}
                      </Badge>
                    </div>
                  </div>
                  {(member.phone || member.email) && (
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {member.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </p>
                      )}
                      {member.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                    <Scissors className="w-3 h-3" />
                    <span>
                      {(member.services?.length || member.serviceIds?.length || 0)}{' '}
                      serviz{i(member.services?.length || member.serviceIds?.length || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Staff detail panel */}
      {selectedStaff && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Dettagli: {selectedStaff.name}
                </CardTitle>
                <CardDescription>
                  Gestisci i servizi assegnati a questo membro
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAssign(selectedStaff)}
                  className="gap-1 min-h-[36px]"
                >
                  <Scissors className="w-3 h-3" />
                  Servizi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(selectedStaff)}
                  className="min-h-[36px]"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDelete(selectedStaff)}
                  className="min-h-[36px] text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedStaff.services && selectedStaff.services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedStaff.services.map((svc) => (
                    <Badge key={svc.id} variant="secondary">
                      {svc.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nessun servizio assegnato
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifica Membro' : 'Nuovo Membro'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Modifica i dati del membro'
                : 'Inserisci i dati del nuovo membro'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mario Rossi"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+39 333 1234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="mario@esempio.it"
              />
            </div>
            <div className="space-y-2">
              <Label>Ruolo</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm({ ...form, role: v as StaffFormData['role'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Proprietario</SelectItem>
                  <SelectItem value="OPERATOR">Operatore</SelectItem>
                  <SelectItem value="ASSISTANT">Assistente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Colore</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    className={`w-8 h-8 rounded-full ${color} transition-all ${
                      form.color === color
                        ? 'ring-2 ring-offset-2 ring-foreground'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
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
              {editingId ? 'Salva' : 'Aggiungi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Services Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assegna Servizi</DialogTitle>
            <DialogDescription>
              Seleziona i servizi che questo membro può eseguire
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-64">
            <div className="space-y-2 py-2">
              {allServices.map((svc) => (
                <label
                  key={svc.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={assignedServiceIds.includes(svc.id)}
                    onCheckedChange={(checked) => {
                      setAssignedServiceIds((prev) =>
                        checked
                          ? [...prev, svc.id]
                          : prev.filter((id) => id !== svc.id)
                      )
                    }}
                  />
                  <span className="text-sm">{svc.name}</span>
                </label>
              ))}
              {allServices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun servizio disponibile. Crea prima un servizio.
                </p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignOpen(false)}
              className="min-h-[44px]"
            >
              Annulla
            </Button>
            <Button
              onClick={handleAssignSave}
              className="min-h-[44px] bg-amber-600 hover:bg-amber-700"
            >
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata.
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

function i(n: number): string {
  return n === 1 ? 'io' : 'i'
}
