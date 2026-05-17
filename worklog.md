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
