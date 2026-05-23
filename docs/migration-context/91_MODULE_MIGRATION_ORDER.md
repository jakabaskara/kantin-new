# Module Migration Order

This file gives a prioritized migration order for the Laravel + Inertia + React rewrite. It cites existing frontend, .NET, and Laravel API source paths from the migration context docs. Do not treat target class names as already implemented.

## Priority 0 - Foundation, Auth Shell, And Design Tokens

| Field | Detail |
| --- | --- |
| Module name | Foundation, auth shell, shared UI/layouts |
| Existing frontend files | `src/index.css`, `tailwind.config.js`, `components.json`, `src/main.tsx`, `src/App.tsx`, `src/components/ui/*`, `src/components/layouts/AuthLayout.tsx`, `AdminLayout.tsx`, `CustomerLayout.tsx`, `CashierLayout.tsx`, `src/pages/Unauthorized.tsx`, `src/lib/utils.ts`, `src/lib/image-utils.ts` |
| Existing .NET files | `Program.cs`, `Controllers/AuthController.cs`, `Middleware/TokenRevocationMiddleware.cs`, `Model/User.cs`, `Model/UserToken.cs` |
| Existing Laravel API files if related | `app/Http/Middleware/CheckDotnetToken.php` only for compatibility notes |
| Target Laravel routes | `GET /login`, `POST /login`, `GET /register`, `POST /register`, `POST /logout`, `GET /unauthorized`, role-protected `/admin`, `/app`, `/cashier` groups |
| Target controller | `Auth\AuthenticatedSessionController`, `Auth\RegisteredUserController`, optional `Auth\UnauthorizedController` |
| Target models | `User`, optional transitional `UserToken` or Sanctum tokens only if compatibility is required |
| Target Inertia pages | `Pages/Auth/Login.tsx`, `Pages/Auth/Register.tsx`, `Pages/Auth/Unauthorized.tsx`; layouts under `Layouts/*` |
| API behavior | Convert to Inertia/session auth. Keep token API only if old clients still need it. |
| Complexity level | High |
| Migration risks | Role aliases conflict; frontend localStorage JWT must be removed carefully; `GuestRoute` and login redirect behavior disagree for cashier users; UI may drift if tokens/components are not copied first. |
| Suggested first task prompt | "Set up the Laravel Inertia auth shell without porting business modules: migrate CSS variables/UI primitives/layouts, implement session login/register/logout routes and shared `auth.user` props, preserving the existing React UI palette and role redirects." |

## Priority 1 - User And Role Management

| Field | Detail |
| --- | --- |
| Module name | Admin user/account management |
| Existing frontend files | `src/pages/admin/UserManagement.tsx`, `src/services/user.service.ts`, `src/types/auth.types.ts` |
| Existing .NET files | `Controllers/UserController.cs`, `DTO/UserCreateDto.cs`, `DTO/UserUpdateDto.cs`, `DTO/UserDto.cs`, `Model/User.cs` |
| Existing Laravel API files if related | `app/Models/User.php` is starter-only and not aligned with .NET `Users` |
| Target Laravel routes | `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users/{user}`, `DELETE /admin/users/{user}` |
| Target controller | `Admin\UserController` |
| Target models | `User`, `Outlet` |
| Target Inertia pages | `Pages/Admin/Users/Index.tsx` |
| API behavior | Convert `/User` CRUD to Inertia page props and Inertia `useForm` submissions. |
| Complexity level | Medium |
| Migration risks | Password update rules differ; username uniqueness is controller-only in .NET and must become DB + validation constraint; cashier outlet assignment only applies to role `Cashier`; role aliases need a decision. |
| Suggested first task prompt | "Migrate admin user management from .NET `/User` into Laravel Inertia using `Admin\UserController`, Form Requests, `UserPolicy`, Eloquent relationships to outlets, and the existing `UserManagement.tsx` UI." |

## Priority 2 - Outlets

