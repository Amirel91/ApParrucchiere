'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  CalendarCheck, Euro, Users, Clock, Plus, UserPlus,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

interface TodayAppointment {
  id: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  client: { id: string; firstName: string; lastName: string; phone: string | null }
  service: { id: string; name: string; durationMinutes: number; price: number }
  staff: { id: string; name: string; color: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-slate-100 text-slate-700',
  NO_SHOW: 'bg-gray-100 text-gray-700',
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confermato',
  PENDING: 'In attesa',
  CANCELLED: 'Annullato',
  COMPLETED: 'Completato',
  NO_SHOW: 'Non presentato',
}

export default function DashboardView() {
  const { session, navigate } = useAppStore()
  const [appointments, setAppointments] = useState<TodayAppointment[]>([])
  const [stats, setStats] = useState({
    todayCount: 0,
    todayRevenue: 0,
    totalClients: 0,
    nextAppointment: null as string | null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = session?.token
      if (!token) return

      const today = format(new Date(), 'yyyy-MM-dd')

      const [aptsRes, clientsRes] = await Promise.all([
        fetch(`/api/appointments?date=${today}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/clients', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const apts = await aptsRes.json()
      const clients = await clientsRes.json()

      const activeApts = Array.isArray(apts) ? apts.filter((a: TodayAppointment) => a.status !== 'CANCELLED') : []

      const revenue = activeApts.reduce((sum: number, a: TodayAppointment) => sum + a.service.price, 0)

      const nextApt = activeApts
        .filter((a: TodayAppointment) => new Date(a.startTime) > new Date())
        .sort((a: TodayAppointment, b: TodayAppointment) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]

      setStats({
        todayCount: activeApts.length,
        todayRevenue: revenue,
        totalClients: Array.isArray(clients) ? clients.length : 0,
        nextAppointment: nextApt ? format(new Date(nextApt.startTime), 'HH:mm') : null,
      })
      setAppointments(Array.isArray(apts) ? apts : [])
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const firstName = session?.account?.name?.split(' ')[0] || 'Utente'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera'

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: it })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.todayCount}</p>
                  <p className="text-xs text-muted-foreground">Appuntamenti oggi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Euro className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">€{stats.todayRevenue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Entrate oggi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                  <p className="text-xs text-muted-foreground">Clienti totali</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.nextAppointment || '—'}</p>
                  <p className="text-xs text-muted-foreground">Prossimo app.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button
          className="gap-2 min-h-[44px] rounded-xl"
          onClick={() => navigate('calendar')}
        >
          <Plus className="w-4 h-4" />
          Nuovo Appuntamento
        </Button>
        <Button
          variant="outline"
          className="gap-2 min-h-[44px] rounded-xl"
          onClick={() => navigate('clients')}
        >
          <UserPlus className="w-4 h-4" />
          Nuovo Cliente
        </Button>
      </div>

      {/* Today's Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Appuntamenti di oggi</h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 min-h-[44px] text-primary"
            onClick={() => navigate('calendar')}
          >
            Vedi tutto <ChevronRight className="w-3 h-3" />
          </Button>
        </div>

        {appointments.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Nessun appuntamento oggi</p>
              <p className="text-sm text-muted-foreground mt-1">
                Il tuo calendario è libero
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-bold">
                        {format(new Date(apt.startTime), 'HH:mm')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.endTime), 'HH:mm')}
                      </p>
                    </div>

                    <div className="w-1 h-10 rounded-full" style={{ backgroundColor: apt.staff?.color || '#d97706' }} />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {apt.client.firstName} {apt.client.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {apt.service.name} • €{apt.service.price.toFixed(0)} • {apt.service.durationMinutes} min
                        {apt.staff && ` • ${apt.staff.name}`}
                      </p>
                    </div>

                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 ${STATUS_COLORS[apt.status] || ''}`}
                    >
                      {STATUS_LABELS[apt.status] || apt.status}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
