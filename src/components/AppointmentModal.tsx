'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { format, isSameDay } from 'date-fns'

interface Appointment {
  id: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  clientNotes: string | null
  client: { id: string; firstName: string; lastName: string }
  service: { id: string; name: string; durationMinutes: number; price: number }
  variant: { id: string; name: string } | null
  staff: { id: string; name: string; color: string } | null
}

interface ClientOption {
  id: string
  firstName: string
  lastName: string
}

interface ServiceOption {
  id: string
  name: string
  durationMinutes: number
  price: number
  variants: { id: string; name: string; durationMinutes: number; price: number }[]
}

interface StaffOption {
  id: string
  name: string
  color: string
}

interface SlotOption {
  time: string
}

interface AppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  defaultTime?: string
  appointment?: Appointment | null
  onSaved?: () => void
}

export default function AppointmentModal({
  open, onOpenChange, date, defaultTime, appointment, onSaved,
}: AppointmentModalProps) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [staff, setStaff] = useState<StaffOption[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [clientId, setClientId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')

  const isEditing = !!appointment

  const getToken = () => localStorage.getItem('session_token')

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  useEffect(() => {
    if (appointment && open) {
      setClientId(appointment.client.id)
      setServiceId(appointment.service.id)
      setVariantId(appointment.variant?.id || '')
      setStaffId(appointment.staff?.id || '')
      setTime(format(new Date(appointment.startTime), 'HH:mm'))
      setNotes(appointment.notes || '')
      setStatus(appointment.status)
    } else if (open) {
      setClientId('')
      setServiceId('')
      setVariantId('')
      setStaffId('')
      setTime(defaultTime || '')
      setNotes('')
      setStatus('CONFIRMED')
    }
  }, [appointment, open, defaultTime])

  useEffect(() => {
    if (serviceId && date) {
      loadSlots()
    }
  }, [serviceId, date, staffId])

  const loadData = async () => {
    try {
      const token = getToken()
      if (!token) return
      const [clientsRes, servicesRes, staffRes] = await Promise.all([
        fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/services?active=true', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/staff', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setClients(await clientsRes.json())
      setServices(await servicesRes.json())
      setStaff(await staffRes.json())
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const loadSlots = async () => {
    try {
      const token = getToken()
      if (!token || !serviceId) return
      const dateStr = format(date, 'yyyy-MM-dd')
      const params = new URLSearchParams({ date: dateStr, serviceId })
      if (staffId) params.set('staffId', staffId)
      const res = await fetch(`/api/slots?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setSlots(data.slots || [])
    } catch {
      setSlots([])
    }
  }

  const handleSave = async () => {
    if (!clientId || !serviceId || !time) return
    setSaving(true)
    try {
      const token = getToken()
      const startTime = `${format(date, 'yyyy-MM-dd')}T${time}:00`

      if (isEditing && appointment) {
        await fetch(`/api/appointments/${appointment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            clientId, serviceId,
            variantId: variantId || null,
            staffId: staffId || null,
            startTime,
            notes,
            status,
          }),
        })
      } else {
        await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            clientId, serviceId,
            variantId: variantId || null,
            staffId: staffId || null,
            startTime,
            notes,
            status: status || 'CONFIRMED',
          }),
        })
      }

      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      console.error('Failed to save appointment:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!appointment) return
    try {
      const token = getToken()
      await fetch(`/api/appointments/${appointment.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      console.error('Failed to cancel appointment:', err)
    }
  }

  const selectedService = services.find((s) => s.id === serviceId)

  const dateLabel = format(date, 'EEEE d MMMM yyyy', { locale: { code: 'it', localize: { day: (n: number) => ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'][n] } as any } })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}</DialogTitle>
          <DialogDescription>
            {format(date, 'd MMMM yyyy', { locale: { code: 'it' } as any })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Client */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Seleziona cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label>Servizio *</Label>
            <select
              value={serviceId}
              onChange={(e) => { setServiceId(e.target.value); setVariantId('') }}
              className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Seleziona servizio...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.durationMinutes} min — €{s.price.toFixed(0)}
                </option>
              ))}
            </select>
          </div>

          {/* Variant */}
          {selectedService && selectedService.variants.length > 0 && (
            <div className="space-y-2">
              <Label>Variante</Label>
              <select
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Standard</option>
                {selectedService.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.durationMinutes} min — €{v.price.toFixed(0)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Staff */}
          <div className="space-y-2">
            <Label>Operatore</Label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Qualsiasi</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label>Orario *</Label>
            {isEditing ? (
              <Input value={time} readOnly className="min-h-[44px]" />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Seleziona un servizio per vedere gli slot disponibili</p>
                ) : (
                  slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors min-h-[40px] ${
                        time === slot
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50 hover:bg-primary/5'
                      }`}
                      onClick={() => setTime(slot)}
                    >
                      {slot}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Status (editing only) */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Stato</Label>
              <div className="flex gap-2">
                {['CONFIRMED', 'PENDING', 'COMPLETED', 'NO_SHOW'].map((s) => (
                  <Button
                    key={s}
                    variant={status === s ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 min-h-[40px] rounded-lg text-xs"
                    onClick={() => setStatus(s)}
                  >
                    {s === 'CONFIRMED' ? 'Confermato' : s === 'PENDING' ? 'In attesa' : s === 'COMPLETED' ? 'Completato' : 'Non presentato'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[80px]" placeholder="Note interne..." />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isEditing && (
              <Button variant="outline" className="min-h-[44px] text-destructive hover:text-destructive" onClick={handleCancel}>
                Annulla App.
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" className="min-h-[44px]" onClick={() => onOpenChange(false)}>Chiudi</Button>
            <Button className="min-h-[44px]" disabled={!clientId || !serviceId || !time || saving} onClick={handleSave}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Salva' : 'Prenota'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
