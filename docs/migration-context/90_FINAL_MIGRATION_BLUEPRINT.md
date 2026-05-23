# Final Migration Blueprint

This file consolidates the frontend, .NET backend, and existing Laravel backup API migration context. Future implementation agents must read this file together with `docs/migration-context/91_MODULE_MIGRATION_ORDER.md`, `docs/migration-context/92_AGENT_RULES_FOR_REWRITE.md`, `docs/migration-context/93_UI_PRESERVATION_GUIDE.md`, and `docs/migration-context/94_API_TO_INERTIA_CONVERSION_MAP.md` before changing application code.

## Current Architecture Summary

The existing application is split across three systems:

- Main backend: .NET 8 Web API project documented in `docs/migration-context/10_DOTNET_BACKEND_OVERVIEW.md`. It owns auth, users, outlets, menu, stock, transactions, reports, and legacy/incomplete Midtrans Snap code.
- Main frontend: React 19 + TypeScript + Vite SPA documented in `docs/migration-context/00_PROJECT_OVERVIEW.md`, with React Router routes in `src/App.tsx`, TanStack Query, Axios, shadcn-style local UI primitives, Tailwind CSS v4 variables, and JWT auth stored in `localStorage`.
- Backup/special backend: Laravel API project `api-backup-kantin`, documented in `docs/migration-context/20_EXISTING_LARAVEL_API_OVERVIEW.md`. It currently owns the active customer checkout, Midtrans Snap redirect, payment retry, customer order polling, cashier order polling, and cashier status update flows used by the React frontend.

Important ownership split:

- Primary PascalCase endpoints such as `/Auth/login`, `/Menu`, `/Outlets`, `/Transactions`, `/Reports/...`, and `/User` are .NET-owned, per `docs/migration-context/04_FRONTEND_API_USAGE.md` and `docs/migration-context/11_DOTNET_API_CONTRACTS.md`.
- Lowercase backup endpoints such as `/transactions`, `/transactions/user`, `/transactions/outlet`, `/transactions/status`, `/transactions/refresh-snap`, and `/cashierUpdateTransactionStatus` are existing Laravel API-owned, per `docs/migration-context/21_PAYMENT_GATEWAY_FLOW.md` and `docs/migration-context/22_EXISTING_LARAVEL_API_CONTRACTS.md`.
- The existing React checkout page `src/pages/customer/CheckoutPage.tsx` uses the Laravel backup API, not the .NET `POST /api/Transactions` endpoint.

## Target Architecture Summary

Target stack:

- Laravel 13 + PHP 8.3.
- Inertia Laravel v3 + React 19.
- Tailwind CSS v4 with CSS-first theme tokens.
- Laravel session auth for browser/Inertia pages.
- Policies/Gates for authorization.
- Form Requests for validation.
- Eloquent models and relationships for domain data.
- JSON routes only where API behavior is truly needed: Midtrans webhook, payment refresh, polling/live updates during transition, and compatibility endpoints if old clients are still active.

Target direction:

- Replace React Router route protection with Laravel `auth`, `guest`, and role/policy middleware.
- Replace frontend JWT decoding/localStorage auth with Inertia shared `auth.user` props.
- Replace .NET DataAnnotations with Laravel Form Requests.
- Replace EF Core entity access with Eloquent models, migrations, relationships, casts, and indexes.
- Move Laravel backup API payment logic into dedicated controllers/actions/services, not a catch-all API controller.
- Keep existing UI structure and palette first; redesign is explicitly out of scope for the technical rewrite.

## Recommended Laravel Folder Structure

