'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
} from 'lucide-react'

// ==================== TYPES ====================

interface Service {
  id: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  active: boolean
}

interface BookingData {
  serviceIds: string[]
  date: string
  time: string
  customer: {
    customerName: string
    customerSurname: string
    customerPhone: string
    customerEmail: string
  }
}

type AvailabilityLevel = 'high' | 'medium' | 'low' | 'none'

interface DayAvailability {
  date: string
  availability: AvailabilityLevel
}

// ==================== MAIN COMPONENT ====================

export default function PrenotaPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [booking, setBooking] = useState<BookingData>({
    serviceIds: [],
    date: '',
    time: '',
    customer: {
      customerName: '',
      customerSurname: '',
      customerPhone: '',
      customerEmail: '',
    },
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [dayAvailabilities, setDayAvailabilities] = useState<Record<string, AvailabilityLevel>>({})
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Fetch services on mount
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalDuration = booking.serviceIds.reduce((sum, id) => {
    const s = services.find(sv => sv.id === id)
    return sum + (s?.durationMinutes || 0)
  }, 0)

  const totalPrice = booking.serviceIds.reduce((sum, id) => {
    const s = services.find(sv => sv.id === id)
    return sum + (s?.price || 0)
  }, 0)

  const selectedServices = booking.serviceIds.map(id => services.find(s => s.id === id)).filter(Boolean) as Service[]

  // Toggle service selection
  const toggleService = (id: string) => {
    setBooking(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id)
        ? prev.serviceIds.filter(sid => sid !== id)
        : [...prev.serviceIds, id],
    }))
  }

  // ==================== STEP 1: SERVICES ====================

  const StepServices = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-1">Scegli i servizi</h2>
        <p className="text-stone-500 text-sm">Seleziona uno o più servizi per il tuo appuntamento</p>
      </div>

      <div className="space-y-3">
        {services.map(service => {
          const isSelected = booking.serviceIds.includes(service.id)
          return (
            <motion.button
              key={service.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleService(service.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-stone-900 bg-stone-50'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-stone-900 border-stone-900' : 'border-stone-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium text-stone-900">{service.name}</span>
                  </div>
                  {service.description && (
                    <p className="text-stone-500 text-sm mt-1 ml-8">{service.description}</p>
                  )}
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="font-semibold text-stone-900">€{service.price.toFixed(2)}</div>
                  <div className="text-stone-400 text-xs flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {service.durationMinutes} min
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Selection summary */}
      {booking.serviceIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl bg-stone-900 text-white flex items-center justify-between"
        >
          <div>
            <span className="text-stone-400 text-sm">Servizi selezionati</span>
            <div className="font-semibold">
              {booking.serviceIds.length} servizio{booking.serviceIds.length > 1 ? 'i' : ''} · {formatDuration(totalDuration)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-stone-400 text-sm">Totale</span>
            <div className="font-semibold">€{totalPrice.toFixed(2)}</div>
          </div>
        </motion.div>
      )}
    </div>
  )

  // ==================== STEP 2: CALENDAR ====================

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const fetchMonthAvailability = useCallback(async (year: number, month: number) => {
    if (totalDuration === 0) return
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const from = formatDate(firstDay)
    const to = formatDate(lastDay)

    try {
      const res = await fetch(`/api/slots?date=${from}&duration=${totalDuration}`)
      const startData = await res.json()

      const res2 = await fetch(`/api/slots?date=${to}&duration=${totalDuration}`)
      const endData = await res2.json()

      const newAvail: Record<string, AvailabilityLevel> = { ...dayAvailabilities }
      if (startData.slots) {
        newAvail[from] = startData.availability
      }
      if (endData.slots) {
        newAvail[to] = endData.availability
      }

      // Fetch all days in between (batch)
      const daysInMonth = lastDay.getDate()
      const promises = []
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        if (d !== 1 && d !== daysInMonth) {
          promises.push(
            fetch(`/api/slots?date=${dateStr}&duration=${totalDuration}`)
              .then(r => r.json())
              .then(data => {
                newAvail[dateStr] = data.availability || 'none'
              })
              .catch(() => {})
          )
        }
      }

      // Fetch in parallel batches
      const batchSize = 5
      for (let i = 0; i < promises.length; i += batchSize) {
        await Promise.all(promises.slice(i, i + batchSize))
      }

      setDayAvailabilities(newAvail)
    } catch (e) {
      console.error('Error fetching availability:', e)
    }
  }, [totalDuration])

  useEffect(() => {
    if (step === 2) {
      fetchMonthAvailability(calendarMonth.getFullYear(), calendarMonth.getMonth())
    }
  }, [step, calendarMonth, fetchMonthAvailability])

  const fetchSlotsForDate = async (dateStr: string) => {
    setLoadingSlots(true)
    setBooking(prev => ({ ...prev, date: dateStr, time: '' }))
    try {
      const res = await fetch(`/api/slots?date=${dateStr}&duration=${totalDuration}`)
      const data = await res.json()
      setAvailableSlots(data.slots || [])
    } catch {
      setAvailableSlots([])
    }
    setLoadingSlots(false)
  }

  const calendarDays = () => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startOffset = firstDay === 0 ? 6 : firstDay - 1 // Monday start

    const days: { date: number; dateStr: string; isPast: boolean; isToday: boolean }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < startOffset; i++) {
      days.push({ date: 0, dateStr: '', isPast: true, isToday: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dateObj = new Date(year, month, d)
      days.push({
        date: d,
        dateStr,
        isPast: dateObj < today,
        isToday: dateObj.getTime() === today.getTime(),
      })
    }
    return days
  }

  const getDayColor = (dateStr: string, isPast: boolean) => {
    if (isPast) return 'text-stone-300'
    const avail = dayAvailabilities[dateStr]
    if (!avail || avail === 'none') return 'text-stone-300'
    if (avail === 'high') return 'text-emerald-600 bg-emerald-50'
    if (avail === 'medium') return 'text-amber-600 bg-amber-50'
    return 'text-red-500 bg-red-50'
  }

  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
  const dayNames = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do']

  const StepCalendar = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-1">Scegli data e ora</h2>
        <p className="text-stone-500 text-sm">
          Durata totale: {formatDuration(totalDuration)} · {totalPrice.toFixed(2)}€
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-stone-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" /> Disponibile
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" /> Pochi posti
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" /> Completo
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-stone-600" />
          </button>
          <span className="font-semibold text-stone-900">
            {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
          </span>
          <button
            onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map(d => (
            <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays().map((day, i) => (
            <button
              key={i}
              disabled={day.isPast || (dayAvailabilities[day.dateStr] === 'none' && !day.isPast && day.date > 0)}
              onClick={() => day.date > 0 && !day.isPast && fetchSlotsForDate(day.dateStr)}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${
                day.date === 0
                  ? ''
                  : booking.date === day.dateStr
                  ? 'bg-stone-900 text-white font-semibold'
                  : getDayColor(day.dateStr, day.isPast)
              } ${day.date > 0 && !day.isPast ? 'hover:bg-stone-200 cursor-pointer' : ''}`}
            >
              {day.date > 0 ? day.date : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      {booking.date && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <h3 className="text-sm font-medium text-stone-700 mb-3">
            {loadingSlots ? 'Caricamento orari...' : `Orari disponibili per ${formatDisplayDate(booking.date)}`}
          </h3>

          {loadingSlots ? (
            <div className="flex items-center gap-2 text-stone-400">
              <div className="animate-spin w-4 h-4 border-2 border-stone-300 border-t-stone-900 rounded-full" />
              Caricamento...
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-stone-400 text-sm">Nessun orario disponibile per questa data</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map(slot => (
                <motion.button
                  key={slot}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBooking(prev => ({ ...prev, time: slot }))}
                  className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    booking.time === slot
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  {slot}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )

  // ==================== STEP 3: CUSTOMER INFO ====================

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!booking.customer.customerName.trim()) errors.customerName = 'Nome obbligatorio'
    if (!booking.customer.customerSurname.trim()) errors.customerSurname = 'Cognome obbligatorio'
    if (!booking.customer.customerPhone.trim()) errors.customerPhone = 'Telefono obbligatorio'
    else if (!/^[+]?[\d\s()-]{8,}$/.test(booking.customer.customerPhone)) errors.customerPhone = 'Telefono non valido'
    if (booking.customer.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.customer.customerEmail)) {
      errors.customerEmail = 'Email non valida'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const StepCustomerInfo = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-1">I tuoi dati</h2>
        <p className="text-stone-500 text-sm">Inserisci i tuoi dati per confermare la prenotazione</p>
      </div>

      {/* Booking summary */}
      <div className="mb-6 p-4 rounded-xl bg-stone-50 border border-stone-100">
        <div className="text-sm font-medium text-stone-700 mb-2">Riepilogo</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Data</span>
            <span className="font-medium">{formatDisplayDate(booking.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Ora</span>
            <span className="font-medium">{booking.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Durata</span>
            <span className="font-medium">{formatDuration(totalDuration)}</span>
          </div>
          <div className="border-t border-stone-200 pt-1 mt-1">
            {selectedServices.map(s => (
              <div key={s.id} className="flex justify-between">
                <span className="text-stone-600">{s.name}</span>
                <span className="font-medium">€{s.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-200 pt-1 mt-1 flex justify-between">
            <span className="font-semibold text-stone-900">Totale</span>
            <span className="font-semibold text-stone-900">€{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Nome *</label>
          <input
            type="text"
            value={booking.customer.customerName}
            onChange={e => {
              setBooking(prev => ({ ...prev, customer: { ...prev.customer, customerName: e.target.value } }))
              if (formErrors.customerName) setFormErrors(prev => ({ ...prev, customerName: '' }))
            }}
            placeholder="Mario"
            className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-stone-900 placeholder-stone-400 outline-none transition-colors ${
              formErrors.customerName ? 'border-red-400' : 'border-stone-200 focus:border-stone-900'
            }`}
          />
          {formErrors.customerName && <p className="text-red-500 text-xs mt-1">{formErrors.customerName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Cognome *</label>
          <input
            type="text"
            value={booking.customer.customerSurname}
            onChange={e => {
              setBooking(prev => ({ ...prev, customer: { ...prev.customer, customerSurname: e.target.value } }))
              if (formErrors.customerSurname) setFormErrors(prev => ({ ...prev, customerSurname: '' }))
            }}
            placeholder="Rossi"
            className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-stone-900 placeholder-stone-400 outline-none transition-colors ${
              formErrors.customerSurname ? 'border-red-400' : 'border-stone-200 focus:border-stone-900'
            }`}
          />
          {formErrors.customerSurname && <p className="text-red-500 text-xs mt-1">{formErrors.customerSurname}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Telefono *</label>
          <input
            type="tel"
            value={booking.customer.customerPhone}
            onChange={e => {
              setBooking(prev => ({ ...prev, customer: { ...prev.customer, customerPhone: e.target.value } }))
              if (formErrors.customerPhone) setFormErrors(prev => ({ ...prev, customerPhone: '' }))
            }}
            placeholder="+39 333 1234567"
            className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-stone-900 placeholder-stone-400 outline-none transition-colors ${
              formErrors.customerPhone ? 'border-red-400' : 'border-stone-200 focus:border-stone-900'
            }`}
          />
          {formErrors.customerPhone && <p className="text-red-500 text-xs mt-1">{formErrors.customerPhone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Email <span className="text-stone-400 font-normal">(opzionale)</span>
          </label>
          <input
            type="email"
            value={booking.customer.customerEmail}
            onChange={e => {
              setBooking(prev => ({ ...prev, customer: { ...prev.customer, customerEmail: e.target.value } }))
              if (formErrors.customerEmail) setFormErrors(prev => ({ ...prev, customerEmail: '' }))
            }}
            placeholder="mario@email.com"
            className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-stone-900 placeholder-stone-400 outline-none transition-colors ${
              formErrors.customerEmail ? 'border-red-400' : 'border-stone-200 focus:border-stone-900'
            }`}
          />
          {formErrors.customerEmail && <p className="text-red-500 text-xs mt-1">{formErrors.customerEmail}</p>}
        </div>
      </div>
    </div>
  )

  // ==================== STEP 4: CONFIRMATION ====================

  const StepConfirmation = () => (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6, bounce: 0.5 }}
        className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"
      >
        <PartyPopper className="w-10 h-10 text-emerald-600" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-semibold text-stone-900 mb-2">Prenotazione confermata!</h2>
        <p className="text-stone-500 mb-8">Grazie, ti aspettiamo!</p>

        <div className="text-left max-w-sm mx-auto p-5 rounded-xl bg-stone-50 border border-stone-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Data</span>
            <span className="font-medium">{formatDisplayDate(booking.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Ora</span>
            <span className="font-medium">{booking.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Cliente</span>
            <span className="font-medium">{booking.customer.customerName} {booking.customer.customerSurname}</span>
          </div>
          <div className="border-t border-stone-200 pt-2 space-y-1">
            {selectedServices.map(s => (
              <div key={s.id} className="flex justify-between">
                <span className="text-stone-600">{s.name}</span>
                <span className="font-medium">€{s.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-1 border-t border-stone-200">
              <span>Totale</span>
              <span>€{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/')}
          className="mt-8 px-8 py-3 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
        >
          Torna alla Home
        </button>
      </motion.div>
    </div>
  )

  // ==================== SUBMIT ====================

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    setError('')

    try {
      // Re-verify slot availability before submitting
      const slotRes = await fetch(`/api/slots?date=${booking.date}&duration=${totalDuration}`)
      const slotData = await slotRes.json()
      if (!slotData.slots || !slotData.slots.includes(booking.time)) {
        setError('Lo slot selezionato non è più disponibile. Torna indietro e seleziona un altro orario.')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore nella prenotazione')
      }

      setStep(4) // Success step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella prenotazione')
    } finally {
      setSubmitting(false)
    }
  }

  const canGoNext = () => {
    if (step === 1) return booking.serviceIds.length > 0
    if (step === 2) return booking.date && booking.time
    return true
  }

  const goNext = () => {
    if (step === 3) {
      handleSubmit()
    } else {
      setStep(prev => prev + 1)
    }
  }

  // ==================== HELPERS ====================

  function formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  function formatDisplayDate(dateStr: string): string {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  // ==================== RENDER ====================

  const stepLabels = [
    { num: 1, label: 'Servizi', icon: <Calendar className="w-4 h-4" /> },
    { num: 2, label: 'Data', icon: <Clock className="w-4 h-4" /> },
    { num: 3, label: 'Dati', icon: <User className="w-4 h-4" /> },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => step > 1 && step < 4 ? setStep(prev => prev - 1) : router.push('/')}
            className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <h1 className="font-semibold text-stone-900">Prenota</h1>
        </div>

        {/* Steps indicator */}
        {step < 4 && (
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2">
            {stepLabels.map(s => (
              <div key={s.num} className="flex-1 flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    step >= s.num
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {s.num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    step >= s.num ? 'text-stone-900' : 'text-stone-400'
                  }`}
                >
                  {s.label}
                </span>
                {s.num < 3 && (
                  <div className={`flex-1 h-0.5 ${step > s.num ? 'bg-stone-900' : 'bg-stone-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && StepServices()}
            {step === 2 && StepCalendar()}
            {step === 3 && StepCustomerInfo()}
            {step === 4 && StepConfirmation()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer with Next button */}
      {step > 0 && step < 4 && (
        <footer className="sticky bottom-0 bg-white/80 backdrop-blur-lg border-t border-stone-200 p-4">
          <div className="max-w-lg mx-auto">
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {/* Selected services badge (step 2+) */}
            {step >= 2 && booking.serviceIds.length > 0 && (
              <div className="mb-3 text-xs text-stone-500 text-center">
                {booking.serviceIds.length} servizio{booking.serviceIds.length > 1 ? 'i' : ''} · {formatDuration(totalDuration)} · €{totalPrice.toFixed(2)}
              </div>
            )}

            <button
              onClick={goNext}
              disabled={!canGoNext() || submitting}
              className="w-full py-4 rounded-xl bg-stone-900 text-white font-medium text-base flex items-center justify-center gap-2 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  Prenotazione in corso...
                </>
              ) : step === 3 ? (
                'Finalizza Prenotazione'
              ) : (
                <>
                  Continua
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
