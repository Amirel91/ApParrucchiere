---
Task ID: 1
Agent: main
Task: Complete rebuild of booking management platform (gestionale)

Work Log:
- Analyzed existing project state (Prisma schema, package.json, API routes, components)
- Installed bcryptjs and jose for JWT auth
- Designed new simplified Prisma schema: BusinessConfig, Service, Booking, BookingService, WorkingHours, AdminUser
- Wrote seed script with default admin user, shop config, working hours, 8 sample services
- Pushed schema to Neon PostgreSQL (force reset) and seeded database
- Created lib files: db.ts, auth.ts (JWT/bcrypt), validations.ts (Zod), slot-algorithm.ts (smart slot calculation)
- Created API routes: config, services, services/[id], bookings, bookings/[id], slots, auth/login, auth/me, auth/change-password, working-hours, stats
- Built client homepage with dynamic shop name + CTA + admin link
- Built 4-step booking flow: service selection → smart calendar → customer form → confirmation
- Built admin login page with JWT authentication
- Built admin layout with responsive sidebar
- Built admin dashboard with statistics
- Built admin calendar (month view + list view + booking detail modal)
- Built admin services CRUD (create, edit, delete, toggle active)
- Built admin settings (shop info, working hours, change password)
- Cleaned up all old components and API routes
- Verified build: `next build` compiles successfully (0 errors)
- Verified all API endpoints work correctly

Stage Summary:
- Application fully built and ready for Vercel deployment
- Login credentials: admin / admin123
- Database seeded with sample data
- Build output: 16 routes (9 static, 7 dynamic)
- Smart slot algorithm correctly handles duration-based availability