```text
app/
  Actions/
    Menu/
      StoreMenuItem.php
      UpdateMenuItem.php
    Orders/
      CreateOrderWithMidtransPayment.php
      UpdateOrderStatus.php
    Payments/
      RefreshMidtransSnap.php
      HandleMidtransNotification.php
  Enums/
    OrderStatus.php
    PaymentStatus.php
    UserRole.php
  Http/
    Controllers/
      Auth/
        AuthenticatedSessionController.php
        RegisteredUserController.php
      Admin/
        DashboardController.php
        MenuItemController.php
        OutletController.php
        ReportController.php
        StockController.php
        TransactionController.php
        UserController.php
      Customer/
        MenuController.php
        OrderController.php
        PaymentController.php
        ProfileController.php
      Cashier/
        OrderController.php
        OrderStatusController.php
        TransactionController.php
        CashPaymentController.php
      Payment/
        MidtransFinishController.php
        MidtransNotificationController.php
    Middleware/
      EnsureUserHasRole.php
    Requests/
      Auth/
      Admin/
      Customer/
      Cashier/
      Payment/
    Resources/
      MenuItemResource.php
      OutletResource.php
      TransactionResource.php
      UserResource.php
  Models/
    MenuItem.php
    Outlet.php
    PaymentAttempt.php
    PaymentNotification.php
    Stock.php
    Transaction.php
    TransactionItem.php
    User.php
  Policies/
    MenuItemPolicy.php
    OutletPolicy.php
    TransactionPolicy.php
    UserPolicy.php
  Services/
    Payments/
      MidtransSnapService.php
```

Notes:

- Use `Transaction`/`TransactionItem` initially if preserving existing naming is clearer. Rename to `Order`/`OrderItem` only if the business confirms the language shift.
- Keep a transitional legacy connection or resource layer if the first migration phase reads PascalCase SQL Server tables (`Transactions`, `TransactionItems`, `MenuItems`, `Outlets`, `UserToken`) documented in `docs/migration-context/23_EXISTING_LARAVEL_DATA_MODEL.md`.
- Do not create generic repositories unless the codebase already adopts them. Prefer Eloquent, focused actions, and query objects only where complexity justifies them.

## Recommended Inertia React Folder Structure

Use the structure from `docs/migration-context/06_INERTIA_MIGRATION_NOTES.md`:

```text
resources/js/
  app.tsx
  bootstrap.ts
  Layouts/
    AdminLayout.tsx
    AuthLayout.tsx
    CashierLayout.tsx
    CustomerLayout.tsx
  Pages/
    Auth/
      Login.tsx
      Register.tsx
      Unauthorized.tsx
    Customer/
      Menu/
        Index.tsx
      Checkout.tsx
      Orders/
        Index.tsx
        Show.tsx
      Profile.tsx
    Admin/
      Dashboard.tsx
      Menu/
        Index.tsx
      Outlets/
        Index.tsx
      Stock/
        Index.tsx
      Transactions/
        Index.tsx
      Reports/
        Index.tsx
      Users/
        Index.tsx
      Settings.tsx
    Cashier/
      Orders/
        Incoming.tsx
      Transactions/
        Index.tsx
      CashPayment.tsx
  Components/
    common/
      Logo.tsx
    ui/
  lib/
    utils.ts
    image-utils.ts
  types/
```

Migration rules:

- Copy/refactor reusable UI primitives from `src/components/ui/*` into `resources/js/Components/ui`.
- Convert layouts from React Router `<Outlet />` to Inertia `children`.
- Replace React Router `Link`, `Navigate`, `useLocation`, and route params with Inertia `Link`, Laravel route names/Wayfinder functions, and page props.
- Keep TanStack Query or plain JSON calls only for live/polling/payment behavior that should not be fully server-propped.

## Auth Migration Strategy

Current auth:

- React posts to `.NET` `POST /Auth/login` and receives a JWT.
- Frontend decodes JWT in `src/services/auth.service.ts`, stores `token`, `user`, `outletId`, and `fullName` in `localStorage`, and role-redirects in `src/hooks/useAuth.ts`.
- .NET stores issued JWTs in `UserToken` and revokes them in `AuthController.Logout`.
- Existing Laravel backup API validates .NET JWTs by looking up `UserToken`, then decodes JWT payload manually without cryptographic signature verification.

Target auth:

