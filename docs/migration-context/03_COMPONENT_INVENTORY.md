# Component Inventory

## Layout Components

| Component | File Path | Purpose | Props If Easy To Infer | Where Used | Migration Recommendation |
| --- | --- | --- | --- | --- | --- |
| `AdminLayout` | `src/components/layouts/AdminLayout.tsx` | Admin sidebar/mobile drawer layout with nav and logout | None | `/admin/*` route group in `src/App.tsx` | Reuse lightly; replace `react-router-dom` `Link`, `Outlet`, `useLocation` with Inertia `Link`, layout children, and URL matching helper. |
| `CustomerLayout` | `src/components/layouts/CustomerLayout.tsx` | Customer header, desktop sidebar, mobile bottom navigation, notification popover | None | `/app/*` route group | Reuse lightly; replace router APIs. TODO: `/app/cart` link exists but no route is declared. |
| `CashierLayout` | `src/components/layouts/CashierLayout.tsx` | Cashier sidebar/mobile drawer layout with outlet user panel | None | `/cashier/*` route group | Reuse lightly; replace router APIs and consume Inertia auth props. |
| `AuthLayout` | `src/components/layouts/AuthLayout.tsx` | Split auth screen with generated image background, particles, auth form card | None | `/login`, `/register` route group | Reuse lightly; replace `Outlet` with children. Confirm asset path after moving. |
| `DashboardLayout` | `src/components/layouts/DashboardLayout.tsx` | Placeholder user layout | None | Not mounted | Rewrite or delete after migration unless needed. |

## Auth Components

| Component | File Path | Purpose | Props If Easy To Infer | Where Used | Migration Recommendation |
| --- | --- | --- | --- | --- | --- |
| `ProtectedRoute` | `src/components/auth/ProtectedRoute.tsx` | Client-side auth/role guard using `useAuth` and redirects | `children`, `allowedRoles?: string[]` | `/app`, `/admin`, `/cashier` route groups | Replace with Laravel middleware and shared Inertia `auth.user` props. Keep only if building client-only guards for secondary UI states. |
| `GuestRoute` | `src/components/auth/GuestRoute.tsx` | Redirect authenticated user away from login/register | `children` | `/login`, `/register` | Replace with Laravel guest middleware and controller redirects. |

## Common Components

| Component | File Path | Purpose | Props If Easy To Infer | Where Used | Migration Recommendation |
| --- | --- | --- | --- | --- | --- |
| `Logo` | `src/components/common/Logo.tsx` | Logo image with text fallback | `className?: string` | Currently not active; commented in `AuthLayout` | Refactor lightly; fix asset path because it uses `/assets/img/...` while actual asset is under `src/assets/img`. |

## UI Primitives

These are shadcn-style components and can largely move as-is to `resources/js/Components/ui`.

| Component(s) | File Path | Purpose | Props If Easy To Infer | Where Used | Migration Recommendation |
| --- | --- | --- | --- | --- | --- |
| `Button`, `buttonVariants` | `src/components/ui/button.tsx` | Shared button with variants and sizes | `variant`, `size`, `asChild`, native button props | Used across almost every page/layout | Reuse as-is; ensure `cn` import path updates. |
| `Badge`, `badgeVariants` | `src/components/ui/badge.tsx` | Status/count badge | `variant`, HTML div props | Customer/cashier status chips, cart count, role badges | Reuse as-is. |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `src/components/ui/card.tsx` | Card container primitive | HTML div props | Admin/customer/cashier pages | Reuse as-is. |
| `Input` | `src/components/ui/input.tsx` | Styled input | Native input props | Auth/forms/search | Reuse as-is. |
| `Textarea` | `src/components/ui/textarea.tsx` | Styled textarea | Native textarea props | Checkout, admin forms | Reuse as-is. |
| `Label` | `src/components/ui/label.tsx` | Radix label wrapper | Radix label props | Forms | Reuse as-is. |
| `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField` | `src/components/ui/form.tsx` | React Hook Form wrappers | RHF controller props | Auth and admin CRUD forms | Reuse if keeping React Hook Form; for Inertia forms, either reuse labels/messages or refactor to Inertia `useForm`. |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, etc. | `src/components/ui/dialog.tsx` | Radix modal dialog | Radix dialog props | Admin CRUD, menu/cart/order detail dialogs | Reuse as-is. |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, etc. | `src/components/ui/select.tsx` | Radix select | Radix select props | Admin menu/stock/user forms | Reuse as-is. |
| `RadioGroup`, `RadioGroupItem` | `src/components/ui/radio-group.tsx` | Radix radio group | Radix radio props | No direct use detected in pages | Reuse only if needed. |
| `Alert`, `AlertTitle`, `AlertDescription` | `src/components/ui/alert.tsx` | Alert message box | `variant` default/destructive | No direct use detected in pages | Reuse as-is or replace inline error cards with it during cleanup. |
| `Particles` | `src/components/ui/particles.tsx` | Canvas particle background | `quantity`, `staticity`, `ease`, `size`, `refresh`, `color`, `vx`, `vy`, `className` | `AuthLayout` | Reuse if preserving auth visual; verify canvas performance and SSR/browser-only behavior under Inertia. |

