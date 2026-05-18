# .NET API Contracts

Base route comes from `[Route("api/[controller]")]` unless noted. The frontend shared Axios base URL already includes `/api`, so frontend paths such as `/Auth/login` map to backend routes such as `/api/Auth/login`.

Auth caveat:

- `TokenRevocationMiddleware` requires a valid non-revoked bearer token for every request except `/api/auth/login` and `/api/auth/register`.
- Therefore, actions without `[Authorize]` are still effectively protected unless they are login/register.
- This is behavior, not necessarily ideal Laravel design.

## Endpoint Inventory

| Method | Backend Route | Controller/action | Request | Response | Auth/permission | Frontend match | Suggested Laravel route |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `POST` | `/api/Auth/register` | `AuthController.Register` | JSON `RegisterRequest` | `200 { message }` or `400 string` | Public; middleware skip. Username must be unique. `Cashier` requires `OutletId`. | `/Auth/register` in `src/services/auth.service.ts` | `POST /register` or `POST /api/auth/register` handled by `RegisteredUserController@store` or `AuthController@register` |
| `POST` | `/api/Auth/login` | `AuthController.Login` | JSON `LoginDto` | `200 { token }` or `401 string` | Public; middleware skip. Verifies BCrypt password. | `/Auth/login` in `src/services/auth.service.ts` | `POST /login` session auth for Inertia, or `POST /api/auth/login` if token API retained |
| `POST` | `/api/Auth/logout` | `AuthController.Logout` | No body | `200 { message }`, `404 { message }` | `[Authorize]`; revokes current token in `UserToken`. | `/Auth/logout` exists in `src/services/auth.service.ts` but current hook does not call it | `POST /logout` using Laravel session invalidation, or Sanctum token revoke |
| `GET` | `/api/Menu` | `MenuController.GetAll` | None | `MenuItemDto[]` | No attribute, but middleware requires bearer token. No role check. | `/Menu` in `src/services/menu.service.ts` | `GET /menu` or Inertia props via `MenuController@index` |
| `GET` | `/api/Menu/{id}` | `MenuController.GetById` | Path `id:int` | `MenuItemDto` or `404` | Bearer token by middleware. No role check. | `/Menu/{id}` in `src/services/menu.service.ts` | `GET /menu/{menuItem}` or `MenuController@show` |
| `POST` | `/api/Menu` | `MenuController.Create` | `multipart/form-data` `MenuItemCreateDto` | `201 MenuItemDto`, `400 ModelState/message` | Bearer token by middleware. No role check. | `/Menu` in `src/services/menu.service.ts`, `src/pages/admin/MenuManagement.tsx` | `POST /admin/menu` with `MenuItemStoreRequest` and policy/admin middleware |
| `PUT` | `/api/Menu/{id}` | `MenuController.Update` | `multipart/form-data` `MenuItemUpdateDto` | `204`, `400`, `404` | Bearer token by middleware. No role check. | `/Menu/{id}` in menu and stock admin pages | `PUT/PATCH /admin/menu/{menuItem}` with `MenuItemUpdateRequest` |
| `DELETE` | `/api/Menu/{id}` | `MenuController.Delete` | Path `id:int` | `204` or `404` | Bearer token by middleware. No role check. | `/Menu/{id}` in `src/pages/admin/MenuManagement.tsx` | `DELETE /admin/menu/{menuItem}` with admin policy |
| `GET` | `/api/Outlets` | `OutletsController.GetAll` | None | `OutletDto[]` including menu items and stock | Bearer token by middleware. No role check. | `/Outlets` in `src/services/outlet.service.ts` | `GET /outlets` or shared Inertia data |
| `GET` | `/api/Outlets/{id}` | `OutletsController.GetById` | Path `id:int` | `OutletDto` or `404` | Bearer token by middleware. No role check. | `/Outlets/{id}` in `src/services/outlet.service.ts` | `GET /outlets/{outlet}` |
| `POST` | `/api/Outlets` | `OutletsController.Create` | JSON `OutletCreateDto` | `201 OutletDto`, `401`, `400` | Bearer token by middleware. Action checks string claim `"role" == admin`. No `[Authorize]` attribute. | No active frontend call; create is mock-only in `src/pages/admin/OutletManagement.tsx` | `POST /admin/outlets` with admin middleware/policy |
| `PUT` | `/api/Outlets/{id}` | `OutletsController.UpdateOutlet` | JSON `OutletUpdateDto` | `200 string`, `401 { message }`, `404 string` | Admin can update any. Non-admin must have `"OutletId"` claim matching route id. | `/Outlets/{id}` in `src/services/outlet.service.ts`, admin outlet page | `PUT/PATCH /admin/outlets/{outlet}` or cashier outlet settings route with policy |
| `GET` | `/api/Reports/sales/daily?date=...` | `ReportsController.SalesDaily` | Query `date?: DateTime` | `{ Date, TotalOutlets, TotalSales, Details: [{ Outlet, Transactions, TotalSales }] }` | Bearer token by middleware. No role check. | `/Reports/sales/daily` in `src/services/report.service.ts`, reports page | `GET /admin/reports/sales/daily` or Inertia report action |
| `GET` | `/api/Reports/stock/byoutlet/{outletId}` | `ReportsController.StockByOutlet` | Path `outletId:int` | `MenuItemDto[]` | Bearer token by middleware. No role check. | `/Reports/stock/byoutlet/{outletId}` in stock page | `GET /admin/outlets/{outlet}/stock` |
| `POST` | `/api/Transactions` | `TransactionsController.Create` | `multipart/form-data` `TransactionFormDto`: `TransactionJson` plus optional `PaymentProof` | `200 { message, transactionId, totalAmount, paymentMethod, paymentProofPath }`, `400`, `401`, `500` | `[Authorize]`; code reads `"userId"` and `"role"` claims. Likely claim mismatch. | No current primary frontend match; customer checkout uses backup Laravel `/transactions` | `POST /orders` or `POST /transactions` with `StoreTransactionRequest`, service/action, DB transaction |
| `GET` | `/api/Transactions` | `TransactionsController.GetAll` | None | Currently returns debug object before transaction query | `[Authorize]`; intended role/user filtering unreachable because of early return. | `/Transactions` in report service, admin transactions/reports/dashboard | `GET /admin/transactions` with admin policy; fix debug behavior |
| `GET` | `/api/Transactions/{id}` | `TransactionsController.GetById` | Path `id:int` | `TransactionDto` or `401/404` | `[Authorize]`; intended admin all, cashier outlet, customer own. Code reads `"userId"` and `"role"` claims. | `/Transactions/{id}` in report service, no active page found | `GET /transactions/{transaction}` with policy |
| `GET` | `/api/Transactions/recent?count=5` | `TransactionsController.GetRecent` | Query `count:int = 5` | `TransactionDto[]` | `[Authorize]`; role filtering intended. Code reads `"userId"` and `"role"` claims. | `/Transactions/recent` in dashboard service, query currently disabled | `GET /admin/transactions/recent` or dashboard props |
| `DELETE` | `/api/Transactions/{id}` | `TransactionsController.Delete` | Path `id:int` | `200 { message }`, `401`, `404` | `[Authorize]`; restores stock for each item before delete. Code reads `"userId"` and `"role"` claims. | No current frontend call detected | Prefer status cancel route over hard delete; `DELETE /transactions/{transaction}` only if needed |
| `PUT` | `/api/transactions/status/{id}` | `TransactionStatusController.UpdateStatus` | JSON integer body `1..5` | `200 { message, status }`, `400`, `401`, `404` | `[Authorize]`; admin all, cashier own outlet, customer own transaction. Uses `ClaimTypes` claims. | Not matched; frontend backup API uses `POST /cashierUpdateTransactionStatus` | `PATCH /transactions/{transaction}/status` with policy and event |
| `POST` | `/api/payment/snap` | `PaymentController.CreateSnap` | No body | `MidtransSnapResponse { token, redirect_url }` | `[Authorize]`; reads `"username"`, `"userId"`, `"role"` claims. Uses hardcoded amount `75000`. Likely legacy/incomplete. | No current primary frontend match; payment uses backup Laravel API | Fold into Laravel payment/order action only if still required |
| WebSocket | `/transactionHub` | `TransactionHub` | SignalR access token via `access_token` query | Client can call `JoinOutletGroup(outletId)` and `LeaveOutletGroup(outletId)` | `[Authorize]`; JWT bearer configured to read token for this path | No frontend match found in existing docs | Laravel Echo/Reverb/Pusher channel `outlet.{id}` |