- Use Laravel session auth for Inertia pages.
- Share `auth.user` globally with `id`, `username`, `fullName`, `role`, and `outletId`.
- Use `guest` middleware for login/register and `auth` middleware for app pages.
- Use broad role route groups for Admin, Customer/Mahasiswa, and Cashier/Kasir.
- Use policies for object-level checks: users, outlets, menu items, transactions/orders, reports.
- Keep token/Sanctum compatibility only if old external clients still call JSON APIs.
- Remove browser-managed JWT and `localStorage` auth from the target Inertia frontend.

Open auth conflicts/TODOs:

- Canonical role names conflict: `.NET` uses `Admin`, `Cashier`, `Customer`; frontend also allows `Kasir` and `Mahasiswa`. Decide whether to normalize or support aliases.
- `GuestRoute` redirects authenticated cashier users to `/app`, while login redirects cashier users to `/cashier` (`docs/migration-context/05_AUTH_AND_PERMISSION_FLOW.md`). Target Laravel should use one canonical redirect table.
- Existing frontend stores `fullName` incorrectly as username in one path. Confirm target display value before porting.

## Data Model Migration Strategy

Source models:

- .NET entities: `User`, `UserToken`, `Outlet`, `MenuItem`, `Stock`, `Transaction`, `TransactionItem`, documented in `docs/migration-context/12_DOTNET_DATA_MODEL.md`.
- Existing Laravel backup API models target PascalCase SQL Server tables and omit several relationships/casts, documented in `docs/migration-context/23_EXISTING_LARAVEL_DATA_MODEL.md`.

Target models:

- `User`: `username`, `password`, `role`, `full_name`, `outlet_id`, timestamps; add unique index on `username`.
- `Outlet`: `name`, `location`, `qris_image_url`; relationships to users, menu items, and transactions.
- `MenuItem`: `name`, `description`, `price`, `outlet_id`, `image_url`; relationship to stock and transaction items.
- `Stock`: `menu_item_id`, `quantity`; add `unique(menu_item_id)` if one stock row per menu item is confirmed.
- `Transaction`: user, outlet, total, payment method, payment status, order status, timestamps.
- `TransactionItem`: transaction, menu item, quantity, unit price.
- `PaymentAttempt`: transaction, Midtrans order id, Snap token, redirect URL, attempt status.
- `PaymentNotification`: raw notification metadata/hash/status for idempotent webhook processing.

Manual cashier cash payment update:

- Manual cashier orders are now a confirmed target flow, not a placeholder.
- Cashier cash payment must be session-scoped to the authenticated cashier's assigned outlet.
- The browser may send menu ids, quantities, and cash received amount, but Laravel must calculate menu unit prices, total amount, and change amount server-side.
- Walk-in cashier orders must not require a customer name; use an internal fallback such as `Pelanggan walk-in`. Self-order customer orders may use the authenticated user's profile/username as the display name.
- Cash transactions use `payment_method = COD`, `payment_status = paid`, and the documented .NET order workflow `order_status = 1` for newly received orders.
- Persist `cash_received_amount` and `change_amount` on the transaction so receipts can be reprinted.
- The cash payment page should show a printable receipt after successful submission and allow reopening recent receipts from the same cashier outlet.
- This manual cash flow must not touch Midtrans Snap, payment attempts, callbacks, or webhook behavior.

Customer self-order update:

- Customer self-order is now a confirmed target flow.
- Until payment gateway migration resumes, customer checkout should bypass Midtrans and create a local paid transaction with `payment_method = BYPASS`, `payment_status = paid`, and `order_status = 1`.
- Customer order creation must still calculate prices server-side, enforce one outlet per order, decrement stock transactionally, and scope order history/tracking to the authenticated customer.
- Cashier incoming orders should show customer self-orders and cashier/manual orders for the cashier's assigned outlet.
- Cashier order status updates use the documented .NET workflow values: `1=received`, `2=preparing`, `3=ready`, `4=completed`, `5=cancelled`.
- Customer and cashier order pages may use Inertia polling for near-real-time updates.

Important strategy:

