'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarDays, Sparkles, Phone, Mail, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'

interface BusinessConfig {
  id: string
  shopName: string
  shopDescription: string
  shopPhone?: string
  shopEmail?: string
  shopAddress?: string
  selectedImages?: string
  businessType?: string
}

export default function HomePage() {
  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const images: string[] = (() => {
    try {
      return config?.selectedImages ? JSON.parse(config.selectedImages) : []
    } catch { return [] }
  })()

  useEffect(() => {
    const fetchConfig = () => {
      fetch('/api/config')
        .then(res => res.json())
        .then(data => { if (data && typeof data === 'object') setConfig(data) })
        .catch(console.error)
    }
    fetchConfig()
    const interval = setInterval(fetchConfig, 30000)
    return () => clearInterval(interval)
  }, [])

  // Auto-slide gallery
  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-white">
      <main className="flex-1 flex flex-col items-center px-6 py-16">

        {/* Image Gallery */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-lg mb-10"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-lg shadow-stone-900/10 aspect-[16/9]">
              {images.map((src, i) => (
                <div
                  key={src}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}

              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={() => setCurrentSlide(prev => (prev - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-sm">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentSlide(prev => (prev + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-sm">
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-5' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: images.length > 0 ? 0.2 : 0 }}
          className="text-center max-w-md w-full"
        >
          {!images.length > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-700 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
          )}

          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 mb-3">
            {config?.shopName || 'Caricamento...'}
          </h1>

          {config?.shopDescription && (
            <p className="text-stone-500 text-base leading-relaxed mb-8">{config.shopDescription}</p>
          )}

          {/* Contact Info */}
          {(config?.shopPhone || config?.shopEmail || config?.shopAddress) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-8 space-y-2">
              {config?.shopPhone && (<a href={`tel:${config.shopPhone}`} className="flex items-center justify-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"><Phone className="w-4 h-4" />{config.shopPhone}</a>)}
              {config?.shopEmail && (<a href={`mailto:${config.shopEmail}`} className="flex items-center justify-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"><Mail className="w-4 h-4" />{config.shopEmail}</a>)}
              {config?.shopAddress && (<div className="flex items-center justify-center gap-2 text-sm text-stone-500"><MapPin className="w-4 h-4 shrink-0" />{config.shopAddress}</div>)}
            </motion.div>
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

      <footer className="text-center pb-6">
        <Link href="/admin/login" className="text-xs text-stone-300 hover:text-stone-500 transition-colors">Area Admin</Link>
      </footer>
    </div>
  )
}
