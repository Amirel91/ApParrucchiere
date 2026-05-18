'use client'

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Sparkles,
  Users,
  UserCheck,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAppStore, type AppView } from '@/lib/store'
import { getActivityType } from '@/lib/activity-types'

const NAV_ITEMS: { view: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'services', label: 'Servizi', icon: Sparkles },
  { view: 'staff', label: 'Staff', icon: Users },
  { view: 'clients', label: 'Clienti', icon: UserCheck },
  { view: 'calendar', label: 'Calendario', icon: CalendarDays },
  { view: 'settings', label: 'Impostazioni', icon: Settings },
]

function SidebarContent() {
  const { session, currentView, navigate, logout } = useAppStore()

  const activityType = session?.business?.activityType
    ? getActivityType(session.business.activityType)
    : null
  const ActivityIcon = activityType?.icon || Sparkles

  const initials = session?.account?.name
    ? session.account.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <div className="flex flex-col h-full">
      {/* Business header */}
      <div className="p-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 shrink-0">
          <ActivityIcon className="w-5 h-5 text-amber-700" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm truncate">
            {session?.business?.name || 'La mia attività'}
          </h2>
          {activityType && (
            <p className="text-xs text-muted-foreground">{activityType.name}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.view
          const Icon = item.icon
          return (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <Separator />

      {/* User + Logout */}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-amber-100 text-amber-800 text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {session?.account?.name || 'Utente'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session?.account?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors min-h-[44px]"
        >
          <LogOut className="w-5 h-5" />
          Esci
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-card border-r h-screen sticky top-0">
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="p-0 w-72">
        <SheetTitle className="sr-only">Menu di navigazione</SheetTitle>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}

export function MobileTopBar() {
  const { setSidebarOpen, session } = useAppStore()

  const activityType = session?.business?.activityType
    ? getActivityType(session.business.activityType)
    : null
  const ActivityIcon = activityType?.icon || Sparkles

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b">
      <div className="flex items-center gap-3 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="min-w-[44px] min-h-[44px]"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-amber-700" />
          <span className="font-semibold text-sm truncate">
            {session?.business?.name || 'La mia attività'}
          </span>
        </div>
      </div>
    </header>
  )
}
