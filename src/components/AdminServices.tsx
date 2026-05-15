'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ServiceForm } from './ServiceForm'
import { EmptyState } from './EmptyState'
import { formatPrice } from '@/lib/utils'
import type { Service } from '@/lib/store'

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services')
      const data = await res.json()
      setServices(data)
    } catch {
      // Error handling
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleSubmit = async (data: {
    name: string
    description: string
    durationMinutes: number
    price: number
    bufferMinutes: number
  }) => {
    setSubmitting(true)
    try {
      if (editingService) {
        await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      } else {
        await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      }
      setFormOpen(false)
      setEditingService(null)
      fetchServices()
    } catch {
      // Error handling
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (service: Service) => {
    await fetch(`/api/services/${service.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !service.active }),
    })
    fetchServices()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    fetchServices()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6 max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Gestione Servizi</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchServices}
            className="h-8 px-2 text-xs rounded-lg"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingService(null)
              setFormOpen(true)
            }}
            className="h-8 rounded-xl gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuovo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          title="Nessun servizio"
          description="Inizia creando il primo servizio"
          action={
            <Button
              onClick={() => {
                setEditingService(null)
                setFormOpen(true)
              }}
              className="rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1" />
              Crea Servizio
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <Card
              key={service.id}
              className={`rounded-2xl border-0 shadow-sm shadow-black/5 p-4 sm:p-5 transition-opacity ${
                !service.active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm sm:text-base">
                      {service.name}
                    </h3>
                    {!service.active && (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        Inattivo
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="text-muted-foreground">
                      {service.durationMinutes} min
                    </span>
                    <span className="font-medium">
                      {formatPrice(service.price)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      +{service.bufferMinutes} min pausa
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={service.active}
                    onCheckedChange={() => handleToggleActive(service)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => {
                      setEditingService(service)
                      setFormOpen(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ServiceForm
        service={editingService}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingService(null)
        }}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </motion.div>
  )
}