- If migrating existing data, first decide whether the new app reads legacy PascalCase SQL Server tables or migrates into Laravel snake_case tables.
- Use explicit migrations with foreign keys, indexes, decimal precision `18,2`, and nullable/default behavior.
- Calculate prices and totals server-side from menu items; do not preserve the backup API's client-supplied `unit_price` as final truth.
- Use DB transactions and row locking for stock decrement/restoration.
- Split payment status from order fulfillment status if possible.

Status conflict:

- .NET transaction `Status` values mean order workflow: `1=received`, `2=preparing`, `3=ready`, `4=completed`, `5=cancelled`.
- Existing Laravel API `Transactions.Status` means mixed payment/order state: `0=pending/unpaid`, `1=paid/success/visible to cashier`, `2=cashier-updated unknown meaning`.
- Do not merge these silently. Define explicit target enums or compatibility mappings before implementing transaction/order code.

## UI/Design Preservation Strategy

Primary UI sources:

- `src/index.css` theme tokens and Tailwind v4 setup, documented in `docs/migration-context/02_UI_DESIGN_SYSTEM.md`.
- `src/components/ui/*` shadcn-style primitives, documented in `docs/migration-context/03_COMPONENT_INVENTORY.md`.
- Layouts: `src/components/layouts/AdminLayout.tsx`, `CustomerLayout.tsx`, `CashierLayout.tsx`, `AuthLayout.tsx`.

Preservation approach:

- Move CSS variables from `src/index.css` into `resources/css/app.css` and preserve exact token names/values first.
- Keep the current palette: white/slate base, primary blue token, blue accents, status green/yellow/orange/red, and the documented dark-mode tokens.
- Keep `Inter`, `Source Serif 4`, and `JetBrains Mono` token names; confirm actual font loading.
- Reuse `Button`, `Badge`, `Card`, `Dialog`, `Input`, `Textarea`, `Label`, `Select`, `Alert`, `RadioGroup`, `Particles`, `cn`, and `image-utils` with import-path changes.
- Preserve admin/customer/cashier layout spacing, sidebars, mobile nav, cards, tables, loading states, empty states, and toasts.
- Do not redesign during migration. Only refactor UI where required by Inertia routing/auth/data changes.

## Payment Gateway Preservation Strategy

Active payment source:

- Existing Laravel backup API, especially `ApiController@createTransaction`, `paymentCallback`, `refreshSnapToken`, `checkTransactionStatus`, `userTransactionList`, `outletTransactionList`, and `cashierUpdateTransactionStatus`, documented in `docs/migration-context/21_PAYMENT_GATEWAY_FLOW.md` and `docs/migration-context/22_EXISTING_LARAVEL_API_CONTRACTS.md`.

Must preserve initially:

- Midtrans provider and Snap redirect flow.
- Order id prefix compatibility: `TRX-{transactionId}` and refreshed form `TRX-{transactionId}-{timestamp}`.
- `POST /transactions` success response fields during phased migration: `status`, `transaction_id`, `order_id`, `total_amount`, `snap_token`, `snap_redirect_url`.
- Payment retry behavior for pending transactions.
- Customer history/tracking and cashier list/status response shapes while old frontend behavior is being ported.
- Frontend redirect to `snap_redirect_url`.

Must improve before production cutover:

- Add signed `POST /webhooks/midtrans` server notification route.
- Keep browser finish redirect separate and non-authoritative.
- Validate Midtrans `signature_key`, `gross_amount`, `order_id`, and transaction status.
- Store payment attempts and notification metadata.
- Make webhook handling idempotent.
- Scope customer/cashier transaction access to the authenticated user/outlet.
- Stop trusting client-supplied `unit_price`.
- Decide stock decrement/restoration behavior for online payments.

Do not preserve:

- Single catch-all `ApiController`.
- Public callback that marks paid based only on `order_id`.
- Hardcoded frontend redirect URL.
- Committed fallback Midtrans credentials.
- Arbitrary `user_id`, `outlet_id`, or `transaction_id` query access.