## DTO And Validation Details

### Auth

`DTO/LoginDto.cs`

- `Username: string`
- `Password: string`
- No DataAnnotations on login DTO.

Inline `RegisterRequest` in `Controllers/AuthController.cs`

- `Username: string`
- `Password: string`
- `Role: string = "Customer"`
- `FullName?: string`
- `OutletId?: int`
- Business rules:
  - Username must be unique.
  - If role is exactly `"Cashier"`, `OutletId` is required.
  - Password is BCrypt-hashed.

### Menu

`DTO/MenuItemCreateDto.cs`

- `Name`: required, max 100.
- `Description`: max 255, nullable.
- `Price`: range 0 to 100000.
- `OutletId`: required.
- `InitialStockQuantity`: optional, range 0 to 1000.
- `ImageFile`: optional upload.
- `ImageUrl`: optional max 255.
- Controller file validation:
  - `ImageFile` extensions: `.jpg`, `.jpeg`, `.png`, `.gif`.
  - request size limit: 10 MB.
  - uploaded file saved under `wwwroot/uploads/menu`.

`DTO/MenuItemUpdateDto.cs`

- `Name`: required, max 100.
- `Description`: max 255, nullable.
- `Price`: range 0 to 100000.
- `StockQuantity`: optional, range 0 to 1000.
- `ImageFile`: optional upload.
- `ImageUrl`: optional max 255.
- Same file validation as create.
- If uploaded file is supplied, old local `/uploads/menu/...` file is deleted.

