# Priority Mail Express — Build Plan

A full logistics + shipment tracking platform is a large build. I'll deliver it in clear phases so you can review along the way. Confirm the plan (or adjust scope) and I'll start with Phase 1.

## Notes & assumptions

- **Logo**: no file was attached. I'll generate a professional PME wordmark/shield logo (red + dark navy) and you can swap in your real logo later by replacing one file.
- **Backend**: I'll enable **Lovable Cloud** (database, auth, storage, server functions) — required for shipments, users, QR receipts, file uploads.
- **Auth**: email + password for staff. Customers do NOT need accounts.
- **PDF/QR**: QR via `qrcode` lib, barcode via `jsbarcode`, PDF receipt via `jspdf` + `html2canvas` (works in browser, no native deps).
- **Demo data**: seeded via migration — 1 super admin (you'll get the login), 2 branches, 3 customers, 4 sample shipments with movement timelines.
- **Domain in QR**: QR will encode `${window.location.origin}/track/{tracking}` so it works on your live preview AND on the final `prioritymailexpress.com` once deployed — no code change needed.

## Design direction

DHL/FedEx/UPS-grade corporate logistics UI:
- Palette: PME Red `#E1131D`, Navy `#0B1E3F`, White, Light Grey `#F4F6F8`, Slate text.
- Typography: Inter (body) + Space Grotesk (display) for bold headings.
- Components: dense pro tables, status pill badges, stepper timeline, KPI cards, polished forms.
- Intro animation: full-screen reveal "PRIORITY MAIL EXPRESS" → "International Special Delivery" → fade into landing.

## Phase 1 — Foundation (this turn)

1. Enable Lovable Cloud.
2. Design system: tokens in `src/styles.css` (PME colors, gradients, shadows), Inter + Space Grotesk via `<link>`, button/badge variants.
3. Generated PME logo asset.
4. Database schema + seed (migration):
   - `roles` enum, `user_roles`, `has_role()` function
   - `branches`, `customers`, `shipments`, `shipment_events`, `receipts`, `payments`, `delivery_confirmations`, `audit_logs`
   - RLS: public SELECT on shipments/events/receipts by tracking number; staff-only writes
   - Triggers: auto-generate `PME-AWB-YYYYMMDD-NNNNNN` + `PME-RCP-...` numbers; auto-create "Shipment Registered" event
   - Seed: 1 super admin user, 2 branches, 3 customers, 4 shipments with timelines
5. Public landing page with intro animation, hero, tracking box, feature grid, footer.
6. Public `/track/$tracking` page: status header, KPIs, full timeline stepper, sender/receiver, proof of delivery section.
7. Public `/verify/$receipt` page.
8. Staff `/auth` login page.
9. `_authenticated` layout with sidebar shell + dashboard KPIs.

## Phase 2 — Staff modules

10. Shipment creation wizard (sender → receiver → package → payment → review) → triggers AWB + receipt + QR.
11. Receipt preview/print page (A4 + 80mm thermal CSS) + PDF download + QR + barcode.
12. Movement update module (search by tracking → add event).
13. Delivery confirmation (photo upload to storage, signature pad, GPS).
14. Customers CRUD.
15. Branches CRUD.
16. Staff & roles management (super admin only).
17. Reports/analytics page with charts (daily/weekly/monthly, revenue, branch performance).

## Phase 3 — Polish

18. SEO (titles, descriptions, OG, sitemap, robots).
19. Mobile responsiveness pass.
20. Empty states, toasts, loading skeletons.

## Technical details

- Stack: TanStack Start + Tailwind v4 + shadcn + Supabase (Lovable Cloud).
- QR scan: customers can use phone camera on the printed receipt — no in-app scanner needed (browser camera scanning can be added in Phase 3 with `html5-qrcode` if you want).
- Tracking numbers: generated server-side via Postgres sequence + trigger for collision safety.
- Auth: protected routes under `_authenticated/`; role checks via `has_role()` security-definer fn.

## What I need from you

1. **Approve the plan** (or trim — e.g., skip reports, skip delivery photo, etc.).
2. **Logo**: upload your real PME logo, or I'll generate one. Either works.
3. **Super admin credentials**: I'll create `admin@prioritymailexpress.com` / `Admin@12345` for the demo. Change after first login. OK?
