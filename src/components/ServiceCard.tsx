'use client'

import { motion } from 'framer-motion'
import { Clock, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import type { Service } from '@/lib/store'

interface ServiceCardProps {
  service: Service
  onClick: (service: Service) => void
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className="rounded-2xl p-5 cursor-pointer border-0 shadow-sm shadow-black/5 hover:shadow-md transition-shadow duration-200 bg-white"
        onClick={() => onClick(service)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{service.name}</h3>
            {service.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {service.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {service.durationMinutes} min
              </span>
              <span className="font-semibold text-base">
                {formatPrice(service.price)}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        </div>
      </Card>
    </motion.div>
  )
}
