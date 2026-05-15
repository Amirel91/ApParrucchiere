'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Clock, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { formatDate, formatPrice, toDateInputString } from '@/lib/utils'
import { DatePicker } from './DatePicker'
import { TimeSlotPicker } from './TimeSlotPicker'
import type { Service } from '@/lib/store'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

export function BookingFlow() {
  const {
    selectedService,
    selectedDate,
    selectedTime,
    bookingStep,
    currentUser,
    selectDate,
    selectTime,
    setBookingStep,
    resetBooking,
    navigate,
  } = useAppStore()

  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [appointment, setAppointment] = useState<any>(null)

  const fetchSlots = async (date: Date) => {
    if (!selectedService) return
    setLoadingSlots(true)
    try {
      const dateStr = toDateInputString(date)
      // Pass client timezone offset so server generates slots in correct timezone
      const tzOffset = new Date().getTimezoneOffset()
      const res = await fetch(
        `/api/slots?date=${dateStr}&serviceId=${selectedService.id}&tzOffset=${tzOffset}`
      )
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      setSlots(data.slots || [])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateSelect = (date: Date) => {
    selectDate(date)
    selectTime(null)
    if (bookingStep < 3) setBookingStep(3)
    fetchSlots(date)
  }

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !currentUser) return

    setSubmitting(true)
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const startTime = new Date(selectedDate)
      startTime.setHours(hours, minutes, 0, 0)

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: currentUser.id,
          serviceId: selectedService.id,
          startTime: startTime.toISOString(),
          clientName: currentUser.name,
          clientPhone: currentUser.phone,
          clientEmail: currentUser.email,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setAppointment(data)
        setSuccess(true)
      }
    } catch {
      // Handle error
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    resetBooking()
    setSuccess(false)
    setAppointment(null)
    setSlots([])
    navigate('client-home')
  }

  const next14Days = useMemo(() => {
    const days: Date[] = []
    const today = new Date()
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      days.push(d)
    }
    return days
  }, [])

  if (!selectedService) return null

  // Success state
  if (success && appointment) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 max-w-lg mx-auto"
      >
        <Card className="rounded-2xl border-0 shadow-sm p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Prenotazione Confermata!</h2>
          <div className="space-y-2 text-sm text-muted-foreground mb-6">
            <p className="font-medium text-foreground">
              {appointment.service?.name || selectedService.name}
            </p>
            <p>{formatDate(appointment.startTime)}</p>
            <p>{selectedTime}</p>
            <p className="font-semibold text-base text-foreground">
              {formatPrice(selectedService.price)}
            </p>
          </div>
          <Button onClick={handleClose} className="w-full h-12 rounded-xl">
            Torna alla Home
          </Button>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 max-w-lg mx-auto"
    >
      {/* Back button */}
      <button
        onClick={handleClose}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Indietro
      </button>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6 px-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                bookingStep >= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {bookingStep > step ? <Check className="h-3.5 w-3.5" /> : step}
            </div>
            {step < 4 && (
              <div
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  bookingStep > step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between mb-6 px-1">
        <span className={`text-[10px] ${bookingStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          Servizio
        </span>
        <span className={`text-[10px] ${bookingStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          Data
        </span>
        <span className={`text-[10px] ${bookingStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          Ora
        </span>
        <span className={`text-[10px] ${bookingStep >= 4 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          Conferma
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Service Summary */}
        {bookingStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="rounded-2xl border-0 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-1">{selectedService.name}</h2>
              {selectedService.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedService.description}
                </p>
              )}
              <div className="flex items-center gap-4 mb-6">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {selectedService.durationMinutes} minuti
                </span>
                <span className="font-semibold text-lg">
                  {formatPrice(selectedService.price)}
                </span>
              </div>
              <Button
                className="w-full h-12 rounded-xl"
                onClick={() => setBookingStep(2)}
              >
                Scegli la data
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Date Picker */}
        {bookingStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="rounded-2xl border-0 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Scegli la data</h2>
              <DatePicker
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
                days={next14Days}
              />
              {selectedDate && (
                <Button
                  className="w-full h-12 rounded-xl mt-4"
                  onClick={() => {
                    setBookingStep(3)
                    fetchSlots(selectedDate)
                  }}
                >
                  Scegli l&apos;orario
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </Card>
          </motion.div>
        )}

        {/* Step 3: Time Slot Picker */}
        {bookingStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="rounded-2xl border-0 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  {selectedDate ? formatDate(selectedDate) : ''}
                </h2>
              </div>

              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nessuno slot disponibile per questa data.
                </p>
              ) : (
                <TimeSlotPicker
                  slots={slots}
                  selectedTime={selectedTime}
                  onSelect={(time) => {
                    selectTime(time)
                    setBookingStep(4)
                  }}
                />
              )}

              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setBookingStep(2)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Cambia data
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Confirmation */}
        {bookingStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="rounded-2xl border-0 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Riepilogo</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Servizio</span>
                  <span className="font-medium">{selectedService.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Durata</span>
                  <span className="font-medium">{selectedService.durationMinutes} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Data</span>
                  <span className="font-medium">
                    {selectedDate ? formatDate(selectedDate) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Orario</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-semibold">Totale</span>
                  <span className="font-bold text-lg">
                    {formatPrice(selectedService.price)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setBookingStep(3)}
                >
                  Indietro
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Conferma Prenotazione'
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
