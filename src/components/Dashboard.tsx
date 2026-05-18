'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  Calendar,
  Users,
  Sparkles,
  Euro,
  Plus,
  UserPlus,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { formatPrice, formatTime } from '@/lib/utils'

interface DashboardStats {
  todayAppointments: number
  totalClients: number
  activeServices: number
  todayRevenue: number
}

interface Appointment {
  id: string
  startTime: string
  clientName: string
  serviceName: string
  staffName?: string
  status: string
}

export default function Dashboard() {
  const { session, navigate } = useAppStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const token = session?.token
      if (!token) return

      try {
        const [statsRes, apptsRes] = await Promise.all([
          fetch('/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/dashboard/appointments/today', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (statsRes.ok) setStats(await statsRes.json())
        if (apptsRes.ok) setAppointments(await apptsRes.json())
      } catch {
        // Silently handle — use defaults
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [session?.token])

  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: it })
  const greeting = getGreeting()
  const firstName = session?.account?.name?.split(' ')[0] || 'Utente'

  const statCards = [
    {
      label: 'Appuntamenti Oggi',
      value: stats?.todayAppointments ?? 0,
      icon: Calendar,
      color: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Clienti Totali',
      value: stats?.totalClients ?? 0,
      icon: Users,
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Servizi Attivi',
      value: stats?.activeServices ?? 0,
      icon: Sparkles,
      color: 'bg-rose-100 text-rose-700',
    },
    {
      label: 'Entrate Oggi',
      value: stats?.todayRevenue ?? 0,
      icon: Euro,
      color: 'bg-orange-100 text-orange-700',
      isPrice: true,
    },
  ]

  const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    confirmed: 'default',
    pending: 'secondary',
    cancelled: 'destructive',
    completed: 'outline',
  }

  const statusLabel: Record<string, string> = {
    confirmed: 'Confermato',
    pending: 'In attesa',
    cancelled: 'Annullato',
    completed: 'Completato',
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1 capitalize">{today}</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <Card className="py-4">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-xl ${stat.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  {loading ? (
                    <Skeleton className="h-7 w-16 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {stat.isPrice
                        ? formatPrice(stat.value as number)
                        : stat.value}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Appointments + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's appointments */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Appuntamenti di Oggi
                </CardTitle>
                <CardDescription>
                  {loading
                    ? 'Caricamento...'
                    : `${appointments.length} appuntamento${
                        appointments.length !== 1 ? 'i' : ''
                      } programmat${appointments.length !== 1 ? 'i' : 'o'}`}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-14 h-10 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="w-20 h-6 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nessun appuntamento per oggi
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Il tempo libero può essere utilizzato per altre attività
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center w-14 h-12 rounded-lg bg-amber-50 text-amber-700 shrink-0">
                        <span className="text-xs font-medium">
                          {formatTime(apt.startTime)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {apt.clientName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {apt.serviceName}
                          {apt.staffName && ` • ${apt.staffName}`}
                        </p>
                      </div>
                      <Badge
                        variant={statusVariant[apt.status] || 'secondary'}
                        className="shrink-0 text-xs"
                      >
                        {statusLabel[apt.status] || apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                Azioni Rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start gap-3 min-h-[44px] bg-amber-600 hover:bg-amber-700"
                onClick={() => navigate('calendar')}
              >
                <Plus className="w-5 h-5" />
                Nuovo Appuntamento
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 min-h-[44px]"
                onClick={() => navigate('clients')}
              >
                <UserPlus className="w-5 h-5" />
                Nuovo Cliente
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buongiorno'
  if (hour < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}
