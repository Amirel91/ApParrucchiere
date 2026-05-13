import { create } from 'zustand'

export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'ADMIN' | 'CLIENT'
  password: string
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number
  bufferMinutes: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  clientId: string
  serviceId: string
  startTime: string
  endTime: string
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED'
  clientName: string
  clientPhone: string | null
  clientEmail: string | null
  reminderSent: boolean
  createdAt: string
  updatedAt: string
  service?: Service
}

export type ViewType =
  | 'login'
  | 'client-home'
  | 'client-booking'
  | 'client-appointments'
  | 'admin-dashboard'
  | 'admin-services'
  | 'admin-calendar'

interface AppState {
  currentUser: User | null
  currentView: ViewType
  selectedService: Service | null
  selectedDate: Date | null
  selectedTime: string | null
  bookingStep: number
  // actions
  login: (user: User) => void
  logout: () => void
  navigate: (view: ViewType) => void
  selectService: (service: Service | null) => void
  selectDate: (date: Date | null) => void
  selectTime: (time: string | null) => void
  setBookingStep: (step: number) => void
  resetBooking: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  currentView: 'login',
  selectedService: null,
  selectedDate: null,
  selectedTime: null,
  bookingStep: 1,

  login: (user) =>
    set({
      currentUser: user,
      currentView: user.role === 'ADMIN' ? 'admin-dashboard' : 'client-home',
    }),

  logout: () =>
    set({
      currentUser: null,
      currentView: 'login',
      selectedService: null,
      selectedDate: null,
      selectedTime: null,
      bookingStep: 1,
    }),

  navigate: (view) => set({ currentView: view }),

  selectService: (service) => set({ selectedService: service }),

  selectDate: (date) => set({ selectedDate: date }),

  selectTime: (time) => set({ selectedTime: time }),

  setBookingStep: (step) => set({ bookingStep: step }),

  resetBooking: () =>
    set({
      selectedService: null,
      selectedDate: null,
      selectedTime: null,
      bookingStep: 1,
    }),
}))
