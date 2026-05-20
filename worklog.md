---
Task ID: 1
Agent: Main Agent
Task: Add QR Code for shop window (vetrina) in admin settings Negozio tab

Work Log:
- Explored admin settings page structure (`src/app/admin/impostazioni/page.tsx`)
- Identified 4 tabs: negozio, orari, postazioni, password
- Determined tenant slug is accessible via `tenant_slug` cookie (httpOnly: false)
- Installed `qrcode.react` v4.2.0
- Added QR Code section to Negozio tab with:
  - Dynamic URL generation (subdomain for production, `/t/slug` for Vercel)
  - `QRCodeCanvas` component (size 200, level H, stone-900 foreground)
  - Elegant box with stone-50 background and rounded-2xl corners
  - Download button that exports canvas to PNG with 32px white padding
  - Filename: `qrcode-intelligenda.png`
- Verified zero new TypeScript errors (pre-existing errors in legacy SPA components only)

Stage Summary:
- Commit: `43430e0` — "feat: add QR Code for shop window in admin Negozio tab"
- Files modified: `src/app/admin/impostazioni/page.tsx`, `package.json`, `package-lock.json`
- Library added: `qrcode.react@4.2.0`
- The QR code section appears below the shop info form in the Negozio tab
