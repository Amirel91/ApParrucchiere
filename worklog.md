---
Task ID: 1
Agent: Main Agent
Task: Integrate Nexi XPay billing system into IntelliGenda

Work Log:
- Read and analyzed full project state: schema.prisma, proxy.ts, tenant.ts, auth.ts, db.ts, superadmin dashboard, register route
- Updated Prisma schema: added billing fields to Tenant (subscriptionStatus, planEndDate, nexiCustomerId, nexiSubscriptionId, cancelReason, cancelledAt)
- Added 6 migration SQL statements to db.ts for auto-DDL via Neon HTTP
- Created /api/billing/status — GET subscription status for current tenant
- Created /api/billing/subscribe — POST initiate Nexi subscription (demo mode when API keys not configured)
- Created /api/billing/cancel — POST cancel subscription with anti-churn reason, calls Nexi API to stop recurring
- Created /api/billing/webhook — POST Nexi webhook handler (payment.success, payment.failed, subscription.cancelled)
- Created /account page with: subscription status card, trial/active/cancelling/suspended UI states, activate/reactivate buttons
- Implemented cancel modal with anti-churn feedback: 4 radio options + custom text field for missing_feature/other
- Updated tenant.ts: getTenantConfig/getTenantConfigFromCookies now check subscription status and return null for suspended tenants
- Added getTenantBySlugUnchecked for billing routes that need to operate on suspended tenants
- Updated SuperAdmin dashboard: new "Abbonamento" column with SubscriptionBadge, expandable cancel reason rows
- Updated SuperAdmin stats: revenue calculated from paying tenants only (subscriptionStatus=active)
- Updated SuperAdmin tenants API: includes billing fields in response
- Updated register route: new tenants start with subscriptionStatus='trial'
- Fixed Next.js 16 build conflict: removed middleware.ts (proxy.ts is the correct file for NX16)
- Fixed Suspense boundary for useSearchParams in /account page
- Build passed successfully with all 4 billing API routes + /account page

Stage Summary:
- Complete Nexi XPay billing integration (conceptual API, demo mode active)
- Subscription lifecycle: trial → active → cancelling → suspended (with auto-expiry)
- Anti-churn cancel modal with 4 feedback options
- SuperAdmin shows cancel reasons and subscription status per tenant
- Tenant access automatically blocked when subscription expires (via tenant.ts)
- Files created: 4 API routes, 1 page component
- Files modified: schema.prisma, db.ts, tenant.ts, superadmin page, superadmin tenants API, superadmin stats API, register route

---
Task ID: 1
Agent: main
Task: Remove slug field from global login, switch to email+password only

Work Log:
- Read current login page, global-login API, Prisma schema, and account page
- Identified architecture: AdminUser has username (no email), Tenant has ownerEmail
- Modified `/api/auth/global-login/route.ts`: changed schema from {slug, password} to {email, password}, lookup tenant by ownerEmail (case-insensitive), find admin user for that tenant, verify password, return slug
- Modified `/login/page.tsx`: removed slug input field (Globe icon, slug formatting, .intelligenda.it suffix), replaced with email input field (Mail icon, standard email validation, autoComplete="email"), kept password field unchanged
- Account page already has "Gestisci la tua Agenda" button linking to shop dashboard — no changes needed
- Build passed successfully

Stage Summary:
- Login now requires only Email + Password (no slug memorization needed)
- Backend finds tenant by ownerEmail, retrieves admin, verifies password, returns slug
- Frontend redirects to /account?slug=xxx after successful authentication
- Files modified: src/app/api/auth/global-login/route.ts, src/app/login/page.tsx

---
Task ID: 3
Agent: main
Task: Implement multi-resource (multi-chair/collaborator) support

Work Log:
- Analyzed existing codebase: schema, slot-algorithm.ts, bookings API, time-blocks API, settings UI, calendar UI
- Updated prisma/schema.prisma: added Resource model (id, name, active, sortOrder, configId), added nullable resourceId to Booking
- Added 8 DDL migrations to db.ts: Resource table, FK constraints, Booking.resourceId, auto-seed "Standard" resource
- Rewrote slot-algorithm.ts: per-resource availability check, legacy bookings block all resources, new findFreeResource() helper
- Created /api/resources (GET+POST) and /api/resources/[id] (PUT+DELETE) with full CRUD
- Updated /api/bookings GET to include resource, POST to auto-assign via findFreeResource()
- Updated /api/time-blocks POST to accept optional resourceId
- Added "Postazioni" tab to Settings page with full CRUD UI (add/rename/toggle ON-OFF/delete)
- Updated Calendar: resource badge shown in desktop side panel, mobile bottom sheet, list view, table view, booking detail modal
- Resolved git rebase conflict (merged billing migrations with resource migrations in db.ts)
- Build passed, deployed to GitHub

