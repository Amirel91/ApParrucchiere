'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CalendarDays, Users, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { StatsCard } from './StatsCard'
import { AppointmentCard } from './AppointmentCard'
import { EmptyState } from './EmptyState'
import { ServiceForm } from './ServiceForm'
import { ServiceCard } from './ServiceCard'
import { formatDate, formatPrice } from '@/lib/utils'
import type { Service, Appointment } from '@/lib/store'

interface AdminDashboardProps {
  currentUser: any
}

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments')
      const data = await res.json()
      setAppointments(data)
    } catch {
      // Error handling
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const todayAppointments = appointments
    .filter(
      (apt) =>
        apt.status !== 'CANCELLED' &&
        new Date(apt.startTime) >= today &&
        new Date(apt.startTime) < tomorrow
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

  const weekAppointments = appointments.filter(
    (apt) =>
      apt.status !== 'CANCELLED' &&
      new Date(apt.startTime) >= today &&
      new Date(apt.startTime) < nextWeek
  )

  const uniqueClients = new Set(appointments.map((apt) => apt.clientId)).size

  const handleCancel = async (id: string) => {
    await fetch(`/api/appointments/${id}/cancel`, { method: 'PUT' })
    fetchAppointments()
  }

  const handleComplete = async (id: string) => {
    await fetch(`/api/appointments/${id}/confirm`, { method: 'PUT' })
    fetchAppointments()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6 max-w-5xl mx-auto"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatsCard
          title="Appuntamenti Oggi"
          value={todayAppointments.length}
          icon={CalendarDays}
        />
        <StatsCard
          title="Prossimi 7 Giorni"
          value={weekAppointments.length}
          icon={CalendarDays}
        />
        <StatsCard
          title="Totale Clienti"
          value={uniqueClients}
          icon={Users}
        />
      </div>

      {/* Today's appointments */}
      <Card className="rounded-2xl border-0 shadow-sm shadow-black/5 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Appuntamenti di Oggi</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAppointments}
            className="h-8 px-2 text-xs rounded-lg"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : todayAppointments.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-10 w-10" strokeWidth={1.5} />}
            title="Nessun appuntamento oggi"
            description="Goditi la giornata tranquilla"
          />
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                showClientInfo
                showActions
                isAdmin
                onCancel={handleCancel}
                onComplete={handleComplete}
              />
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
