'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import AppointmentModal from './AppointmentModal'

interface Appointment {
  id: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  client: { id: string; firstName: string; lastName: string; phone: string | null }
  service: { id: string; name: string; durationMinutes: number; price: number }
  variant: { id: string; name: string } | null
  staff: { id: string; name: string; color: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500',
  PENDING: 'bg-amber-500',
  CANCELLED: 'bg-red-400',
  COMPLETED: 'bg-slate-400',
  NO_SHOW: 'bg-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confermato',
  PENDING: 'In attesa',
  CANCELLED: 'Annullato',
  COMPLETED: 'Completato',
  NO_SHOW: 'Non presentato',
}

export default function CalendarView() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)

  const getToken = () => localStorage.getItem('session_token')

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const loadAppointments = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return
      const from = format(weekStart, 'yyyy-MM-dd')
      const to = format(addDays(weekStart, 6), 'yyyy-MM-dd')
      const res = await fetch(`/api/appointments?from=${from}&to=${to}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { loadAppointments() }, [loadAppointments])

  const goPrev = () => setWeekStart(addDays(weekStart, -7))
  const goNext = () => setWeekStart(addDays(weekStart, 7))
  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const handleSlotClick = (date: Date, time: string) => {
    setSelectedDate(date)
    setSelectedSlot(time)
    setSelectedApt(null)
    setModalOpen(true)
  }

  const handleAptClick = (apt: Appointment) => {
    setSelectedDate(new Date(apt.startTime))
    setSelectedSlot('')
    setSelectedApt(apt)
    setModalOpen(true)
  }

  const handleNewAppointment = () => {
    setSelectedDate(new Date())
    setSelectedSlot('')
    setSelectedApt(null)
    setModalOpen(true)
  }

  // Generate hour slots from 8:00 to 20:00
  const hours = Array.from({ length: 13 }, (_, i) => i + 8)

  const getAppointmentsForSlot = (date: Date, hour: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime)
      if (!isSameDay(aptDate, date)) return false
      const aptHour = aptDate.getHours()
      return aptHour === hour
    })
  }

  const weekLabel = `${format(weekStart, 'd MMM', { locale: it })} - ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: it })}`

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendario</h1>
          <p className="text-muted-foreground text-sm mt-1">{weekLabel}</p>
        </div>
        <Button className="gap-2 min-h-[44px] rounded-xl" onClick={handleNewAppointment}>
          <Plus className="w-4 h-4" />
          Nuovo Appuntamento
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" onClick={goPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" className="min-h-[44px] rounded-lg" onClick={goToday}>
          Oggi
        </Button>
        <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" onClick={goNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[700px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
              <div className="p-2" />
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date())
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-2 text-center border-l border-border ${isToday ? 'bg-primary/5' : ''}`}
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {format(day, 'EEE', { locale: it })}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Time Slots */}
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50 min-h-[60px]">
                <div className="p-2 text-xs text-muted-foreground font-medium text-right pr-3 flex items-end justify-end pb-1">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {weekDays.map((day) => {
                  const dayApts = getAppointmentsForSlot(day, hour)
                  const isToday = isSameDay(day, new Date())
                  const isPast = isToday && hour < new Date().getHours()

                  return (
                    <div
                      key={day.toISOString()}
                      className={`border-l border-border/50 p-0.5 cursor-pointer hover:bg-muted/50 transition-colors ${
                        isPast ? 'opacity-40' : ''
                      } ${isToday ? 'bg-primary/[0.02]' : ''}`}
                      onClick={() => !isPast && handleSlotClick(day, `${String(hour).padStart(2, '0')}:00`)}
                    >
                      <div className="space-y-0.5">
                        {dayApts.map((apt) => (
                          <motion.div
                            key={apt.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAptClick(apt)
                            }}
                            className="rounded-md px-1.5 py-0.5 text-xs cursor-pointer hover:brightness-95 transition-all border-l-2"
                            style={{
                              backgroundColor: apt.staff?.color + '15' || '#f5f5f4',
                              borderLeftColor: apt.staff?.color || '#d97706',
                            }}
                          >
                            <p className="font-medium truncate text-[11px]">
                              {format(new Date(apt.startTime), 'HH:mm')} {apt.client.firstName} {apt.client.lastName[0]}.
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {apt.service.name}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[key]}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        date={selectedDate}
        defaultTime={selectedSlot}
        appointment={selectedApt}
        onSaved={() => loadAppointments()}
      />
    </div>
  )
}
