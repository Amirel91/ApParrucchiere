'use client'

import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Service } from '@/lib/store'

interface ServiceFormProps {
  service?: Service | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    name: string
    description: string
    durationMinutes: number
    price: number
    bufferMinutes: number
  }) => void
  loading?: boolean
}

export function ServiceForm({
  service,
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: ServiceFormProps) {
  const getInitialState = useCallback(() => {
    if (service) {
      return {
        name: service.name,
        description: service.description || '',
        duration: String(service.durationMinutes),
        price: String(service.price),
        buffer: String(service.bufferMinutes),
      }
    }
    return { name: '', description: '', duration: '', price: '', buffer: '10' }
  }, [service])

  const [formState, setFormState] = useState(getInitialState)
  const [initialized, setInitialized] = useState(false)

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setFormState(getInitialState())
        setInitialized(true)
      }
      onOpenChange(newOpen)
    },
    [getInitialState, onOpenChange]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { name, description, duration, price, buffer } = formState
    if (!name || !duration || !price) return
    onSubmit({
      name,
      description,
      durationMinutes: parseInt(duration),
      price: parseFloat(price),
      bufferMinutes: parseInt(buffer),
    })
  }

  const { name, description, duration, price, buffer } = formState

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {service ? 'Modifica Servizio' : 'Nuovo Servizio'}
          </DialogTitle>
        </DialogHeader>
        {initialized && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="svc-name">Nome *</Label>
              <Input
                id="svc-name"
                value={name}
                onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                placeholder="Es: Taglio Capelli"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-desc">Descrizione</Label>
              <Textarea
                id="svc-desc"
                value={description}
                onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
                placeholder="Descrizione del servizio..."
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="svc-dur">Durata (min) *</Label>
                <Input
                  id="svc-dur"
                  type="number"
                  min="5"
                  value={duration}
                  onChange={(e) => setFormState((s) => ({ ...s, duration: e.target.value }))}
                  placeholder="30"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-price">Prezzo (€) *</Label>
                <Input
                  id="svc-price"
                  type="number"
                  min="0"
                  step="0.5"
                  value={price}
                  onChange={(e) => setFormState((s) => ({ ...s, price: e.target.value }))}
                  placeholder="18.00"
                  className="rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-buffer">Intervallo tra appuntamenti (min)</Label>
              <Input
                id="svc-buffer"
                type="number"
                min="0"
                value={buffer}
                onChange={(e) => setFormState((s) => ({ ...s, buffer: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => handleOpenChange(false)}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl"
                disabled={loading || !name || !duration || !price}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : service ? (
                  'Salva Modifiche'
                ) : (
                  'Crea Servizio'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
