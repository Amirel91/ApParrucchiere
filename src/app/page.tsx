'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import AppShell from '@/components/AppShell'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const hydrate = useAppStore((s) => s.hydrate)
  const isHydrated = useAppStore((s) => s.isHydrated)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  return <AppShell />
}
