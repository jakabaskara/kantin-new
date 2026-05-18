# Project Overview

## Existing Frontend Stack

- Build tool: Vite, configured by `vite.config.ts`.
- Language/runtime: React 19 + TypeScript.
- Router: `react-router-dom` v7 using declarative route objects in `src/App.tsx`.
- Server state: `@tanstack/react-query` with a shared `QueryClient` in `src/lib/react-query.ts`.
- Forms: `react-hook-form`, `@hookform/resolvers`, and `zod`.
- HTTP clients: shared Axios instance in `src/lib/axios.ts`, plus direct Axios calls for backup/payment-related endpoints.
- UI primitives: local shadcn-style components in `src/components/ui/*`, Radix primitives, `class-variance-authority`, `tailwind-merge`, `clsx`, and `lucide-react`.
- Notifications: `sonner`, mounted in `src/main.tsx`.
- Auth token parsing: `jwt-decode` in `src/services/auth.service.ts`.

## Main Libraries Used

| Area | Library | Where Found |
| --- | --- | --- |
| Routing | `react-router-dom` | `package.json`, `src/App.tsx` |
| Server state | `@tanstack/react-query` | `src/main.tsx`, `src/lib/react-query.ts`, pages under `src/pages/admin` and `src/pages/customer` |
| HTTP | `axios` | `src/lib/axios.ts`, `src/services/*`, direct calls in customer pages |
| Forms | `react-hook-form`, `zod`, `@hookform/resolvers` | auth pages, admin management pages, cashier cash page |
| UI primitives | Radix Dialog/Label/Select/Radio, shadcn-style local components | `components.json`, `src/components/ui/*` |
| Icons | `lucide-react` | layouts and pages |
| Toasts | `sonner` | `src/main.tsx`, `src/hooks/useAuth.ts`, pages |
| Styling | Tailwind CSS v4 with CSS variables | `src/index.css`, `tailwind.config.js`, class names throughout pages |

## Routing Approach

Routes are defined centrally in `src/App.tsx` using `BrowserRouter`, `Routes`, nested `Route`, and layout components with `<Outlet />`.

Top-level route groups:

- `/login`, `/register` inside `AuthLayout` and `GuestRoute`.
- `/app/*` inside `ProtectedRoute allowedRoles={["Customer", "Mahasiswa"]}` and `CustomerLayout`.
- `/admin/*` inside `ProtectedRoute allowedRoles={["Admin"]}` and `AdminLayout`.
- `/cashier/*` inside `ProtectedRoute allowedRoles={["Kasir", "Cashier"]}` and `CashierLayout`.
- `/unauthorized` standalone page.
- `/` redirects to `/login`.

`src/pages/Home.tsx`, `src/pages/About.tsx`, and `src/components/layouts/DashboardLayout.tsx` exist but are not mounted by `src/App.tsx`.

## State Management Approach

- No Redux/Zustand/context store was found.
- Server/cache state uses TanStack Query.
- Auth state is derived from `localStorage` on each `useAuth()` call.
- Cart state for customer ordering is local React state in `src/pages/customer/MenuList.tsx`; it is passed to checkout via React Router navigation state.
- Cashier order progress includes local UI status preservation in `src/pages/cashier/OrdersIncoming.tsx`.
- Some transaction data is stored in `localStorage` after checkout in `src/pages/customer/CheckoutPage.tsx`, but order history/tracking primarily reload from backup API.

## Styling Approach

- Tailwind v4 is imported from `src/index.css`.
- `src/index.css` defines shadcn-like CSS variables for colors, radius, fonts, shadows, and dark mode.
- `tailwind.config.js` is minimal and delegates theme tokens to CSS variables.
- UI primitives use shadcn-style `cva` variants and CSS variables.
- Page-level styling is mostly Tailwind utility classes with frequent hardcoded palette classes such as `slate`, `blue`, `green`, `red`, `orange`, and `yellow`.
- `src/App.css` appears to be Vite starter CSS and is not imported by `src/main.tsx`; treat it as legacy/unused unless later imports are added.

## Auth Approach From Frontend Perspective

- Login posts credentials to `/Auth/login` through the shared Axios instance.
- The returned JWT is decoded on the frontend to build the user object.
- `localStorage` keys used:
  - `token`
  - `user`
  - `outletId`
  - `fullName`
  - `order_{transaction_id}` after checkout
- The shared Axios instance adds `Authorization: Bearer <token>` to every request when `token` exists.
- Route protection is role-based in `src/components/auth/ProtectedRoute.tsx`.
- There is no frontend token-expiration check beyond whether `token` and `user` exist.
- The Axios response interceptor logs API errors but currently does not auto-logout on `401`.

## High-Level App Modules

- Auth: login/register/guest guard/protected guard.
- Customer:
  - Menu browsing, outlet filtering, cart dialog.
  - Checkout with Midtrans redirect through backup API.
  - Order history and order tracking with polling.
  - Profile display/logout.
- Admin:
  - Dashboard statistics and quick links.
  - Menu CRUD with image upload.
  - Outlet management; create/delete are mock-only from frontend.
  - Stock management.
  - Transaction list/detail.
  - Reports page with partial/TODO export behavior.
  - User/account CRUD.
- Cashier:
  - Incoming orders polling by outlet.
  - Transaction history.
  - Manual cash payment screen, currently mock/local only.

## Notes For Laravel + Inertia Migration

- Keep React component structure where possible: pages map naturally to Inertia page components.
- Replace `react-router-dom` route protection with Laravel middleware and shared Inertia auth props.
- Prefer Laravel controllers to provide initial page data for admin list pages and detail pages.
- Keep TanStack Query or plain Axios only for live/polling behavior, payment refresh, and cashier order updates.
- Replace `localStorage` JWT auth with Laravel session auth unless a token-based API remains required for external services.
- Preserve `src/components/ui/*` as reusable React UI primitives under `resources/js/Components/ui`.
- Preserve CSS variable tokens from `src/index.css` in the Inertia app entry CSS.
- TODO: Confirm backend ownership and contracts for `.NET` versus Laravel API endpoints by analyzing the backend projects.
