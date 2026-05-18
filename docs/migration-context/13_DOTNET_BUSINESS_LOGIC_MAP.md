# .NET Business Logic Map

This project has very little separate service-layer code. Most use cases are implemented directly in controllers with `ApplicationDbContext`, AutoMapper, and EF Core transactions.

## Service And Use Case Inventory

| Source | Methods/actions | Purpose | Suggested Laravel equivalent |
| --- | --- | --- | --- |
| `Controllers/AuthController.cs` | `Register`, `Login`, `Logout` | User registration, JWT issuing, token revocation. | `Auth\RegisteredUserController`, `Auth\AuthenticatedSessionController`, session auth; or `AuthController` plus Sanctum token service if API tokens remain. |
| `Controllers/UserController.cs` | `GetAll`, `GetById`, `Create`, `Update`, `Delete` | Admin/user account management. | `Admin\UserController`, `StoreUserRequest`, `UpdateUserRequest`, `UserPolicy`. |
| `Controllers/MenuController.cs` | `GetAll`, `GetById`, `Create`, `Update`, `Delete` | Menu CRUD, image upload, initial stock create, stock update. | `Admin\MenuItemController`, `MenuItemService`, `StoreMenuItemRequest`, `UpdateMenuItemRequest`, storage disk. |
| `Controllers/OutletsController.cs` | `GetAll`, `GetById`, `Create`, `UpdateOutlet` | Outlet listing, create, update, QRIS URL update. | `Admin\OutletController`, `OutletPolicy`, `StoreOutletRequest`, `UpdateOutletRequest`. |
| `Controllers/TransactionsController.cs` | `Create`, `GetAll`, `GetById`, `GetRecent`, `Delete` | Order creation, stock decrement, QRIS proof upload, transaction reads, delete with stock restore. | `TransactionController`, `CreateTransactionAction`, `TransactionPolicy`, `StoreTransactionRequest`, `CancelTransactionAction`. |
| `Controllers/TransactionStatusController.cs` | `UpdateStatus` | Change transaction status, restore stock when canceled, broadcast update. | `TransactionStatusController@update`, `UpdateTransactionStatusRequest`, `UpdateTransactionStatusAction`, `TransactionStatusUpdated` event. |
| `Controllers/ReportsController.cs` | `SalesDaily`, `StockByOutlet` | Sales aggregation and stock listing. | `Admin\ReportController`, query objects or service methods, Inertia report props. |
| `Controllers/PaymentController.cs` | `CreateSnap` | Create Midtrans Snap transaction with hardcoded amount. | Fold into order/payment service; likely superseded by separate Laravel API payment flow. |
| `Service/MidtransSnapService.cs` | `CreateSnapTokenAsync` | Calls Midtrans Snap sandbox API. | `App\Services\MidtransSnapService` using Laravel HTTP client. |
| `Middleware/TokenRevocationMiddleware.cs` | `InvokeAsync` | Reject missing, expired, revoked, or unknown bearer tokens. | Laravel `auth` middleware plus session logout, Sanctum token abilities, or custom middleware only for API token compatibility. |
| `Hubs/TransactionHub.cs` | `JoinOutletGroup`, `LeaveOutletGroup` | SignalR outlet groups for live transaction notifications. | Laravel Broadcasting channels, events, Echo/Reverb/Pusher. |

## Auth Use Cases

### Register

Source: `Controllers/AuthController.cs`

Inputs:

- `Username`
- `Password`
- `Role`
- `FullName`
- `OutletId`

Outputs:

- Success: `{ message = "Registrasi berhasil." }`
- Failure: string error for duplicate username or missing cashier outlet.

Business rules:

- Username must be unique.
- If role is exactly `"Cashier"`, `OutletId` is required.
- Password is BCrypt-hashed.
- `OutletId` is persisted only for `"Cashier"` users.

Database operations:

- Read `Users` for duplicate username.
- Insert `User`.

Laravel equivalent:

- `RegisteredUserController@store` or `AuthController@register`.
- `RegisterRequest`:
  - `username: required|string|max:100|unique:users,username`
  - `password: required|string|min:6|max:100`
  - `role: required|string`
  - `full_name: nullable|string|max:100`
  - `outlet_id: required_if:role,Cashier|nullable|exists:outlets,id`
- Use `Hash::make`.
- For Inertia session auth, login can be optional after registration based on desired UX.

### Login

Source: `Controllers/AuthController.cs`

Inputs:

- `Username`
- `Password`

Outputs:

- Success: `{ token }`
- Failure: `401 "Username or password is incorrect"`

Business rules:

- Find user by username.
- Verify BCrypt password.
- Generate JWT with id/name/role/outlet claims.
- Expiry is hardcoded to one hour in active login path.
- Store token row in `UserToken`.