| Field | Detail |
| --- | --- |
| Module name | Outlet management and outlet lookup |
| Existing frontend files | `src/pages/admin/OutletManagement.tsx`, `src/services/outlet.service.ts`, `src/components/layouts/CustomerLayout.tsx`, `src/components/layouts/CashierLayout.tsx` |
| Existing .NET files | `Controllers/OutletsController.cs`, `DTO/OutletCreateDto.cs`, `DTO/OutletUpdateDto.cs`, `DTO/OutletDto.cs`, `Model/Outlet.cs` |
| Existing Laravel API files if related | `app/Models/Outlets.php`; `ApiController@outletTransactionList` validates outlet existence |
| Target Laravel routes | `GET /admin/outlets`, `POST /admin/outlets`, `PATCH /admin/outlets/{outlet}`; optional `GET /outlets` JSON only if still needed |
| Target controller | `Admin\OutletController`; optional `OutletController` for shared lookup |
| Target models | `Outlet`, `User`, `MenuItem`, `Transaction` |
| Target Inertia pages | `Pages/Admin/Outlets/Index.tsx` |
| API behavior | Convert list/update to Inertia. Create/delete are currently mock-only in frontend; implement only after business confirmation. |
| Complexity level | Medium |
| Migration risks | Current frontend create/delete only show toasts; .NET has create but no delete endpoint; non-admin outlet update behavior exists in .NET and needs a policy decision; QRIS image URL must be preserved. |
| Suggested first task prompt | "Migrate outlet listing and QRIS URL update into Laravel Inertia, keeping create/delete clearly marked as unsupported or implementing them only if the business confirms the existing mock UI should become real." |

## Priority 3 - Menu Catalog And Images

| Field | Detail |
| --- | --- |
| Module name | Menu CRUD and image upload |
| Existing frontend files | `src/pages/admin/MenuManagement.tsx`, `src/pages/customer/MenuList.tsx`, `src/services/menu.service.ts`, `src/lib/image-utils.ts` |
| Existing .NET files | `Controllers/MenuController.cs`, `DTO/MenuItemCreateDto.cs`, `DTO/MenuItemUpdateDto.cs`, `DTO/MenuItemDto.cs`, `Model/MenuItem.cs`, `Model/Stock.cs` |
| Existing Laravel API files if related | `app/Models/MenuItems.php` used by transaction item responses |
| Target Laravel routes | `GET /admin/menu`, `POST /admin/menu`, `PATCH /admin/menu/{menuItem}`, `DELETE /admin/menu/{menuItem}`, `GET /app` for customer menu props |
| Target controller | `Admin\MenuItemController`, `Customer\MenuController` |
| Target models | `MenuItem`, `Outlet`, `Stock`, `TransactionItem` |
| Target Inertia pages | `Pages/Admin/Menu/Index.tsx`, `Pages/Customer/Menu/Index.tsx` |
| API behavior | Admin CRUD converts to Inertia forms. Customer menu list becomes web controller props. Keep JSON only for dynamic filters if needed. |
| Complexity level | High |
| Migration risks | Multipart image upload must preserve extension/size rules; .NET deletes old uploaded local image on replace; initial stock creation must be transactional; Laravel backup model has `StockId` fillable but .NET suggests `Stocks.MenuItemId`, so DB schema must be confirmed. |
| Suggested first task prompt | "Migrate menu CRUD and customer menu index into Laravel Inertia, including image storage, initial stock sync, and server-provided `menus`/`outlets` props while preserving existing card/dialog styling." |

## Priority 4 - Stock Management

| Field | Detail |
| --- | --- |
| Module name | Admin stock management |
| Existing frontend files | `src/pages/admin/StockManagement.tsx`, `src/services/report.service.ts`, `src/services/menu.service.ts` |
| Existing .NET files | `Controllers/ReportsController.cs` (`StockByOutlet`), `Controllers/MenuController.cs` update stock path, `Model/Stock.cs` |
| Existing Laravel API files if related | No `Stock` model exists in backup Laravel API |
| Target Laravel routes | `GET /admin/stock`, `GET /admin/outlets/{outlet}/stock` optional JSON/partial reload, `PATCH /admin/menu/{menuItem}/stock` |
| Target controller | `Admin\StockController` or `Admin\OutletStockController` |
| Target models | `Stock`, `MenuItem`, `Outlet` |
| Target Inertia pages | `Pages/Admin/Stock/Index.tsx` |
| API behavior | Initial selected outlet stock as Inertia props; outlet filter can use Inertia query params, partial reload, or JSON. Stock updates use Inertia forms. |
| Complexity level | Medium |
| Migration risks | Stock table relationship is ambiguous without real DB inspection; transaction/payment flows currently disagree about whether stock changes during checkout; avoid stock decrement logic here until order strategy is settled. |
| Suggested first task prompt | "Migrate admin stock page with outlet filtering and stock update Form Requests, using Eloquent `MenuItem`/`Stock` relationships and preserving the current table/dialog UI." |