## Module-By-Module Migration Order

Recommended high-level sequence:

1. Foundation and safety net: environment, auth scaffolding, shared layout, base UI tokens/components, role definitions, route groups, and tests around critical existing payment contracts.
2. Auth and user model: session login/register/logout, role redirect, shared Inertia user prop, user policies.
3. UI shell: AuthLayout, AdminLayout, CustomerLayout, CashierLayout, Unauthorized page.
4. Core data model: outlets, menu items, stock, users, transaction/order tables, payment attempt tables.
5. Admin catalog: menu, outlets, stock, users.
6. Customer menu and cart/checkout state.
7. Payment/order creation with Midtrans Snap compatibility.
8. Customer order history/tracking and payment retry.
9. Cashier incoming orders/status updates and transaction history.
10. Admin transactions/dashboard/reports.
11. Mock/TODO behavior: cash payment, outlet create/delete, report export, settings.
12. Hardening and compatibility retirement: webhooks, idempotency, broadcasting/polling decisions, old API aliases, legacy token bridge removal.

See `docs/migration-context/91_MODULE_MIGRATION_ORDER.md` for module-level details.

## Risk Areas

- Payment callback security is currently unsafe: no signature validation and no status/gross amount checks.
- Payment/order status values conflict between .NET and the backup Laravel API.
- Checkout currently trusts client-supplied prices in the Laravel backup API.
- Backup Laravel API does not decrement or restore stock.
- Customer/cashier transaction APIs accept arbitrary IDs without owner/outlet authorization.
- .NET transaction list endpoint may return debug output before real data.
- .NET controllers contain inconsistent JWT claim reads; target Laravel must use `Auth::user()` and policies instead.
- Outlet create/delete, cash payment, report exports, and admin dashboard stats are partly mock/TODO in the current React app.
- Customer cart is local React Router navigation state; target Inertia needs a persistence strategy.
- Existing UI contains a `/app/cart` nav/link but no declared route.
- Existing Laravel API uses PascalCase legacy tables while target Laravel conventions prefer snake_case.

## Open Questions / TODOs

- Decide canonical roles and aliases: `Cashier` vs `Kasir`, `Customer` vs `Mahasiswa`.
- Decide target database strategy: legacy SQL Server PascalCase tables, migrated snake_case MySQL tables, or phased dual-read/write.
- Confirm whether Midtrans currently uses `/api/midtrans/callback` as finish redirect, notification URL, or both.
- Confirm meaning of backup Laravel `Status = 2`.
- Confirm whether order/payment status should be split now or introduced through compatibility fields.
- Confirm whether stock should decrement at checkout creation, after payment success, or at cashier acceptance.
- Confirm whether manual cash payment is in scope and what backend behavior it should have.
- Confirm whether outlet create/delete should become real features.
- Confirm report export requirements for PDF/Excel.
- Confirm image storage migration path for menu images, QRIS images, and placeholder/fallback behavior.
- Confirm whether broadcasting should replace polling, or polling should remain for the first rewrite.

## Definition Of Done For Each Migrated Module

For every module migrated into Laravel + Inertia:

- Existing documented behavior is preserved or explicitly documented as intentionally changed.
- Routes use Laravel route names and middleware; frontend calls use Wayfinder/route helpers where available.
- Inertia pages receive server-provided props for initial render data.
- Forms use Inertia `useForm` and Laravel Form Requests.
- Validation errors, authorization errors, empty states, loading states, and success/error toasts are handled.
- Policies/Gates enforce role, owner, and outlet permissions.
- Eloquent relationships and casts are defined and used; avoid manual joins where relationships are clearer.
- Money totals, stock changes, and payment/order state changes are handled server-side inside DB transactions where needed.
- UI follows the existing palette, spacing, card/table/form/dialog patterns, and responsive layout.
- Feature tests cover critical backend behavior; frontend interaction tests are added for high-risk flows when practical.
- The agent documents assumptions and summarizes changed files after the task.
