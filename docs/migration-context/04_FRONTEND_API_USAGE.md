# Frontend API Usage

## API Client Setup

### Primary Shared Client

- File: `src/lib/axios.ts`
- Instance: `api = axios.create({ baseURL: env.apiBaseUrl, headers: { 'Content-Type': 'application/json' } })`
- Base URL source: `src/config/env.ts`
  - `env.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api-kantin.jackserver.site/api'`
  - `.env`: `VITE_API_BASE_URL=https://api-kantin.jackserver.site/api`
- Auth header: request interceptor reads `localStorage.getItem('token')` and sets `Authorization: Bearer ${token}`.
- Response interceptor logs `API Error: {url} - Status: {status}` and rejects. Auto logout is explicitly disabled in comments.
- Backend ownership: likely `.NET backend utama` because endpoint casing is PascalCase-ish (`/Auth/login`, `/Menu`, `/Outlets`, `/Reports/...`). Marked as Assumption until backend is inspected.

### Backup/Special API Calls

- File: `src/config/env.ts`
  - `env.backupApiUrl = import.meta.env.BACKUP_API_URL || 'https://api.jackserver.site/api'`
  - `.env`: `BACKUP_API_URL=https://api.jackserver.site/api`
- Used by:
  - `src/services/cashier.service.ts`
  - `src/pages/customer/CheckoutPage.tsx`
  - `src/pages/customer/OrderHistory.tsx`
  - `src/pages/customer/OrderTracking.tsx`
- Auth header: direct Axios calls manually set `Authorization: Bearer ${token}` and `Content-Type: application/json`.
- Backend ownership: likely Laravel special/payment API because comments mention Laravel API and Midtrans. Marked as Assumption until that project is inspected.

## Endpoint Inventory