## Page Components

| Component | File Path | Purpose | Key Props/Inputs | Where Used | Migration Recommendation |
| --- | --- | --- | --- | --- | --- |
| `LoginPage` | `src/pages/auth/LoginPage.tsx` | Login form | React Hook Form fields: `username`, `password` | `/login` | Refactor to Inertia `useForm` and Laravel login route. |
| `RegisterPage` | `src/pages/auth/RegisterPage.tsx` | Register form | `username`, `fullName`, `password`, `confirmPassword` | `/register` | Refactor to Inertia `useForm`; confirm registration role policy. |
| `MenuList` | `src/pages/customer/MenuList.tsx` | Menu browsing/cart | Local state: search, selected outlet, dialogs, cart | `/app` | Reuse UI; consider controller-provided `menus`/`outlets` props and local cart state. |
| `CheckoutPage` | `src/pages/customer/CheckoutPage.tsx` | Checkout and payment redirect | Router state `cart`; local notes/errors | `/app/checkout` | Refactor to route-backed checkout state or persisted cart; use Inertia form for transaction creation. |
| `OrderHistory` | `src/pages/customer/OrderHistory.tsx` | User order list with polling | `user.id`, filter state | `/app/orders` | Reuse UI; initial props from controller, keep polling async if real-time needed. |
| `OrderTracking` | `src/pages/customer/OrderTracking.tsx` | Status timeline/payment retry | `orderId` route param | `/app/orders/:orderId` | Reuse UI; controller provides initial order; keep refresh-snap async. |
| `ProfilePage` | `src/pages/customer/ProfilePage.tsx` | Profile summary and logout | Auth user | `/app/profile` | Reuse UI; consume Inertia `auth.user`. |
| `AdminDashboard` | `src/pages/admin/Dashboard.tsx` | Admin stats and quick actions | Disabled queries for transactions | `/admin` | Rewrite data wiring; reuse card layout. |
| `MenuManagement` | `src/pages/admin/MenuManagement.tsx` | Menu CRUD/image upload | Forms and dialogs | `/admin/menu` | Reuse UI; migrate mutations to Inertia forms or Laravel API endpoints. |
| `OutletManagement` | `src/pages/admin/OutletManagement.tsx` | Outlet list/edit QRIS | Create/delete are mock | `/admin/outlets` | Refactor; implement real Laravel create/delete or document as unsupported. |
| `StockManagement` | `src/pages/admin/StockManagement.tsx` | Stock table and update dialog | Outlet filter, stock form | `/admin/stock` | Reuse UI; controller props for initial data, async for filter/update. |
| `TransactionsList` | `src/pages/admin/TransactionsList.tsx` | Admin transaction table/detail | Search state, selected transaction | `/admin/transactions` | Reuse UI; controller-provided transactions is a natural fit. |
| `ReportsPage` | `src/pages/admin/ReportsPage.tsx` | Sales summary/report placeholder | Date filter, export TODO | `/admin/reports` | Refactor; fill missing report requirements after backend analysis. |
| `UserManagement` | `src/pages/admin/UserManagement.tsx` | User CRUD | Role/outlet fields | `/admin/users` | Reuse UI; Inertia forms for CRUD. |
| `OrdersIncoming` | `src/pages/cashier/OrdersIncoming.tsx` | Cashier active order polling/status updates | `user.outletId`; local status preservation | `/cashier` | Reuse UI; keep async polling or switch to broadcasting later. |
| `DailyTransactions` | `src/pages/cashier/DailyTransactions.tsx` | Cashier transaction history | `user.outletId` | `/cashier/transactions` | Reuse UI; controller initial props and async refresh. |
| `CashPayment` | `src/pages/cashier/CashPayment.tsx` | Manual cash transaction mock | Hardcoded menu items, local cart | `/cashier/cash-payment` | Rewrite data/API behavior; UI can be reused after real contract is known. |
| `Unauthorized` | `src/pages/Unauthorized.tsx` | Access denied page | None | `/unauthorized` | Reuse lightly. |

## Hooks And Utilities

| Item | File Path | Purpose | Where Used | Migration Recommendation |
| --- | --- | --- | --- | --- |
| `useAuth` | `src/hooks/useAuth.ts` | LocalStorage auth state, login/register mutations, logout | Guards, layouts, profile, checkout/order pages | Replace with Inertia shared props and Laravel auth actions. Some role redirect logic can move to backend. |
| `queryClient` | `src/lib/react-query.ts` | 5-minute stale time, retry once | Mounted in `src/main.tsx` | Keep only for pages retaining async API behavior. |
| `api` | `src/lib/axios.ts` | Shared Axios client with auth header interceptor | `.NET` service files | Replace or scope to remaining external API calls. |
| `cn` | `src/lib/utils.ts` | Merge class names | UI primitives/layouts | Reuse as-is. |
| `getMenuImageUrl`, `getFallbackImageUrl`, `getOutletImageUrl` | `src/lib/image-utils.ts` | Converts relative image paths to absolute API URLs or placeholders | Menu pages/order details/outlet images | Reuse with updated Laravel asset/storage URL rules. |
