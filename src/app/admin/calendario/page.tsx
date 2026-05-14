'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  Clock,
  Euro,
  User,
} from 'lucide-react'

interface BookingWithServices {
  id: string
  customerName: string
  customerSurname: string
  customerPhone: string
  customerEmail?: string
  startTime: string
  endTime: string
  totalPrice: number
  status: string
  services: { service: { name: string; price: number; durationMinutes: number } }[]
}

export default function AdminCalendario() {
  const [bookings, setBookings] = useState<BookingWithServices[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithServices | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month')

  useEffect(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`

    fetch(`/api/bookings?from=${from}T00:00:00&to=${to}T23:59:59`)
      .then(res => res.json())
      .then(data => {
        setBookings(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentMonth])

  const bookingsByDate = (dateStr: string) =>
    bookings.filter(b => {
      const d = new Date(b.startTime)
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return ds === dateStr
    })

  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
  const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

  const calendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startOffset = firstDay === 0 ? 6 : firstDay - 1

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days: { date: number; dateStr: string; isPast: boolean; isToday: boolean }[] = []

    for (let i = 0; i < startOffset; i++) {
      days.push({ date: 0, dateStr: '', isPast: true, isToday: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dateObj = new Date(year, month, d)
      days.push({ date: d, dateStr, isPast: dateObj < today, isToday: dateObj.getTime() === today.getTime() })
    }
    return days
  }

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  const dayBookings = selectedDate ? bookingsByDate(selectedDate) : []

  const updateBookingStatus = async (id: string, status: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    if (selectedBooking?.id === id) setSelectedBooking(prev => prev ? { ...prev, status } : null)
  }

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    confirmed: 'Confermata',
    pending: 'In attesa',
    cancelled: 'Annullata',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Calendario</h1>
          <p className="text-stone-500 text-sm mt-1">Visualizza e gestisci le prenotazioni</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-stone-200 p-1">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'month' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Mese
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-stone-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {dayNames.map(d => (
                <div key={d} className="text-center text-xs font-medium text-stone-400 py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays().map((day, i) => {
                const dayBookings = day.dateStr ? bookingsByDate(day.dateStr) : []
                return (
                  <button
                    key={i}
                    disabled={day.date === 0}
                    onClick={() => day.dateStr && setSelectedDate(day.dateStr)}
                    className={`min-h-[70px] rounded-lg p-1.5 text-left transition-all text-xs ${
                      day.date === 0 ? '' :
                      selectedDate === day.dateStr
                        ? 'bg-stone-900 text-white'
                        : day.isToday
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-stone-50 hover:bg-stone-100'
                    } ${day.date > 0 && !day.isPast ? 'cursor-pointer' : ''}`}
                  >
                    {day.date > 0 && (
                      <>
                        <div className={`font-medium mb-1 ${selectedDate === day.dateStr ? 'text-white' : 'text-stone-700'}`}>
                          {day.date}
                        </div>
                        {dayBookings.length > 0 && (
                          <div className={`text-[10px] leading-tight ${selectedDate === day.dateStr ? 'text-stone-300' : 'text-stone-500'}`}>
                            {dayBookings.slice(0, 2).map(b => (
                              <div key={b.id} className="truncate">
                                {formatTime(b.startTime)} {b.customerName}
                              </div>
                            ))}
                            {dayBookings.length > 2 && (
                              <div>+{dayBookings.length - 2} altro{dayBookings.length > 3 ? 'i' : ''}</div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Day Detail Panel */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h3 className="font-semibold text-stone-900 mb-4">
              {selectedDate ? formatDate(selectedDate) : 'Seleziona un giorno'}
            </h3>

            {dayBookings.length === 0 ? (
              <p className="text-stone-400 text-sm py-8 text-center">
                {selectedDate ? 'Nessuna prenotazione per questo giorno' : 'Clicca su un giorno del calendario'}
              </p>
            ) : (
              <div className="space-y-3">
                {dayBookings
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map(booking => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-stone-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-stone-900 text-sm">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status] || ''}`}>
                          {statusLabels[booking.status] || booking.status}
                        </span>
                      </div>
                      <div className="text-sm text-stone-600">
                        {booking.customerName} {booking.customerSurname}
                      </div>
                      <div className="text-xs text-stone-400 mt-1">
                        {booking.services.map(bs => bs.service.name).join(', ')} · €{booking.totalPrice.toFixed(2)}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 uppercase">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 uppercase">Ora</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 uppercase">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 uppercase">Servizi</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 uppercase">Totale</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 uppercase">Stato</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-stone-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-stone-400 text-sm">
                      Nessuna prenotazione questo mese
                    </td>
                  </tr>
                ) : (
                  bookings
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .map(booking => (
                      <tr key={booking.id} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="px-4 py-3 text-sm">{formatDate(new Date(booking.startTime).toISOString().split('T')[0])}</td>
                        <td className="px-4 py-3 text-sm">{formatTime(booking.startTime)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{booking.customerName} {booking.customerSurname}</td>
                        <td className="px-4 py-3 text-sm text-stone-500">{booking.services.map(bs => bs.service.name).join(', ')}</td>
                        <td className="px-4 py-3 text-sm font-medium">€{booking.totalPrice.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[booking.status] || ''}`}>
                            {statusLabels[booking.status] || booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {booking.status !== 'cancelled' && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                className="text-xs px-2 py-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Annulla
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-stone-900">Dettaglio Prenotazione</h2>
                <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-lg hover:bg-stone-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[selectedBooking.status] || ''}`}>
                    {statusLabels[selectedBooking.status] || selectedBooking.status}
                  </span>
                  {selectedBooking.status !== 'cancelled' && (
                    <button
                      onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                      className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors"
                    >
                      Annulla Prenotazione
                    </button>
                  )}
                </div>

                {/* Time */}
                <div className="flex items-center gap-3 text-stone-700">
                  <Clock className="w-5 h-5 text-stone-400" />
                  <div>
                    <div className="font-medium">
                      {formatDate(new Date(selectedBooking.startTime).toISOString().split('T')[0])}
                    </div>
                    <div className="text-sm text-stone-500">
                      {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
                    </div>
                  </div>
                </div>

                {/* Customer */}
                <div className="flex items-center gap-3 text-stone-700">
                  <User className="w-5 h-5 text-stone-400" />
                  <div>
                    <div className="font-medium">
                      {selectedBooking.customerName} {selectedBooking.customerSurname}
                    </div>
                    <div className="flex gap-4 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {selectedBooking.customerPhone}
                      </span>
                      {selectedBooking.customerEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {selectedBooking.customerEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <div className="text-sm font-medium text-stone-700 mb-2">Servizi</div>
                  <div className="space-y-2">
                    {selectedBooking.services.map(bs => (
                      <div key={bs.service.name} className="flex justify-between text-sm p-2 rounded-lg bg-stone-50">
                        <span className="text-stone-700">{bs.service.name}</span>
                        <span className="text-stone-500">€{bs.service.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                  <div className="flex items-center gap-2 font-semibold text-stone-900">
                    <Euro className="w-5 h-5" />
                    Totale
                  </div>
                  <span className="text-xl font-bold text-stone-900">
                    €{selectedBooking.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
