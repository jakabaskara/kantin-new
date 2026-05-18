# Frontend Routes And Pages

Routes are declared in `src/App.tsx`.

| Existing Route/Path | React Page/Component | Purpose | Required Data/API Calls | Auth Requirement If Detectable | Suggested Target Inertia Page | Suggested Laravel Route Name |
| --- | --- | --- | --- | --- | --- | --- |
| `/login` | `src/pages/auth/LoginPage.tsx` inside `src/components/layouts/AuthLayout.tsx` | Login form | `POST /Auth/login` via `authService.login` | Guest-only via `GuestRoute` | `resources/js/Pages/Auth/Login.tsx` | `login` |
| `/register` | `src/pages/auth/RegisterPage.tsx` inside `src/components/layouts/AuthLayout.tsx` | Customer registration | `POST /Auth/register` via `authService.register`; role forced to `Customer` | Guest-only via `GuestRoute` | `resources/js/Pages/Auth/Register.tsx` | `register` |
| `/app` | `src/pages/customer/MenuList.tsx` inside `CustomerLayout` | Customer menu browsing, search/filter, cart | `GET /Menu`, `GET /Outlets` via React Query | `Customer` or `Mahasiswa` | `resources/js/Pages/Customer/Menu/Index.tsx` | `customer.menu.index` |
| `/app/checkout` | `src/pages/customer/CheckoutPage.tsx` | Checkout current cart and redirect to Midtrans | Uses router state `cart`; `POST {BACKUP_API_URL}/transactions` direct Axios | `Customer` or `Mahasiswa` | `resources/js/Pages/Customer/Checkout.tsx` | `customer.checkout` |
| `/app/orders` | `src/pages/customer/OrderHistory.tsx` | Customer order history with filters and polling | `GET {BACKUP_API_URL}/transactions/user?user_id=&limit=100` direct Axios every 10s | `Customer` or `Mahasiswa` | `resources/js/Pages/Customer/Orders/Index.tsx` | `customer.orders.index` |
| `/app/orders/:orderId` | `src/pages/customer/OrderTracking.tsx` | Order status timeline, details, payment retry | `GET {BACKUP_API_URL}/transactions/status?transaction_id=...` direct Axios every 10s; `POST {BACKUP_API_URL}/transactions/refresh-snap` | `Customer` or `Mahasiswa` | `resources/js/Pages/Customer/Orders/Show.tsx` | `customer.orders.show` |
| `/app/profile` | `src/pages/customer/ProfilePage.tsx` | Show local user profile and logout | No API; reads `useAuth()` localStorage-derived user | `Customer` or `Mahasiswa` | `resources/js/Pages/Customer/Profile.tsx` | `customer.profile` |
| `/admin` | `src/pages/admin/Dashboard.tsx` inside `AdminLayout` | Admin dashboard stats and quick actions | Query definitions for `GET /Transactions/recent` and `GET /Transactions`, but both disabled with `enabled: false` | `Admin` | `resources/js/Pages/Admin/Dashboard.tsx` | `admin.dashboard` |
| `/admin/menu` | `src/pages/admin/MenuManagement.tsx` | Menu CRUD and image upload | `GET /Menu`, `GET /Outlets`, `POST /Menu`, `PUT /Menu/{id}`, `DELETE /Menu/{id}` | `Admin` | `resources/js/Pages/Admin/Menu/Index.tsx` | `admin.menu.index` |
| `/admin/outlets` | `src/pages/admin/OutletManagement.tsx` | Outlet list/edit QRIS URL; create/delete mocked | `GET /Outlets`, `PUT /Outlets/{id}`; create/delete are toast-only mocks | `Admin` | `resources/js/Pages/Admin/Outlets/Index.tsx` | `admin.outlets.index` |
| `/admin/stock` | `src/pages/admin/StockManagement.tsx` | Stock dashboard/table and update stock | `GET /Outlets`, `GET /Reports/stock/byoutlet/{outletId}` or `GET /Menu`, `PUT /Menu/{id}` | `Admin` | `resources/js/Pages/Admin/Stock/Index.tsx` | `admin.stock.index` |
| `/admin/transactions` | `src/pages/admin/TransactionsList.tsx` | Transaction stats, search, table, detail dialog | `GET /Transactions` | `Admin` | `resources/js/Pages/Admin/Transactions/Index.tsx` | `admin.transactions.index` |
| `/admin/reports` | `src/pages/admin/ReportsPage.tsx` | Sales report summary, date filter, export TODO | `GET /Reports/sales/daily?date=...`, `GET /Transactions`; export is TODO/toast only | `Admin` | `resources/js/Pages/Admin/Reports/Index.tsx` | `admin.reports.index` |
| `/admin/users` | `src/pages/admin/UserManagement.tsx` | User/account CRUD | `GET /User`, `GET /Outlets`, `POST /User`, `PUT /User/{id}`, `DELETE /User/{id}` | `Admin` | `resources/js/Pages/Admin/Users/Index.tsx` | `admin.users.index` |
| `/admin/settings` | Inline `<div>Settings (Coming Soon)</div>` | Placeholder settings page | None | `Admin` | `resources/js/Pages/Admin/Settings.tsx` | `admin.settings` |
| `/cashier` | `src/pages/cashier/OrdersIncoming.tsx` inside `CashierLayout` | Incoming orders by cashier outlet; polling and status updates | `GET {BACKUP_API_URL}/transactions/outlet`; `POST {BACKUP_API_URL}/cashierUpdateTransactionStatus` | `Kasir` or `Cashier` | `resources/js/Pages/Cashier/Orders/Incoming.tsx` | `cashier.orders.incoming` |
| `/cashier/transactions` | `src/pages/cashier/DailyTransactions.tsx` | Cashier transaction history | `GET {BACKUP_API_URL}/transactions/outlet`; per row `GET {BACKUP_API_URL}/transactions/status` | `Kasir` or `Cashier` | `resources/js/Pages/Cashier/Transactions/Index.tsx` | `cashier.transactions.index` |
| `/cashier/cash-payment` | `src/pages/cashier/CashPayment.tsx` | Manual cash payment form | No real API; uses hardcoded mock menu list and console log | `Kasir` or `Cashier` | `resources/js/Pages/Cashier/CashPayment.tsx` | `cashier.cash-payment` |
| `/unauthorized` | `src/pages/Unauthorized.tsx` | Access denied page | None | Public, used as role-denial target | `resources/js/Pages/Auth/Unauthorized.tsx` | `unauthorized` |
| `/` | `Navigate to="/login"` | Default redirect | None | Public | Redirect route/controller | `home` or redirect to `login` |

## Unmounted Pages/Layouts

| File | Notes |
| --- | --- |
| `src/pages/Home.tsx` | Simple sample page; not mounted in `src/App.tsx`. |
| `src/pages/About.tsx` | Simple sample page; not mounted in `src/App.tsx`. |
| `src/components/layouts/DashboardLayout.tsx` | Placeholder layout; not imported by `src/App.tsx`. |

## Route Migration Notes

- Use Laravel route groups with middleware such as `auth`, `role:Admin`, `role:Kasir`, and `role:Customer`.
- Use `Route::inertia()` only for simple static pages; prefer controllers for pages that need initial props.
- Inertia page names can follow the suggested file paths above; route names should be stable because frontend navigation can use Ziggy or generated route helpers.
- TODO: Confirm whether `Mahasiswa` remains a valid role in the target system. It appears only in `ProtectedRoute` for `/app`.