| Method | Endpoint | Base | Request Payload/Params | Response Usage | Files Where Called | Backend Ownership |
| --- | --- | --- | --- | --- | --- | --- |
| `POST` | `/Auth/login` | `env.apiBaseUrl` | `{ username, password }` | Expects `{ token }`; token is decoded into user and stored | `src/services/auth.service.ts`, via `src/hooks/useAuth.ts` | Assumption: .NET |
| `POST` | `/Auth/register` | `env.apiBaseUrl` | `RegisterRequest` plus forced `role: 'Customer'` | Response only logged; no auto-login | `src/services/auth.service.ts`, via `src/hooks/useAuth.ts` | Assumption: .NET |
| `POST` | `/Auth/logout` | `env.apiBaseUrl` | None | Called in service but current `useAuth.logout()` does not call it | `src/services/auth.service.ts` | Assumption: .NET |
| `GET` | `/Menu` | `env.apiBaseUrl` | None | Returns `MenuItem[]` for menu list/admin/stock | `src/services/menu.service.ts` | Assumption: .NET |
| `GET` | `/Menu/{id}` | `env.apiBaseUrl` | Path `id` | Returns `MenuItem` | `src/services/menu.service.ts` | Assumption: .NET |
| `POST` | `/Menu` | `env.apiBaseUrl` | `multipart/form-data`: `Name`, `Description?`, `Price`, `OutletId`, `InitialStockQuantity?`, `ImageFile?`, `ImageUrl?` | Returns created `MenuItem`; invalidates `menus` query | `src/services/menu.service.ts`, `src/pages/admin/MenuManagement.tsx` | Assumption: .NET |
| `PUT` | `/Menu/{id}` | `env.apiBaseUrl` | `multipart/form-data`: `Name`, `Description?`, `Price?`, `StockQuantity?`, `ImageFile?`, `ImageUrl?` | No body used; invalidates `menus`/`stock` | `src/services/menu.service.ts`, `src/pages/admin/MenuManagement.tsx`, `src/pages/admin/StockManagement.tsx` | Assumption: .NET |
| `DELETE` | `/Menu/{id}` | `env.apiBaseUrl` | Path `id` | No body used; invalidates `menus` | `src/services/menu.service.ts`, `src/pages/admin/MenuManagement.tsx` | Assumption: .NET |
| `GET` | `/Outlets` | `env.apiBaseUrl` | None | Returns `Outlet[]` for filters/forms/layout data | `src/services/outlet.service.ts` | Assumption: .NET |
| `GET` | `/Outlets/{id}` | `env.apiBaseUrl` | Path `id` | Returns `Outlet` | `src/services/outlet.service.ts` | Assumption: .NET |
| `PUT` | `/Outlets/{id}` | `env.apiBaseUrl` | `OutletUpdateDto`: `{ name?, qrisImageUrl? }` | No body used; invalidates `outlets` | `src/services/outlet.service.ts`, `src/pages/admin/OutletManagement.tsx` | Assumption: .NET |
| `GET` | `/Reports/sales/daily` | `env.apiBaseUrl` | Query `{ date: date.toISOString() }` if selected | Response assigned to incorrectly named `isLoading`; detail report UI placeholder only | `src/services/report.service.ts`, `src/pages/admin/ReportsPage.tsx` | Assumption: .NET |
| `GET` | `/Reports/stock/byoutlet/{outletId}` | `env.apiBaseUrl` | Path `outletId` | Returns `MenuItem[]` for stock table | `src/services/report.service.ts`, `src/pages/admin/StockManagement.tsx` | Assumption: .NET |
| `GET` | `/Transactions` | `env.apiBaseUrl` | None | Returns `TransactionDto[]` for admin transactions/reports; dashboard queries disabled | `src/services/report.service.ts`, `src/pages/admin/TransactionsList.tsx`, `src/pages/admin/ReportsPage.tsx`, `src/pages/admin/Dashboard.tsx` | Assumption: .NET |
| `GET` | `/Transactions/recent` | `env.apiBaseUrl` | Query `{ count }`, default 5 | Returns `TransactionDto[]`; dashboard query disabled | `src/services/report.service.ts`, `src/pages/admin/Dashboard.tsx` | Assumption: .NET |
| `GET` | `/Transactions/{id}` | `env.apiBaseUrl` | Path `id` | Returns `TransactionDto`; no current page usage detected | `src/services/report.service.ts` | Assumption: .NET |
| `GET` | `/User` | `env.apiBaseUrl` | None | Returns `UserDto[]` for user management | `src/services/user.service.ts`, `src/pages/admin/UserManagement.tsx` | Assumption: .NET |
| `GET` | `/User/{id}` | `env.apiBaseUrl` | Path `id` | Returns `UserDto`; no current page usage detected | `src/services/user.service.ts` | Assumption: .NET |
| `POST` | `/User` | `env.apiBaseUrl` | `UserCreateDto`: `{ username, password, role, fullName?, outletId? }` | Returns `UserDto`; invalidates `users` | `src/services/user.service.ts`, `src/pages/admin/UserManagement.tsx` | Assumption: .NET |
| `PUT` | `/User/{id}` | `env.apiBaseUrl` | `UserUpdateDto`: `{ username, password?, role, fullName?, outletId? }` | No body used; invalidates `users` | `src/services/user.service.ts`, `src/pages/admin/UserManagement.tsx` | Assumption: .NET |
| `DELETE` | `/User/{id}` | `env.apiBaseUrl` | Path `id` | No body used; invalidates `users` | `src/services/user.service.ts`, `src/pages/admin/UserManagement.tsx` | Assumption: .NET |
| `GET` | `/transactions/outlet` | `env.backupApiUrl` | Query: `outlet_id`, `page`, `limit`, `is_all_transaction`, optional `status` | Returns `{ status, data, pagination }`; mapped to cashier orders/history | `src/services/cashier.service.ts`, `src/pages/cashier/OrdersIncoming.tsx`, `src/pages/cashier/DailyTransactions.tsx` | Assumption: Laravel special API |
| `POST` | `/cashierUpdateTransactionStatus` | `env.backupApiUrl` | `{ transaction_id, status, outlet_id? }` | Returns `{ status, message, data }`; used to mark cashier order completed | `src/services/cashier.service.ts`, `src/pages/cashier/OrdersIncoming.tsx` | Assumption: Laravel special API |
| `GET` | `/transactions/status` | `env.backupApiUrl` | Query `{ transaction_id }` | Returns transaction detail; service returns `response.data.data`; customer tracking uses full response | `src/services/cashier.service.ts`, `src/pages/customer/OrderTracking.tsx`, `src/pages/cashier/DailyTransactions.tsx` | Assumption: Laravel special API |
| `POST` | `/transactions` | `env.backupApiUrl` | `{ customer_name, email, phone, outlet_id, current_outlet_id, current_user_id, items: [{ menu_item_id, quantity, unit_price, name }] }` | Expects `status === 'success'`, `transaction_id`, `order_id`, `total_amount`, `snap_redirect_url`; redirects browser to Midtrans | `src/pages/customer/CheckoutPage.tsx` | Assumption: Laravel special/payment API |
| `GET` | `/transactions/user` | `env.backupApiUrl` | Query `{ user_id, limit: 100 }` | Expects `{ status: 'success', data: [...] }`; order list; polled every 10s | `src/pages/customer/OrderHistory.tsx` | Assumption: Laravel special API |
| `POST` | `/transactions/refresh-snap` | `env.backupApiUrl` | `{ transaction_id }` | Expects `status === 'success'` and `snap_redirect_url`; redirects browser | `src/pages/customer/OrderTracking.tsx` | Assumption: Laravel special/payment API |

## Non-API Or Mock Behavior

- `src/pages/admin/OutletManagement.tsx`
  - Create outlet: logs and shows success toast only.
  - Delete outlet: logs and shows success toast only.
- `src/pages/cashier/CashPayment.tsx`
  - Uses hardcoded `menuItems` array.
  - Submit logs `transactionData` and shows success toast only.
- `src/pages/admin/ReportsPage.tsx`
  - Export PDF/Excel show informational toasts only.
  - Detailed daily report is placeholder text.
- `src/pages/admin/Dashboard.tsx`
  - Queries for recent/all transactions exist but are disabled with `enabled: false`, so stats render from empty arrays unless enabled later.

## Request/Response Type References

- Auth types: `src/types/auth.types.ts`.
- Menu/outlet/transaction/report types: `src/types/api.types.ts`.
- Cashier backup response types: `src/services/cashier.service.ts`.
- User DTO types: `src/services/user.service.ts`.

## Migration Notes

- For Inertia pages, prefer controller-provided props for read-heavy pages:
  - Admin menu/outlet/stock/users/transactions/reports.
  - Initial customer menu/outlet data.
  - Initial order tracking detail.
- Keep async JSON endpoints for:
  - Payment creation/refresh if redirect flow remains API-driven.
  - Polling order status/history.
  - Cashier order polling/status updates.
- TODO: Analyze `.NET` backend routes and Laravel special API routes to confirm endpoint casing, payload field names, and status semantics.
