'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AppointmentCard } from './AppointmentCard'
import { EmptyState } from './EmptyState'
import { CalendarDays } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { Appointment } from '@/lib/store'

interface AdminCalendarProps {
  appointments: Appointment[]
  onCancel: (id: string) => void
  onComplete: (id: string) => void
}

function getAppointmentDays(appointments: Appointment[]): Set<string> {
  const days = new Set<string>()
  appointments.forEach((apt) => {
    const d = new Date(apt.startTime)
    if (apt.status !== 'CANCELLED') {
      days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    }
  })
  return days
}

export function AdminCalendar({ appointments, onCancel, onComplete }: AdminCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayDetail, setShowDayDetail] = useState(false)

  const appointmentDays = getAppointmentDays(appointments)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const selectedDayAppointments = selectedDate
    ? appointments
        .filter(
          (apt) =>
            isSameDay(new Date(apt.startTime), selectedDate) &&
            apt.status !== 'CANCELLED'
        )
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
    : []

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date)
    setShowDayDetail(true)
  }, [])

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Calendar */}
      <Card className="rounded-2xl border-0 shadow-sm shadow-black/5 p-4 sm:p-6">
        {/* Month header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-9 w-9 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold text-lg capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-9 w-9 rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const inMonth = isSameMonth(d, currentMonth)
            const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            const hasAppts = appointmentDays.has(dayKey)
            const isSelected = selectedDate && isSameDay(d, selectedDate)
            const isToday = isSameDay(d, new Date())

            return (
              <button
                key={i}
                onClick={() => handleDayClick(d)}
                disabled={!inMonth}
                className={`
                  relative flex flex-col items-center justify-center h-10 sm:h-12 rounded-xl text-sm transition-all
                  ${!inMonth ? 'text-transparent' : 'hover:bg-secondary'}
                  ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}
                  ${isToday && !isSelected ? 'font-bold ring-2 ring-primary ring-offset-1' : ''}
                `}
              >
                {format(d, 'd')}
                {inMonth && hasAppts && (
                  <div
                    className={`absolute bottom-1 w-1 h-1 rounded-full ${
                      isSelected ? 'bg-primary-foreground' : 'bg-primary'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Day detail */}
      <AnimatePresence>
        {showDayDetail && selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <Card className="rounded-2xl border-0 shadow-sm shadow-black/5 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {format(selectedDate, 'd MMMM yyyy', { locale: it })}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDayDetail(false)}
                  className="text-xs rounded-lg"
                >
                  Chiudi
                </Button>
              </div>

              {selectedDayAppointments.length === 0 ? (
                <EmptyState
                  title="Nessun appuntamento"
                  description="Nessuna prenotazione per questo giorno"
                />
              ) : (
                <div className="space-y-3">
                  {selectedDayAppointments.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      showClientInfo
                      showActions
                      isAdmin
                      onCancel={onCancel}
                      onComplete={onComplete}
                    />
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
