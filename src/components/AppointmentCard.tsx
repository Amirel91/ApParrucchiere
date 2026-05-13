'use client'

import { Clock, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate, formatTime } from '@/lib/utils'
import type { Appointment } from '@/lib/store'

interface AppointmentCardProps {
  appointment: Appointment
  showClientInfo?: boolean
  showActions?: boolean
  onCancel?: (id: string) => void
  onComplete?: (id: string) => void
  isAdmin?: boolean
}

const statusConfig: Record<string, { label: string; className: string }> = {
  CONFIRMED: {
    label: 'Confermato',
    className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  },
  PENDING: {
    label: 'In attesa',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  },
  CANCELLED: {
    label: 'Annullato',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  },
  COMPLETED: {
    label: 'Completato',
    className: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
  },
}

export function AppointmentCard({
  appointment,
  showClientInfo = false,
  showActions = false,
  onCancel,
  onComplete,
  isAdmin = false,
}: AppointmentCardProps) {
  const config = statusConfig[appointment.status] || statusConfig.CONFIRMED

  return (
    <Card className="rounded-2xl border-0 shadow-sm shadow-black/5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm sm:text-base truncate">
              {appointment.service?.name || 'Servizio'}
            </h3>
            <Badge variant="secondary" className={config.className}>
              {config.label}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(appointment.startTime)} alle {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            </p>

            {showClientInfo && appointment.clientName && (
              <p className="font-medium text-foreground">
                {appointment.clientName}
              </p>
            )}

            {isAdmin && appointment.clientPhone && (
              <p>{appointment.clientPhone}</p>
            )}

            {appointment.service && (
              <p className="font-medium text-foreground">
                {formatPrice(appointment.service.price)}
              </p>
            )}
          </div>
        </div>

        {showActions && (appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
          <div className="flex flex-col gap-1">
            {isAdmin && appointment.status === 'CONFIRMED' && onComplete && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs rounded-lg"
                onClick={() => onComplete(appointment.id)}
              >
                ✓ Completa
              </Button>
            )}
            {onCancel && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-destructive hover:text-destructive rounded-lg"
                onClick={() => onCancel(appointment.id)}
              >
                <X className="h-3 w-3 mr-1" />
                Annulla
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