Stage Summary:
- 13 files changed, 710 insertions
- Files created: src/app/api/resources/route.ts, src/app/api/resources/[id]/route.ts
- Files modified: prisma/schema.prisma, src/lib/db.ts, src/lib/slot-algorithm.ts, src/app/api/bookings/route.ts, src/app/api/time-blocks/route.ts, src/app/admin/impostazioni/page.tsx, src/app/admin/calendario/page.tsx
- Commit: 9023821 pushed to main
- Backward compatible: existing bookings work unchanged, default "Standard" resource auto-created
---
Task ID: 1
Agent: Main Agent
Task: Rimuovere tutti i riferimenti testuali, visivi e segnaposto legati al mondo parrucchieri/barbieri

Work Log:
- Searched entire codebase for barber/salon references (Scissors, BarberShop, taglio, parrucchi, capelli, barba, etc.)
- Found 23 files with 75+ total match lines
- Replaced all Scissors icon imports with Sparkles, Wrench, or Calendar (context-dependent)
- Updated LoginPage: BarberShop → IntelliGenda, icon Scissors → Calendar, "Prenota il tuo taglio" → "Prenota il tuo appuntamento"
- Updated AdminNav: Scissors → Sparkles, BarberShop → IntelliGenda
- Updated Sidebar, AppShell, Dashboard, StaffManager, admin/layout: Scissors → Sparkles/Wrench
- Updated ServiceForm, ServicesManager, OnboardingWizard: "Taglio Capelli/Donna" → "Servizio Standard", "Capelli, Trattamenti" → "Standard, Premium"
- Updated ClientAppointments: "Prenota il tuo primo taglio!" → "Prenota il tuo primo appuntamento!"
- Updated landing/page.tsx: "Barberia Rock" → "Studio Rossi"
- Updated OnboardingWizard: "Il mio Salone" → "La mia Attività"
- Replaced SALONE/BARBIERE activity types with GENERICO/ALTRO in activity-types.ts
- Updated seed.ts: replaced all salon-specific services with generic professional services
- Changed seed business name from "Studio Bellezza" to "Studio Professionale"
- Verified zero remaining Scissors/barber references via grep
- Build passed with zero errors
- Deployed to GitHub as commit e620bd8

Stage Summary:
- 16 files modified across components, pages, lib, and seed
- All barber/salon/hair-specific references removed
- Build successful, pushed to main
---
Task ID: 2
Agent: Main Agent
Task: Espandere categorie di attivita + implementare suggerimenti rapidi servizi

Work Log:
- Rewrote activity-types.ts with 11 universal categories (was 12 niche beauty-focused)
- New categories: Estetica & Beauty, Saloni & Capelli, Benessere/SPA, Tatuaggi/Piercing, Auto/Moto, Fisioterapia/Osteopatia, Personal Trainer/Sport, Studi Legali/Consulenza, Pet Grooming, Scuole/Corsi, Altro
- Created service-suggestions.ts with 40+ predefined service templates mapped by activity type
- Added activityType column to BusinessConfig (Prisma schema + DDL migration in db.ts)
- Added activityType field to register API with validation against valid types
- Added "Tipo di Attivita" dropdown to landing page registration form
- /api/config already returns full config object, so activityType is automatically exposed
- Added quick suggestion badges (Zap icon + clickable chips) to both admin/servizi/page.tsx and ServicesManager.tsx
- ALTRO category returns empty array = no suggestions shown
- Backward compatible: existing tenants default to 'ALTRO'
- Build successful, pushed to GitHub as commit c362396

Stage Summary:
- 8 files modified, 1 new file created
- 11 universal activity categories with 40+ service templates
- Registration form now includes activity type selection
- Admin services pages show contextual quick-fill suggestions
- Zero impact on multi-resource and multi-tenant logic
