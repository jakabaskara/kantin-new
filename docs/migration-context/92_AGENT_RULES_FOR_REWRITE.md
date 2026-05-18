# Agent Rules For Rewrite

This file is the main instruction file for coding agents implementing the Laravel + Inertia + React rewrite.

## Required Reading Before Code Changes

Before changing application code, always read:

- `docs/migration-context/90_FINAL_MIGRATION_BLUEPRINT.md`
- `docs/migration-context/91_MODULE_MIGRATION_ORDER.md`
- `docs/migration-context/93_UI_PRESERVATION_GUIDE.md`
- `docs/migration-context/94_API_TO_INERTIA_CONVERSION_MAP.md`
- The specific source context files relevant to the module, such as:
  - Frontend routes/pages: `docs/migration-context/01_FRONTEND_ROUTES_AND_PAGES.md`
  - UI/components: `docs/migration-context/02_UI_DESIGN_SYSTEM.md`, `docs/migration-context/03_COMPONENT_INVENTORY.md`
  - Frontend API usage: `docs/migration-context/04_FRONTEND_API_USAGE.md`
  - Auth: `docs/migration-context/05_AUTH_AND_PERMISSION_FLOW.md`, `docs/migration-context/14_DOTNET_AUTH_PERMISSION_MAP.md`
  - .NET backend: `docs/migration-context/10_DOTNET_BACKEND_OVERVIEW.md` through `15_DOTNET_TO_LARAVEL_MAPPING.md`
  - Existing Laravel API/payment: `docs/migration-context/20_EXISTING_LARAVEL_API_OVERVIEW.md` through `24_LARAVEL_API_MERGE_STRATEGY.md`

## Non-Negotiable Rules

- Preserve existing behavior unless the migration context explicitly marks it as unsafe, mock-only, placeholder, or TODO.
- Preserve the existing UI palette/design from the React frontend. Do not redesign while migrating.
- Do not invent business rules. If behavior is missing or ambiguous, mark a TODO or ask for confirmation.
- Use Laravel conventions: controllers, Form Requests, policies, Eloquent models, relationships, resources where useful, named routes, route model binding, and migrations.
- Use Inertia for app pages. Do not rebuild the app as a separate SPA with React Router.
- Prefer server-provided Inertia props over unnecessary client API calls.
- Keep JSON/API routes only for payment webhooks, polling/live updates, payment refresh/Snap redirect behavior, external integrations, and temporary compatibility endpoints.
- Keep payment gateway webhook/API behavior safe. Never make a public callback authoritative without signature validation.
- Use Form Requests for validation. Do not duplicate old inline controller validation as ad hoc controller code.
- Use Eloquent relationships and casts. Avoid manually assembling domain data when a relationship/resource is clearer.
- Use Policies/Gates for permissions. Do not manually trust user, outlet, or transaction ids from request query strings.
- Document assumptions in the changed file or task summary when requirements are unclear.
- Explain files changed after every implementation task.

## Auth Rules

- Use Laravel session auth for Inertia pages.
- Share `auth.user` through Inertia with `id`, `username`, `fullName`, `role`, and `outletId`.
- Replace `ProtectedRoute`, `GuestRoute`, `useAuth`, JWT decoding, and localStorage auth with Laravel middleware and Inertia props.
- Use role middleware for broad page groups and policies for object access.
- Do not preserve inconsistent .NET claim parsing. In Laravel, use `Auth::user()`.
- If temporary API token compatibility is required, use a clearly isolated compatibility guard/middleware or Sanctum. Do not let compatibility leak into normal Inertia pages.

## Role Rules

- Known existing roles: `Admin`, `Cashier`, `Kasir`, `Customer`, `Mahasiswa`.
- Do not choose a canonical mapping silently. If a module depends on role semantics, document the mapping used and why.
- Admin area requires Admin.
- Cashier area requires cashier role/alias and must be scoped to assigned outlet.
- Customer area requires customer/student role/alias and must be scoped to the authenticated user.

## Data Rules

- Use explicit migrations with foreign keys, indexes, decimal precision, defaults, and nullable rules.
- Do not rely only on controller checks for unique usernames or relationship integrity.
- Calculate prices/totals server-side from `MenuItem` records.
- Do not trust `unit_price`, `user_id`, `outlet_id`, or `transaction_id` from the browser as authorization truth.
- Use DB transactions for order creation, stock changes, and payment/order status transitions.
- Preserve response field names for compatibility only where old frontend behavior still depends on them.

## Status Rules

- Existing .NET `Transaction.Status` means order workflow: `1=received`, `2=preparing`, `3=ready`, `4=completed`, `5=cancelled`.
- Existing backup Laravel `Transactions.Status` means mixed state: `0=pending/unpaid`, `1=paid/success`, `2=cashier-updated unknown`.
- Do not merge those values directly.
- Prefer separate `payment_status` and `order_status`.
- If a temporary single status is required, create an explicit compatibility mapping and test it.

## Payment Rules

- Preserve Midtrans Snap redirect behavior and current response fields while migrating checkout.
- Store payment attempts for Snap order ids, tokens, redirect URLs, and statuses.
- Implement a signed `POST /webhooks/midtrans` route for authoritative payment updates.
- Keep `GET /payments/midtrans/finish` or equivalent browser finish route non-authoritative.
- Validate Midtrans signature, gross amount, order id, and status.
- Make webhook processing idempotent.
- Do not preserve committed fallback Midtrans credentials.
- Do not return raw exception file paths, line numbers, secrets, or provider credentials.

## Inertia Rules

- Use controllers to return page props for initial page data.
- Use Inertia `useForm` for form submissions.
- Use Wayfinder or named route helpers for frontend navigation/submission.
- Use partial reloads or JSON endpoints only for polling, live updates, payment retry, or large dynamic filters.
- Do not leave old Axios base URLs in migrated Inertia pages unless they call a retained JSON endpoint intentionally.

## UI Preservation Rules

- Preserve CSS variables from `src/index.css`.
- Preserve shadcn-style primitives from `src/components/ui/*`.
- Preserve admin, customer, cashier, and auth layout structure.
- Preserve `lucide-react` icons where existing UI used them.
- Preserve cards, tables, dialogs, forms, loading spinners, empty states, and toast patterns.
- Do not introduce a new color palette, landing page, or marketing-style layout.
- Tailwind v4 uses `@import "tailwindcss"` and CSS-first `@theme`; do not introduce deprecated Tailwind v3 utilities.

## Testing Rules

- Add/adjust tests for critical backend behavior:
  - auth/role redirects
  - Form Request validation
  - policies
  - menu/stock CRUD
  - order creation totals
  - stock transitions
  - payment attempt creation
  - Midtrans webhook idempotency
  - cashier outlet scoping
  - customer order ownership
- Do not delete existing tests without approval.
- Mock external Midtrans calls in tests.

## Reporting Rules For Agents

At the end of every task, report:

- Files changed.
- Behavior implemented.
- Any assumptions or unresolved TODOs.
- Tests run and results.
- Any intentionally preserved compatibility behavior.

If something is unknown, say `TODO` and cite the context conflict instead of inventing the rule.
