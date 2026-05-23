# Repository Instructions For Codex

This repository is migrating an existing multi-project application into Laravel + Inertia + React. Follow these instructions before making code changes.

## Always Read Migration Context First

Before implementing any migration task, read the relevant files under `docs/migration-context/`.

Always start with:

- `docs/migration-context/90_FINAL_MIGRATION_BLUEPRINT.md`
- `docs/migration-context/91_MODULE_MIGRATION_ORDER.md`
- `docs/migration-context/92_AGENT_RULES_FOR_REWRITE.md`
- `docs/migration-context/93_UI_PRESERVATION_GUIDE.md`
- `docs/migration-context/94_API_TO_INERTIA_CONVERSION_MAP.md`

Then read the module-specific source context files for frontend routes/API usage, .NET backend contracts, existing Laravel API/payment behavior, auth, data model, and UI inventory as needed.

## Migration Target

- Target stack: Laravel 13, Inertia Laravel v3, React 19, Tailwind CSS v4.
- Use Laravel session auth for browser/Inertia pages.
- Use Inertia pages for app screens. Do not rebuild the target as a separate React Router SPA.
- Prefer server-provided Inertia props over unnecessary client API calls.
- Keep JSON/API routes only for payment webhooks, polling/live updates, payment refresh/Snap redirects, external integrations, and temporary compatibility endpoints.
- Use Wayfinder or named Laravel routes for frontend navigation and submissions.

## Behavior Rules

- Preserve existing documented behavior unless migration context marks it unsafe, mock-only, placeholder, or TODO.
- Do not invent business rules.
- If behavior is unclear, mark it as TODO and cite the relevant migration context conflict.
- Known roles include `Admin`, `Cashier`, `Kasir`, `Customer`, and `Mahasiswa`; do not silently choose a canonical mapping without documenting the assumption.
- Do not merge .NET order status values with existing Laravel backup API payment/order status values directly. Use a documented compatibility mapping or separate `payment_status` and `order_status`.

## Laravel Rules

- Use Laravel conventions: named routes, route model binding, controllers, Form Requests, policies/gates, Eloquent relationships, casts, resources where useful, migrations, and tests.
- Use Form Requests for validation.
- Use policies and `Auth::user()` instead of trusting browser-supplied `user_id`, `outlet_id`, or `transaction_id`.
- Calculate prices and totals server-side from menu data; do not trust browser-supplied `unit_price`.
- Use database transactions for order creation, stock changes, payment state changes, and order status transitions.
- Add tests for critical migrated behavior.

## UI Preservation

- Preserve the old React frontend design during migration.
- Follow `docs/migration-context/93_UI_PRESERVATION_GUIDE.md`.
- Preserve CSS variables, palette, typography intent, spacing, layouts, card/table/form/dialog patterns, loading states, empty states, and toast behavior.
- Reuse/refactor shadcn-style primitives from old `src/components/ui/*` where possible.
- Preserve `AuthLayout`, `AdminLayout`, `CustomerLayout`, and `CashierLayout`, adapted for Inertia.
- Do not introduce a redesign, new brand palette, landing page, or marketing-style layout during migration.
- Tailwind CSS v4 uses `@import "tailwindcss"` and CSS-first `@theme`; avoid deprecated Tailwind v3 utilities.

## Payment Gateway Safety

- Preserve the active Midtrans Snap flow and compatibility response fields while migrating checkout.
- Do not expose secrets, raw provider credentials, raw bearer tokens, or raw exception file/line details.
- Do not preserve committed fallback Midtrans credentials.
- Public payment callbacks must not be authoritative unless they validate provider signatures and payment details.
- Use a signed `POST /webhooks/midtrans` route for authoritative payment updates.
- Keep browser finish/redirect routes non-authoritative.
- Validate Midtrans signature, `gross_amount`, `order_id`, and transaction status.
- Store payment attempt metadata for Snap order ids, tokens, redirect URLs, statuses, and retries.
- Make webhook handling idempotent.

## Reporting

After every implementation task, summarize:

- Files changed.
- Behavior implemented.
- Tests run.
- Assumptions/TODOs.
- Any intentionally preserved compatibility behavior.
