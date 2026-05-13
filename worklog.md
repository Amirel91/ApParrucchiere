# BarberShop - Work Log

## Project Overview
Complete barber/hairdresser booking application built with Next.js 16, Prisma (SQLite), Tailwind CSS 4, shadcn/ui, and Zustand. Features client-side routing via Zustand state management with full Italian UI.

## Implementation Steps

### 1. Database Schema (Prisma)
- Defined 4 models: `User`, `Service`, `BusinessHours`, `Appointment`
- User model supports ADMIN and CLIENT roles
- Service model with duration, price, buffer time, and active toggle
- BusinessHours for weekly schedule management
- Appointment model linking users and services with status tracking

### 2. Seed Data
- Created `prisma/seed.ts` with:
  - 1 Admin user: Mario Rossi (admin@barber.it)
  - 2 Client users: Luca Bianchi, Anna Verdi
  - 5 Services: Taglio Capelli, Barba, Taglio + Barba, Shampoo + Taglio, Colore
  - Business hours: Mon-Fri 9:00-18:00, Sat 9:00-13:00, Sun closed
  - 2 Sample appointments for testing

### 3. API Routes (10 endpoints)
- `POST /api/auth/login` - Authentication
- `GET/POST /api/services` - Service listing and creation
- `PUT/DELETE /api/services/[id]` - Service update and soft delete
- `GET /api/slots` - Available time slot calculation with conflict detection
- `GET/POST /api/appointments` - Appointment listing and creation
- `PUT /api/appointments/[id]/confirm` - Mark appointment as completed
- `PUT /api/appointments/[id]/cancel` - Cancel appointment
- `GET/PUT /api/business-hours` - Business hours management

### 4. Slot Calculation Logic
- 15-minute increment slots from open to close
- Conflict detection considering service duration + buffer
- Today's slots start from current time + 30 minutes buffer
- Respects business hours (closed days return empty)

### 5. Frontend Components (13 components)
- `AppShell.tsx` - Main wrapper with AnimatePresence transitions
- `LoginPage.tsx` - Quick login buttons + manual form
- `ClientNav.tsx` - Bottom navigation for clients
- `AdminNav.tsx` - Top tab navigation for admins
- `ServiceCard.tsx` - Service display with price, duration
- `BookingFlow.tsx` - 4-step booking wizard with stepper
- `DatePicker.tsx` - Next 14 days grid selector
- `TimeSlotPicker.tsx` - Pill-shaped time slot buttons
- `AppointmentCard.tsx` - Appointment display with status badges
- `StatsCard.tsx` - Dashboard statistic card
- `ServiceForm.tsx` - Dialog form for service CRUD
- `AdminCalendar.tsx` - Monthly calendar with day detail view
- `EmptyState.tsx` - Reusable empty state component

### 6. State Management (Zustand)
- Single store managing: current user, view navigation, booking state
- Actions: login, logout, navigate, selectService, selectDate, selectTime, resetBooking

### 7. UI Design
- Apple minimal style with clean white backgrounds
- Framer Motion animations for page transitions
- Italian locale throughout (date-fns with `it` locale)
- Responsive mobile-first design
- Status badges with semantic colors (green, amber, red, gray)

## Files Created/Modified
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Seed data script
- `src/lib/store.ts` - Zustand store
- `src/lib/utils.ts` - Utility functions (date formatting, price formatting)
- `src/app/page.tsx` - Entry point
- `src/app/layout.tsx` - Updated metadata for Italian barber app
- `src/app/api/auth/login/route.ts`
- `src/app/api/services/route.ts`
- `src/app/api/services/[id]/route.ts`
- `src/app/api/slots/route.ts`
- `src/app/api/appointments/route.ts`
- `src/app/api/appointments/[id]/confirm/route.ts`
- `src/app/api/appointments/[id]/cancel/route.ts`
- `src/app/api/business-hours/route.ts`
- `src/components/AppShell.tsx`
- `src/components/LoginPage.tsx`
- `src/components/ClientNav.tsx`
- `src/components/AdminNav.tsx`
- `src/components/ServiceCard.tsx`
- `src/components/BookingFlow.tsx`
- `src/components/DatePicker.tsx`
- `src/components/TimeSlotPicker.tsx`
- `src/components/AppointmentCard.tsx`
- `src/components/StatsCard.tsx`
- `src/components/ServiceForm.tsx`
- `src/components/AdminCalendar.tsx`
- `src/components/AdminDashboard.tsx`
- `src/components/AdminServices.tsx`
- `src/components/ClientAppointments.tsx`
- `src/components/EmptyState.tsx`

## Validation
- ESLint: 0 errors, 0 warnings
- Dev server: Compiling successfully, pages rendering
- Database: Schema pushed and seeded
---
Task ID: 1
Agent: Main Agent
Task: Fix slot availability bug - slots not becoming unavailable when already booked

Work Log:
- Read /api/slots/route.ts, BookingFlow.tsx, /api/appointments/route.ts
- Diagnosed root cause: timezone offset sign was inverted in slot calculation
- Line 24: `Date.UTC(...) - tzOffset` should be `Date.UTC(...) + tzOffset`
- Line 81: Same issue with nowClientMidnight calculation
- Line 32: dayOfWeek was using wrong UTC timestamp (could show wrong day)
- Fixed all three issues
- Updated .env with new Neon connection string (removed channel_binding=require)
- Updated Vercel env vars (DATABASE_URL and DIRECT_URL)
- Deployed to production via Vercel CLI

Stage Summary:
- Fixed timezone offset bug causing 4-hour shift in slot conflict detection
- Fixed dayOfWeek calculation to avoid off-by-one errors
- Deployed to https://ap-parrucchiere.vercel.app
- GitHub push failed due to expired token (user needs to update token)