## Priority 5 - Customer Menu, Cart, And Checkout State

| Field | Detail |
| --- | --- |
| Module name | Customer menu browsing, cart, checkout page state |
| Existing frontend files | `src/pages/customer/MenuList.tsx`, `src/pages/customer/CheckoutPage.tsx`, `src/components/layouts/CustomerLayout.tsx` |
| Existing .NET files | `Controllers/MenuController.cs`, `Controllers/OutletsController.cs` for menu/outlet data |
| Existing Laravel API files if related | `ApiController@createTransaction` receives checkout payload |
| Target Laravel routes | Implemented interim flow: `GET /app`, `GET /app/orders`, `POST /app/orders`; future payment flow may add `GET /app/checkout` and payment endpoints |
| Target controller | `Customer\MenuController`, `Customer\OrderController` |
| Target models | `MenuItem`, `Outlet`, `Transaction`, `TransactionItem`, `PaymentAttempt` |
| Target Inertia pages | `Pages/Customer/Menu/Index.tsx`, `Pages/Customer/Orders/Index.tsx`; future `Pages/Customer/Checkout.tsx` only when payment gateway migration resumes |
| API behavior | Menu/outlets convert to Inertia props. Current interim checkout is an Inertia form to `POST /app/orders` that bypasses Midtrans, creates a local paid transaction, decrements stock, and redirects to customer order tracking. Future Midtrans checkout must preserve Snap compatibility fields without replacing this documented interim behavior silently. |
| Complexity level | High |
| Migration risks | Current cart is page-local state and reload loses cart. Customer orders must enforce one outlet per order, calculate prices server-side, and decrement stock transactionally. Payment gateway is intentionally bypassed for now; do not mix this bypass with Midtrans webhook behavior. |
| Suggested first task prompt | "Harden customer self-order UX: keep the Inertia cart mobile-friendly, submit to `Customer\OrderController@store`, bypass Midtrans only while payment migration is paused, and show order tracking with polling." |

## Priority 6 - Payment Gateway And Order Creation

| Field | Detail |
| --- | --- |
| Module name | Midtrans payment initiation, retry, callback/webhook |
| Existing frontend files | `src/pages/customer/CheckoutPage.tsx`, `src/pages/customer/OrderTracking.tsx` |
| Existing .NET files | `Controllers/PaymentController.cs`, `Service/MidtransSnapService.cs`, `Controllers/TransactionsController.cs` legacy/incomplete payment pieces |
| Existing Laravel API files if related | `app/Http/Controllers/ApiController.php`, `config/services.php`, `routes/api.php`, `app/Models/Transaction.php`, `app/Models/TransactionItem.php` |
| Target Laravel routes | `POST /orders`, `POST /orders/{transaction}/payment/refresh-snap`, `GET /payments/midtrans/finish`, `POST /webhooks/midtrans` |
| Target controller | `Customer\OrderController`, `Customer\PaymentController`, `Payment\MidtransFinishController`, `Payment\MidtransNotificationController` |
| Target models | `Transaction`, `TransactionItem`, `PaymentAttempt`, `PaymentNotification`, `MenuItem`, `Stock` |
| Target Inertia pages | Used by `Pages/Customer/Checkout.tsx` and `Pages/Customer/Orders/Show.tsx` |
| API behavior | Keep payment creation/refresh as JSON or Inertia action returning `snap_redirect_url`. Webhook remains API/public secured route. |
| Complexity level | Very high |
| Migration risks | Current callback is unsafe; status semantics conflict; retry order ids are not stored; current total trusts client unit price; no stock update in backup API; old frontend depends on exact response fields. |
| Suggested first task prompt | "Extract the existing Laravel backup Midtrans flow into Laravel services/actions with compatibility response fields, add payment attempt persistence, and introduce a signed Midtrans notification route without changing the customer UI yet." |