Response `DTO/MenuItemDto.cs`

- `Id`
- `Name`
- `Description`
- `Price`
- `OutletId`
- `OutletName`
- `StockQuantity`
- `ImageUrl`

### Outlet

`DTO/OutletCreateDto.cs`

- `Name`: required, max 100.
- `Location`: optional, max 255.
- `QrisImageUrl`: optional, max 255.

`DTO/OutletUpdateDto.cs`

- `Name`: non-null string in C#, no DataAnnotations.
- `QrisImageUrl`: optional.

Response `DTO/OutletDto.cs`

- `Id`
- `Name`
- `Location`
- `QrisImageUrl`
- `MenuItems?: List<MenuItemDto>`

### User

`DTO/UserCreateDto.cs`

- `Username`: required, max 100.
- `Password`: required, max 100, minimum 6.
- `Role`: required, default `Customer`.
- `FullName`: optional, max 100.
- `OutletId`: optional.
- Business rules:
  - Only admin can create users.
  - Username must be unique.
  - `OutletId` is stored only when `Role == "Cashier"`.

`DTO/UserUpdateDto.cs`

- `Username`: required, max 100.
- `Password`: optional, max 100. No minimum length on update.
- `Role`: required, default `Customer`.
- `FullName`: optional, max 100.
- `OutletId`: optional.
- Business rules:
  - Admin or the same user can update.
  - Password is only changed if non-empty.
  - `OutletId` is stored only when `Role == "Cashier"`.

Response `DTO/UserDto.cs`

- `Id`
- `Username`
- `Role`
- `FullName`
- `OutletId`
- `CreatedAt`

### Transaction

`DTO/TransactionFormDto.cs`

- `TransactionJson`: string containing JSON for `TransactionCreateDto`.
- `PaymentProof`: optional file.

`DTO/TransactionCreateDto.cs`

- `OutletId`: required.
- `CustomerName`: required, max 100.
- `Items`: required, min length 1.
- `PaymentMethod`: required, regex `COD|QRIS`.

`DTO/TransactionItemCreateDto.cs`

- `MenuItemId`: required.
- `Quantity`: range 1 to 1000.

Controller transaction rules:

- Outlet must exist.
- Each menu item must exist.
- Stock row must exist.
- Quantity must not exceed stock.
- Stock is decremented inside a DB transaction.
- Unit price is read from `MenuItem.Price`, not client input.
- If `PaymentMethod == "QRIS"`, `PaymentProof` is required.
- QRIS proof extensions: `.jpg`, `.jpeg`, `.png`.
- QRIS proof saved under `wwwroot/uploads/qris`.
- Status defaults to `1`.
- On cancellation/delete, stock is restored.

Response `DTO/TransactionDto.cs`

- `Id`
- `CustomerName`
- `CreatedAt`
- `TotalAmount`
- `OutletName`
- `Items?: List<TransactionItemDto>`
- `Status`

Response `DTO/TransactionItemDto.cs`

- `MenuItemId`
- `MenuName`
- `Quantity`
- `UnitPrice`
- computed `SubTotal`

## Frontend Matching Notes

Confirmed .NET-owned endpoints from existing frontend docs:

- Auth: `/Auth/login`, `/Auth/register`, `/Auth/logout`.
- Menu: `/Menu`, `/Menu/{id}`.
- Outlets: `/Outlets`, `/Outlets/{id}`.
- Reports: `/Reports/sales/daily`, `/Reports/stock/byoutlet/{outletId}`.
- Transactions read endpoints: `/Transactions`, `/Transactions/recent`, `/Transactions/{id}`.
- Users: `/User`, `/User/{id}`.

Not currently matched to primary frontend API usage:

- `.NET POST /api/Transactions`.
- `.NET PUT /api/transactions/status/{id}`.
- `.NET POST /api/payment/snap`.
- SignalR `/transactionHub`.
- `POST /api/Outlets` because current frontend create outlet behavior is mock-only.

Handled by separate Laravel backup/special API according to existing docs:

- Customer checkout/payment creation: `POST /transactions`.
- Payment retry: `POST /transactions/refresh-snap`.
- Customer order history/status: `/transactions/user`, `/transactions/status`.
- Cashier outlet transactions/status update: `/transactions/outlet`, `/cashierUpdateTransactionStatus`.

TODO: inspect the separate Laravel API before deciding whether to port .NET transaction/payment endpoints or replace them with the active Laravel payment flow.