Database operations:

- Read `Users`.
- Insert `UserToken`.

Laravel equivalent:

- Prefer `AuthenticatedSessionController@store` with session auth.
- If API token compatibility is required, issue Sanctum token and return token plus user.
- Share user via Inertia instead of decoding JWT in browser.

### Logout

Source: `Controllers/AuthController.cs`

Inputs:

- Bearer token from header.

Outputs:

- Success: `{ message = "Logout berhasil, token dicabut." }`
- Failure: `404 { message = "Token tidak ditemukan." }`

Business rules:

- Find token row by exact token string.
- Mark `Revoked = true`.

Laravel equivalent:

- Session: invalidate session and regenerate CSRF token.
- Sanctum: delete current access token.

## User Management

Source: `Controllers/UserController.cs`

Methods:

- `GetAll`: returns all users.
- `GetById`: returns one user.
- `Create`: admin-only, creates user with hashed password.
- `Update`: admin or same user, updates username, optional password, role, full name, outlet.
- `Delete`: admin-only, deletes user.

Inputs/outputs:

- Uses `UserCreateDto`, `UserUpdateDto`, `UserDto`.

Business rules:

- Create/delete require admin role.
- Update requires admin role or same user id.
- Username must be unique on create.
- Password update only when non-empty.
- `OutletId` is saved only for role `"Cashier"`.

Database operations:

- Read users by id/username.
- Insert/update/delete users.

Important migration note:

- The controller reads `ClaimTypes.Role` and `ClaimTypes.NameIdentifier`. Confirm claim behavior before preserving as-is; for Laravel this becomes policies and middleware.

Laravel equivalent:

- `Admin\UserController`.
- `UserPolicy`:
  - `viewAny`: admin.
  - `create`: admin.
  - `update`: admin or same user.
  - `delete`: admin.
- `StoreUserRequest` and `UpdateUserRequest`.
- Add DB unique constraint for username.

## Menu And Stock Management

Source: `Controllers/MenuController.cs`

Methods:

- `GetAll`
- `GetById`
- `Create`
- `Update`
- `Delete`

Inputs/outputs:

- Create/update use multipart form DTOs.
- Responses use `MenuItemDto`.

Business rules:

- Include stock and outlet in reads.
- Validate DTO ModelState.
- Upload image if provided.
- Allowed image extensions: `.jpg`, `.jpeg`, `.png`, `.gif`.
- Request size limit: 10 MB.
- Create initial stock if `InitialStockQuantity` exists.
- Update stock quantity only if stock row exists and `StockQuantity` provided.
- Delete stock row before deleting menu item.

External/file operations:

- Writes menu images to `wwwroot/uploads/menu`.
- Deletes old local menu image when replacing upload.

Database operations:

- Read/insert/update/delete `MenuItems`.
- Read/insert/update/delete `Stocks`.

Laravel equivalent:

- `Admin\MenuItemController`.
- `StoreMenuItemRequest`, `UpdateMenuItemRequest`.
- `MenuItemService` or small action methods for file storage plus stock sync.
- Use Laravel filesystem disk, e.g. `public` disk path `menu`.
- Use DB transaction when creating menu item plus stock.
- Admin middleware/policy should be explicit; current .NET code has no role check for menu writes except global token middleware.

## Outlet Management

Source: `Controllers/OutletsController.cs`

Methods:

- `GetAll`
- `GetById`
- `Create`
- `UpdateOutlet`

Inputs/outputs:

- Create uses `OutletCreateDto`.
- Update uses `OutletUpdateDto`.
- Responses use `OutletDto`.

Business rules:

- Reads include menu items and each item stock.
- Create checks role claim must be admin.
- Update:
  - admin can update any outlet.
  - non-admin must have `OutletId` claim and it must match route id.
- Update only changes `Name` and `QrisImageUrl`.

Database operations:

- Read/insert/update `Outlets`.

Laravel equivalent:

- `Admin\OutletController`.
- `OutletPolicy`:
  - admin can manage all.
  - cashier can update own outlet only if that behavior should remain.
- `StoreOutletRequest`, `UpdateOutletRequest`.
- Frontend create/delete are currently mock-only; implement only after target UX is confirmed.

## Transaction Creation

Source: `Controllers/TransactionsController.cs`

Method:

- `Create`

Inputs:

- Multipart form:
  - `TransactionJson`: JSON string for `TransactionCreateDto`.
  - `PaymentProof`: optional file.

Outputs:

- Success: `{ message, transactionId, totalAmount, paymentMethod, paymentProofPath }`
- Validation failures as `400`.
- Processing failures as `500 { message, error }`.

Business rules:

