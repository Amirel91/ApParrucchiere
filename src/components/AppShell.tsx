'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { LoginPage } from './LoginPage'
import { ClientNav } from './ClientNav'
import { AdminNav } from './AdminNav'
import { ServiceCard } from './ServiceCard'
import { BookingFlow } from './BookingFlow'
import { ClientAppointments } from './ClientAppointments'
import { AdminDashboard } from './AdminDashboard'
import { AdminServices } from './AdminServices'
import { AdminCalendar } from './AdminCalendar'
import { useState, useEffect } from 'react'
import type { Service, Appointment } from '@/lib/store'

// Client Home
function ClientHome() {
  const currentUser = useAppStore((s) => s.currentUser)
  const navigate = useAppStore((s) => s.navigate)
  const selectService = useAppStore((s) => s.selectService)
  const setBookingStep = useAppStore((s) => s.setBookingStep)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => setServices(data))
      .finally(() => setLoading(false))
  }, [])

  const handleServiceClick = (service: Service) => {
    selectService(service)
    setBookingStep(1)
    navigate('client-booking')
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between p-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold">
              Ciao, {currentUser?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-muted-foreground">Prenota il tuo taglio</p>
          </div>
          <ClientNav />
        </div>
      </div>

      {/* Services */}
      <div className="p-4 sm:p-6 space-y-3">
        <h2 className="text-lg font-semibold">I Nostri Servizi</h2>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onClick={handleServiceClick}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Client Appointments wrapper
function ClientAppointmentsPage() {
  const currentUser = useAppStore((s) => s.currentUser)

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between p-4 sm:px-6">
          <h1 className="text-xl font-bold">I Miei Appuntamenti</h1>
          <ClientNav />
        </div>
      </div>
      {currentUser && <ClientAppointments userId={currentUser.id} />}
    </div>
  )
}

// Admin Calendar wrapper
function AdminCalendarPage() {
  const navigate = useAppStore((s) => s.navigate)
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    fetch('/api/appointments')
      .then((res) => res.json())
      .then((data) => setAppointments(data))
  }, [])

  const handleCancel = async (id: string) => {
    await fetch(`/api/appointments/${id}/cancel`, { method: 'PUT' })
    const res = await fetch('/api/appointments')
    const data = await res.json()
    setAppointments(data)
  }

  const handleComplete = async (id: string) => {
    await fetch(`/api/appointments/${id}/confirm`, { method: 'PUT' })
    const res = await fetch('/api/appointments')
    const data = await res.json()
    setAppointments(data)
  }

  return (
    <div className="pb-6">
      <AdminCalendar
        appointments={appointments}
        onCancel={handleCancel}
        onComplete={handleComplete}
      />
    </div>
  )
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export function AppShell() {
  const currentView = useAppStore((s) => s.currentView)
  const currentUser = useAppStore((s) => s.currentUser)

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AnimatePresence mode="wait">
        {currentView === 'login' && (
          <motion.div
            key="login"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <LoginPage />
          </motion.div>
        )}

        {/* Client Views */}
        {(currentView === 'client-home' || currentView === 'client-appointments') && (
          <motion.div
            key={currentView}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            {currentView === 'client-home' && <ClientHome />}
            {currentView === 'client-appointments' && <ClientAppointmentsPage />}
          </motion.div>
        )}

        {currentView === 'client-booking' && (
          <motion.div
            key="client-booking"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="pb-6 pt-2"
          >
            <BookingFlow />
          </motion.div>
        )}

        {/* Admin Views */}
        {(currentView === 'admin-dashboard' ||
          currentView === 'admin-services' ||
          currentView === 'admin-calendar') && (
          <div className="min-h-screen bg-gray-50/50">
            <AdminNav />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                {currentView === 'admin-dashboard' && (
                  <AdminDashboard currentUser={currentUser} />
                )}
                {currentView === 'admin-services' && <AdminServices />}
                {currentView === 'admin-calendar' && <AdminCalendarPage />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
