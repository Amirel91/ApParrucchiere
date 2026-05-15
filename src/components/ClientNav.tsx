'use client'

import { Home, CalendarDays, LogOut } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function ClientNav() {
  const currentView = useAppStore((s) => s.currentView)
  const navigate = useAppStore((s) => s.navigate)
  const logout = useAppStore((s) => s.logout)
  const currentUser = useAppStore((s) => s.currentUser)

  const navItems = [
    { id: 'client-home' as const, label: 'Servizi', icon: Home },
    { id: 'client-appointments' as const, label: 'Appuntamenti', icon: CalendarDays },
  ]

  return (
    <>
      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-4 py-2 min-w-[64px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn('text-[11px]', isActive && 'font-medium')}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Logout in header - returns the element for the parent to use */}
      <button
        onClick={logout}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Esci"
      >
        <span className="hidden sm:inline">
          {currentUser?.name}
        </span>
        <LogOut className="h-4 w-4" />
      </button>
    </>
  )
}