- Requires token claims for user id and role, but currently reads `"userId"` and `"role"`.
- Transaction JSON must deserialize.
- At least one item is required.
- QRIS requires payment proof upload.
- Outlet must exist.
- Each menu item must exist.
- Each menu item must have stock.
- Quantity must not exceed stock.
- Stock is decremented.
- Unit price comes from database menu price.
- Total amount is calculated server-side.
- Payment proof accepted only for `.jpg`, `.jpeg`, `.png`.
- Sends SignalR `TransactionCreated` event to outlet group after DB commit.

Database operations:

- DB execution strategy and transaction.
- Read outlet, menu items, stock.
- Insert transaction and items.
- Update stock quantities.

Laravel equivalent:

- `StoreTransactionRequest` for validation.
- `CreateTransactionAction` containing the DB transaction.
- Use `DB::transaction()` and row locking (`lockForUpdate`) on stock rows.
- Use Laravel storage for payment proof.
- Dispatch `TransactionCreated` event after commit.
- Use `TransactionPolicy` for access.

Important migration note:

- Current frontend customer checkout uses the separate Laravel backup API, not this .NET endpoint. Inspect that Laravel API before porting or replacing this flow.

## Transaction Reads And Deletion

Source: `Controllers/TransactionsController.cs`

Methods:

- `GetAll`
- `GetById`
- `GetRecent`
- `Delete`

Business rules intended:

- Admin can see all transactions.
- Cashier can see transactions for their assigned outlet.
- Customer can see their own transactions.
- Delete restores stock for transaction items before removing transaction.

Important source behavior:

- `GetAll` currently returns a debug object before executing the intended query. This means the documented intended transaction list response is unreachable in current source.
- Several methods read `"userId"` and `"role"` claims. This may not match the claims issued by login.
- `GetRecent` applies `Take(count)` before role filtering in the query chain; review whether this matches intended behavior.

Laravel equivalent:

- `TransactionController@index/show`.
- `Admin\DashboardController` or report service for recent transactions.
- Prefer cancellation/status update over hard delete if business wants auditability.
- `CancelTransactionAction` should restore stock exactly once.

## Transaction Status

Source: `Controllers/TransactionStatusController.cs`

Method:

- `UpdateStatus`

Inputs:

- Path `id`.
- JSON integer body status.

Outputs:

- Success: `{ message = "Status transaksi diperbarui.", status }`.

Business rules:

- Status must be between 1 and 5.
- Admin can update any.
- Cashier can update transactions in their assigned outlet.
- Customer can update own transaction.
- If status becomes `5` and previous status was not `5`, stock is restored.
- Sends SignalR `TransactionStatusUpdated` event.

Laravel equivalent:

- `TransactionStatusController@update`.
- `UpdateTransactionStatusRequest`.
- `UpdateTransactionStatusAction`.
- `TransactionStatusUpdated` broadcast event.
- Policy should probably restrict which roles may set which statuses; current code allows customers to update their own transaction status.

## Reports

Source: `Controllers/ReportsController.cs`

### SalesDaily

Inputs:

- Query `date?: DateTime`.

Outputs:

- `Date`
- `TotalOutlets`
- `TotalSales`
- `Details[]` with outlet name, transaction count, total sales.

Business rules:

- Defaults to current UTC date.
- Uses inclusive start and exclusive next day.
- Groups by outlet name.

Database operations:

- Reads `Transactions` including outlet.

Laravel equivalent:

- `Admin\ReportController@salesDaily`.
- Use query builder aggregate/groupBy where possible.
- Consider timezone explicitly; frontend is likely Indonesia/Jakarta while .NET uses UTC.

### StockByOutlet

Inputs:

- `outletId`.

Outputs:

- `MenuItemDto[]`.

Business rules:

- Reads menu items for outlet and includes stock.

Laravel equivalent:

- `Admin\StockController@index` or `OutletStockController@index`.

## Payment / Midtrans

Sources:

- `Controllers/PaymentController.cs`
- `Service/MidtransSnapService.cs`

Methods:

- `PaymentController.CreateSnap`
- `MidtransSnapService.CreateSnapTokenAsync`

Business rules:

- Requires auth.
- Reads username/userId/role claims by string names.
- Generates Midtrans order id as `ORDER-{userId}-{DateTime.UtcNow.Ticks}`.
- Gross amount is hardcoded to `75000`.
- Sends request to Midtrans Snap sandbox endpoint.

External calls:

- `POST https://app.sandbox.midtrans.com/snap/v1/transactions`
- Basic auth using Midtrans server key from configuration.

Laravel equivalent:

- `App\Services\MidtransSnapService` using `Http::withBasicAuth`.
- Payment creation should be part of the real transaction/order creation flow with actual total amount.
- Existing frontend points to separate Laravel backup API for payment. Inspect that project next before using this .NET flow as target behavior.

