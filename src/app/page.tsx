'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarDays, Sparkles } from 'lucide-react'

interface BusinessConfig {
  id: string
  shopName: string
  shopDescription: string
  shopPhone?: string
  shopEmail?: string
  shopAddress?: string
}

export default function HomePage() {
  const [config, setConfig] = useState<BusinessConfig | null>(null)

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(console.error)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-white">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center max-w-md w-full"
        >
          {/* Logo / Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-700 flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          {/* Shop Name */}
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 mb-3">
            {config?.shopName || 'Caricamento...'}
          </h1>

          {/* Shop Description */}
          {config?.shopDescription && (
            <p className="text-stone-500 text-base leading-relaxed mb-10">
              {config.shopDescription}
            </p>
          )}

          {/* CTA Button */}
          <Link href="/prenota">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-3 w-full max-w-xs mx-auto px-8 py-5 rounded-2xl bg-stone-900 text-white text-lg font-medium shadow-lg shadow-stone-900/20 hover:shadow-xl hover:shadow-stone-900/30 transition-shadow cursor-pointer"
            >
              <CalendarDays className="w-6 h-6" />
              Prenota un appuntamento
            </motion.div>
          </Link>
        </motion.div>
      </main>

      {/* Admin Link */}
      <footer className="text-center pb-6">
        <Link
          href="/admin/login"
          className="text-xs text-stone-300 hover:text-stone-500 transition-colors"
        >
          Area Admin
        </Link>
      </footer>
    </div>
  )
}