## Priority 7 - Customer Orders

| Field | Detail |
| --- | --- |
| Module name | Customer order history, order tracking, payment retry |
| Existing frontend files | `src/pages/customer/OrderHistory.tsx`, `src/pages/customer/OrderTracking.tsx` |
| Existing .NET files | `Controllers/TransactionsController.cs`, `TransactionStatusController.cs` intended transaction reads/status |
| Existing Laravel API files if related | `ApiController@userTransactionList`, `ApiController@checkTransactionStatus`, `ApiController@refreshSnapToken` |
| Target Laravel routes | `GET /app/orders`, `GET /app/orders/{transaction}`, `GET /api/orders/{transaction}` optional polling, `POST /orders/{transaction}/payment/refresh-snap` |
| Target controller | `Customer\OrderController`, `Customer\PaymentController` |
| Target models | `Transaction`, `TransactionItem`, `PaymentAttempt`, `MenuItem`, `Outlet` |
| Target Inertia pages | `Pages/Customer/Orders/Index.tsx`, `Pages/Customer/Orders/Show.tsx` |
| API behavior | Initial order list/show as Inertia props. Current customer orders use Inertia polling/partial reload and session-scoped reads. Payment retry remains TODO until Midtrans resumes. |
| Complexity level | High |
| Migration risks | Existing `/transactions/user` accepts arbitrary `user_id`; target must scope to session user. Existing `/transactions/status` accepts arbitrary `transaction_id`; target must enforce policy. `payment_status` field must remain available until UI is refactored. |
| Suggested first task prompt | "Improve customer order history/tracking with pagination or detail view, preserving session scoping and the current status timeline; keep payment retry marked TODO until Midtrans resumes." |

## Priority 8 - Cashier Orders And Transactions

| Field | Detail |
| --- | --- |
| Module name | Cashier incoming orders, status updates, transaction history |
| Existing frontend files | `src/pages/cashier/OrdersIncoming.tsx`, `src/pages/cashier/DailyTransactions.tsx`, `src/services/cashier.service.ts`, `src/components/layouts/CashierLayout.tsx` |
| Existing .NET files | `Controllers/TransactionStatusController.cs`, `Controllers/TransactionsController.cs`, `Hubs/TransactionHub.cs` |
| Existing Laravel API files if related | `ApiController@outletTransactionList`, `ApiController@cashierUpdateTransactionStatus`, `ApiController@checkTransactionStatus` |
| Target Laravel routes | `GET /cashier`, `GET /cashier/transactions`, `GET /api/cashier/orders` optional polling, `PATCH /cashier/orders/{transaction}/status` |
| Target controller | `Cashier\OrderController`, `Cashier\TransactionController`, `Cashier\OrderStatusController` |
| Target models | `Transaction`, `TransactionItem`, `Outlet`, `User` |
| Target Inertia pages | `Pages/Cashier/Orders/Incoming.tsx`, `Pages/Cashier/Transactions/Index.tsx` |
| API behavior | Initial pages as Inertia props. Current incoming orders use Inertia polling/partial reload and `PATCH /cashier/orders/{transaction}/status`; webhook remains separate. |
| Complexity level | High |
| Migration risks | Current outlet query accepts arbitrary `outlet_id`; status update only validates outlet if the client sends it; `is_all_transaction=false` means only `Status=1`; exact meaning of `Status=2` is TODO. |
| Suggested first task prompt | "Add cashier transaction history with pagination and filters, building on the implemented incoming order polling/status update flow and preserving outlet-scoped policies." |

## Priority 9 - Admin Transactions, Dashboard, And Reports

