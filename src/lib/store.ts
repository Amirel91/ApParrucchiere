import { create } from 'zustand'

export type AppView =
  | 'landing'
  | 'onboarding'
  | 'login'
  | 'dashboard'
  | 'services'
  | 'staff'
  | 'clients'
  | 'calendar'
  | 'settings'

export interface Session {
  token: string
  account: {
    id: string
    email: string
    name: string
    phone?: string
  }
  business: {
    id: string
    name: string
    slug: string
    activityType: string
    description?: string
    address?: string
    city?: string
    phone?: string
  }
}

interface AppState {
  // Navigation
  currentView: AppView
  previousView: AppView | null
  history: AppView[]

  // Auth
  session: Session | null
  isHydrated: boolean

  // Onboarding
  selectedActivityType: string | null

  // UI
  sidebarOpen: boolean

  // Actions
  navigate: (view: AppView) => void
  goBack: () => void
  setSession: (session: Session | null) => void
  setSelectedActivityType: (type: string | null) => void
  setSidebarOpen: (open: boolean) => void
  hydrate: () => void
  logout: () => void
}

const TOKEN_KEY = 'gestionale_token'

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'landing',
  previousView: null,
  history: [],
  session: null,
  isHydrated: false,
  selectedActivityType: null,
  sidebarOpen: false,

  hydrate: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
    if (token) {
      // Validate session with API
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error('Invalid session')
        })
        .then((data) => {
          set({
            session: { token, ...data },
            currentView: 'dashboard',
            isHydrated: true,
          })
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY)
          set({ session: null, currentView: 'landing', isHydrated: true })
        })
    } else {
      set({ isHydrated: true })
    }
  },

  navigate: (view) => {
    const { currentView, history } = get()
    set({
      previousView: currentView,
      currentView: view,
      history: [...history.slice(-19), currentView],
      sidebarOpen: false,
    })
  },

  goBack: () => {
    const { history, currentView } = get()
    if (history.length > 0) {
      const prev = history[history.length - 1]
      set({
        currentView: prev,
        history: history.slice(0, -1),
        previousView: currentView,
        sidebarOpen: false,
      })
    }
  },

  setSession: (session) => {
    if (session) {
      localStorage.setItem(TOKEN_KEY, session.token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    set({ session })
  },

  setSelectedActivityType: (type) => set({ selectedActivityType: type }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  logout: () => {
    const token = get().session?.token
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    localStorage.removeItem(TOKEN_KEY)
    set({ session: null, currentView: 'landing', history: [], sidebarOpen: false })
  },
}))
