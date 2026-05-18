'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from './EmptyState'
import { AppointmentCard } from './AppointmentCard'

interface ClientAppointmentsProps {
  userId: string
}

export function ClientAppointments({ userId }: ClientAppointmentsProps) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/appointments?role=CLIENT&userId=${userId}`
      )
      const data = await res.json()
      setAppointments(data)
    } catch {
      // Error handling
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleCancel = async (id: string) => {
    try {
      await fetch(`/api/appointments/${id}/cancel`, { method: 'PUT' })
      fetchAppointments()
    } catch {
      // Error handling
    }
  }

  const upcoming = appointments.filter(
    (apt: any) =>
      apt.status !== 'CANCELLED' &&
      apt.status !== 'COMPLETED' &&
      new Date(apt.startTime) > new Date()
  )

  const past = appointments.filter(
    (apt: any) =>
      apt.status === 'CANCELLED' ||
      apt.status === 'COMPLETED' ||
      new Date(apt.startTime) <= new Date()
  )

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 max-w-lg mx-auto pb-24"
    >
      {/* Upcoming */}
      <h2 className="text-lg font-semibold mb-3">Prossimi Appuntamenti</h2>
      {upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-12 w-12" strokeWidth={1.5} />}
          title="Nessun appuntamento"
          description="Non hai ancora prenotazioni. Prenota il tuo primo appuntamento!"
        />
      ) : (
        <div className="space-y-3 mb-8">
          {upcoming.map((apt: any) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              showActions
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
            Passati
          </h2>
          <div className="space-y-3">
            {past.map((apt: any) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}