| Field | Detail |
| --- | --- |
| Module name | Admin dashboard, transaction list/detail, reports |
| Existing frontend files | `src/pages/admin/Dashboard.tsx`, `src/pages/admin/TransactionsList.tsx`, `src/pages/admin/ReportsPage.tsx`, `src/services/report.service.ts` |
| Existing .NET files | `Controllers/TransactionsController.cs`, `Controllers/ReportsController.cs`, `DTO/TransactionDto.cs`, `DTO/TransactionItemDto.cs` |
| Existing Laravel API files if related | `ApiController@transactionList` exists but frontend admin docs point to .NET `/Transactions` |
| Target Laravel routes | `GET /admin`, `GET /admin/transactions`, `GET /admin/reports`, `GET /admin/reports/sales/daily` optional partial/API |
| Target controller | `Admin\DashboardController`, `Admin\TransactionController`, `Admin\ReportController` |
| Target models | `Transaction`, `TransactionItem`, `Outlet`, `User`, `MenuItem` |
| Target Inertia pages | `Pages/Admin/Dashboard.tsx`, `Pages/Admin/Transactions/Index.tsx`, `Pages/Admin/Reports/Index.tsx` |
| API behavior | Convert read-heavy views to Inertia props. Use query params/partial reload for report dates. Export remains TODO unless specified. |
| Complexity level | Medium to high |
| Migration risks | .NET `GetAll` currently returns debug output before intended query; dashboard transaction queries are disabled in frontend; report export and detailed daily report are placeholders. Timezone is unclear: .NET uses UTC, users are likely Asia/Jakarta. |
| Suggested first task prompt | "Migrate admin transactions and reports as server-propped Inertia pages, preserving current UI while explicitly marking dashboard/export behaviors that were disabled or placeholder in the React app." |

## Priority 10 - Cash Payment

| Field | Detail |
| --- | --- |
| Module name | Manual cash payment |
| Existing frontend files | `src/pages/cashier/CashPayment.tsx` |
| Existing .NET files | `Controllers/TransactionsController.cs` has COD/QRIS transaction creation with payment proof rules, but no current frontend call |
| Existing Laravel API files if related | None active; backup API always stores `PaymentMethod = QRIS` in `createTransaction` |
| Target Laravel routes | `GET /cashier/cash-payment`, `POST /cashier/cash-payment` or `POST /cashier/orders/cash` |
| Target controller | `Cashier\CashPaymentController` |
| Target models | `Transaction`, `TransactionItem`, `MenuItem`, `Stock`, `Outlet` |
| Target Inertia pages | `Pages/Cashier/CashPayment.tsx` |
| API behavior | Confirmed Inertia form submission. Server calculates prices, total, and change; stock decrements inside a DB transaction; receipt is returned as a page prop for printing. |
| Complexity level | Medium |
| Migration risks | Cashier outlet scoping is mandatory; never trust client `unit_price`, `outlet_id`, or totals; prevent insufficient stock; do not mix this manual COD flow with Midtrans Snap/payment attempt behavior. |
| Suggested first task prompt | "Finish cashier manual cash payment: accept cash received amount, calculate server-side total/change, decrement outlet-scoped stock transactionally, show printable receipt, and add tests without touching Midtrans." |

## Priority 11 - Settings And Cleanup

| Field | Detail |
| --- | --- |
| Module name | Settings, unused pages, compatibility cleanup |
| Existing frontend files | Inline `/admin/settings` placeholder in `src/App.tsx`, `src/pages/Home.tsx`, `src/pages/About.tsx`, `src/components/layouts/DashboardLayout.tsx` |
| Existing .NET files | None specific |
| Existing Laravel API files if related | `GET /api/testing`, `POST /api/midtrans/snap` test/helper |
| Target Laravel routes | `GET /admin/settings` if still desired; remove or local-only debug routes |
| Target controller | `Admin\SettingsController` optional |
| Target models | TODO |
| Target Inertia pages | `Pages/Admin/Settings.tsx` optional |
| API behavior | Remove/restrict test endpoints. |
| Complexity level | Low |
| Migration risks | Settings has no real requirements; debug payment helper may be unsafe if left public; unused pages should not distract from migration. |
| Suggested first task prompt | "Clean up placeholder routes and restrict/remove debug endpoints after core migration is complete, without adding settings behavior until requirements exist." |
