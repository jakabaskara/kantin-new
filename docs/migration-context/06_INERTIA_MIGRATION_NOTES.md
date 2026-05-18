# Inertia Migration Notes

## Suggested Target Folder Structure

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
      button.tsx
      badge.tsx
      card.tsx
      dialog.tsx
      form.tsx
      input.tsx
      label.tsx
      select.tsx
      textarea.tsx
      alert.tsx
      radio-group.tsx
      particles.tsx
  lib/
    utils.ts
    image-utils.ts
  types/
    auth.types.ts
    api.types.ts
```

## Existing React Components Likely Reusable

- Reuse mostly as-is:
  - `src/components/ui/button.tsx`
  - `src/components/ui/badge.tsx`
  - `src/components/ui/card.tsx`
  - `src/components/ui/dialog.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/textarea.tsx`
  - `src/components/ui/label.tsx`
  - `src/components/ui/select.tsx`
  - `src/components/ui/alert.tsx`
  - `src/components/ui/radio-group.tsx`
  - `src/lib/utils.ts`
- Reuse with light refactor:
  - `AdminLayout`, `CustomerLayout`, `CashierLayout`, `AuthLayout`: replace React Router APIs with Inertia children, `Link`, and current route detection.
  - `Particles`: verify browser-only lifecycle under Inertia.
  - `image-utils`: update base URL behavior to use Laravel storage/public asset URLs.
- Replace:
  - `ProtectedRoute`, `GuestRoute`: use Laravel middleware.
  - `useAuth`: use Inertia shared props and Laravel auth routes.

## Existing Pages That Should Become Inertia Pages

| Existing Page | Target Inertia Page | Notes |
| --- | --- | --- |
| `src/pages/auth/LoginPage.tsx` | `Pages/Auth/Login.tsx` | Use Inertia `useForm`. |
| `src/pages/auth/RegisterPage.tsx` | `Pages/Auth/Register.tsx` | Use Inertia `useForm`; confirm role defaults. |
| `src/pages/Unauthorized.tsx` | `Pages/Auth/Unauthorized.tsx` | Simple reuse. |
| `src/pages/customer/MenuList.tsx` | `Pages/Customer/Menu/Index.tsx` | Initial `menus` and `outlets` can be props. |
| `src/pages/customer/CheckoutPage.tsx` | `Pages/Customer/Checkout.tsx` | Needs cart persistence strategy; router state will not survive reload. |
| `src/pages/customer/OrderHistory.tsx` | `Pages/Customer/Orders/Index.tsx` | Initial orders as props; polling optional. |
| `src/pages/customer/OrderTracking.tsx` | `Pages/Customer/Orders/Show.tsx` | Initial order as prop; payment retry remains action. |
| `src/pages/customer/ProfilePage.tsx` | `Pages/Customer/Profile.tsx` | Consume shared `auth.user`. |
| `src/pages/admin/Dashboard.tsx` | `Pages/Admin/Dashboard.tsx` | Build stats server-side. |
| `src/pages/admin/MenuManagement.tsx` | `Pages/Admin/Menu/Index.tsx` | Inertia forms for create/update/delete. |
| `src/pages/admin/OutletManagement.tsx` | `Pages/Admin/Outlets/Index.tsx` | Create/delete need real backend contract. |
| `src/pages/admin/StockManagement.tsx` | `Pages/Admin/Stock/Index.tsx` | Controller data + async filter/update. |
| `src/pages/admin/TransactionsList.tsx` | `Pages/Admin/Transactions/Index.tsx` | Server props for transactions. |
| `src/pages/admin/ReportsPage.tsx` | `Pages/Admin/Reports/Index.tsx` | Fill report/export behavior after backend analysis. |
| `src/pages/admin/UserManagement.tsx` | `Pages/Admin/Users/Index.tsx` | Inertia forms and validation errors. |
| `src/pages/cashier/OrdersIncoming.tsx` | `Pages/Cashier/Orders/Incoming.tsx` | Keep polling or replace with broadcasts later. |
| `src/pages/cashier/DailyTransactions.tsx` | `Pages/Cashier/Transactions/Index.tsx` | Controller initial props; async refresh optional. |
| `src/pages/cashier/CashPayment.tsx` | `Pages/Cashier/CashPayment.tsx` | Needs real menu data and transaction endpoint. |

## API Calls That Should Become Laravel Controller-Provided Props

Good candidates for initial Inertia props:

- `GET /Menu` for customer menu and admin menu.
- `GET /Outlets` for outlet filters/forms and user creation.
- `GET /Reports/stock/byoutlet/{outletId}` for stock page initial selected outlet.
- `GET /Transactions` for admin transactions and report summaries.
- `GET /User` for user management.
- Order show initial detail currently from backup `/transactions/status`.
- Customer order history initial list currently from backup `/transactions/user`.
- Cashier transaction history initial list currently from backup `/transactions/outlet`.

## API Calls That May Remain Async Requests

Keep as async JSON requests or Inertia partial reloads where the user expects live updates:

- Cashier incoming orders polling: `/transactions/outlet`.
- Cashier status update: `/cashierUpdateTransactionStatus`.
- Customer order history/tracking polling: `/transactions/user`, `/transactions/status`.
- Payment retry: `/transactions/refresh-snap`.
- Payment transaction creation if it must return `snap_redirect_url` without full page reload.
- Admin filters/search can be client-side for small datasets or server-side via Inertia query params for larger datasets.

## Forms That Should Use Inertia `useForm`

- Login: `username`, `password`.
- Register: `username`, `fullName`, `password`, `confirmPassword`.
- Menu create/update: `name`, `description`, `price`, `outletId`, `initialStockQuantity`/`stockQuantity`, `imageFile`.
- Outlet update/create: `name`, `location`, `qrisImageUrl`.
- Stock update: `stockQuantity`.
- User create/update: `username`, `fullName`, `password`, `role`, `outletId`.
- Checkout transaction creation: customer/order payload plus notes if supported.
- Cash payment: customer name, cash amount, cart items once real backend exists.

Use Laravel validation errors through Inertia rather than duplicating all validation only in Zod. Zod can remain for instant client feedback, but backend validation should be source of truth.

## Navigation/Menu Structure

Admin layout menu from `src/components/layouts/AdminLayout.tsx`:

- Dashboard -> `/admin`
- Kelola Menu -> `/admin/menu`
- Kelola Outlet -> `/admin/outlets`
- Kelola Stok -> `/admin/stock`
- Transaksi -> `/admin/transactions`
- Laporan -> `/admin/reports`
- Kelola Akun -> `/admin/users`
- Pengaturan -> `/admin/settings`

Customer layout menu from `src/components/layouts/CustomerLayout.tsx`:

- Menu -> `/app`
- Pesanan -> `/app/orders`
- Profil -> `/app/profile`
- Header cart link points to `/app/cart`, but no route exists. TODO: either create a cart page or remove/replace with cart dialog behavior.

Cashier layout menu from `src/components/layouts/CashierLayout.tsx`:

- Pesanan Masuk -> `/cashier`
- Riwayat Transaksi -> `/cashier/transactions`
- Pembayaran Tunai -> `/cashier/cash-payment`

## Layout Migration Notes

- Convert layouts to accept `children` instead of rendering `<Outlet />`.
- Replace `react-router-dom` `Link` with `@inertiajs/react` `Link`.
- Replace `useLocation()` active checks with Laravel route names, Ziggy `route().current(...)`, or `usePage().url`.
- Replace layout `useAuth()` with `usePage().props.auth.user`.
- Logout buttons should post to Laravel logout route.
- Keep responsive layout structure; it is already well-separated by role.

## Design Preservation Notes

- Preserve the CSS variables from `src/index.css`, especially `--primary`, `--background`, `--foreground`, `--border`, `--ring`, and shadows.
- Preserve shadcn `new-york` style assumptions from `components.json`.
- Keep `lucide-react` icons for visual consistency.
- Migrate assets from `src/assets/img` into Laravel/Vite asset paths and update imports:
  - `src/assets/img/Gemini_Generated_Image_egtq19egtq19egtq.png`
  - `src/assets/img/Logo_Universitas_Paramadna.png`
- Keep card/table/form/modal patterns consistent before redesigning. This migration is better treated as a technical rewrite first.

## Important TODOs Before Coding Migration

- Confirm exact backend ownership and contracts for all primary and backup endpoints.
- Confirm role names and permission semantics.
- Confirm transaction status semantics: frontend comments disagree in places about whether `payment_status = 2` means cancelled or completed.
- Decide cart persistence model for Inertia. Current cart exists only in `MenuList` state and checkout router state.
- Decide whether cashier cash payment is in scope; current implementation is mock only.
- Decide whether Outlet create/delete should be supported; current frontend has mock behavior.
- Decide whether report exports and detailed daily report are required; current frontend has TODO placeholders.
