'use client'

import { motion } from 'framer-motion'
import { FileX2 } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="mb-4 text-muted-foreground">
        {icon || <FileX2 className="h-12 w-12" strokeWidth={1.5} />}
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-[280px]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}
