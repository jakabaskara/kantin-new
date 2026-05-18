# .NET To Laravel Mapping

## Concept Mapping

| .NET concept | Source | Laravel equivalent | Migration note |
| --- | --- | --- | --- |
| ASP.NET Core Web API controller | `Controllers/*Controller.cs` | Laravel controller | Keep route intent, but use Laravel resourceful naming where it improves clarity. |
| `[ApiController]` model binding | Controllers | Form Requests and route model binding | Prefer explicit Form Requests for validation. |
| DataAnnotations | `DTO/*.cs`, `Model/*.cs` | Form Request rules and migration constraints | Move validation to requests; move schema constraints to migrations. |
| Entity Framework Core DbContext | `Data/ApplicationDbContext.cs` | Eloquent models and migrations | Add explicit migrations because .NET migrations are absent. |
| DbSet | `ApplicationDbContext` | Eloquent model/table | Use snake_case table/column names in Laravel unless API compatibility requires otherwise. |
| AutoMapper profile | `Mappings/MappingProfile.cs` | Eloquent API Resources, arrays, Inertia props | Avoid generic mapper layer unless necessary. |
| JWT bearer auth | `Program.cs`, `AuthController.cs` | Laravel session auth, optional Sanctum | Inertia rewrite should not need localStorage JWT. |
| `[Authorize]` | Controllers/hub | `auth` middleware and policies | Use middleware for broad auth, policies for object authorization. |
| Custom token revocation middleware | `Middleware/TokenRevocationMiddleware.cs` | Session invalidation or Sanctum token revocation | Do not require bearer tokens for normal Inertia pages. |
| SignalR hub | `Hubs/TransactionHub.cs` | Laravel Broadcasting, Echo/Reverb/Pusher | Use private/presence channels with authorization callbacks. |
| `IFormFile` upload | Menu/transaction DTOs | Laravel `UploadedFile` and Storage facade | Store on `public` disk or configured object storage. |
| `HttpClient` typed client | `MidtransSnapService.cs` | Laravel HTTP client service | Use `Http::withBasicAuth()` and `.env` config. |
| Swagger | `Program.cs` | Scribe/OpenAPI optional | Not needed for Inertia pages, useful for retained JSON API. |
| `appsettings.json` | config files | `.env`, `config/*.php` | Move DB/JWT/Midtrans secrets out of committed files. |

## Controller Mapping

| .NET controller/action | Current route | Suggested Laravel controller/action |
| --- | --- | --- |
| `AuthController.Register` | `POST /api/Auth/register` | `Auth\RegisteredUserController@store` or `AuthController@register` |
| `AuthController.Login` | `POST /api/Auth/login` | `Auth\AuthenticatedSessionController@store` |
| `AuthController.Logout` | `POST /api/Auth/logout` | `Auth\AuthenticatedSessionController@destroy` |
| `UserController.GetAll` | `GET /api/User` | `Admin\UserController@index` |
| `UserController.GetById` | `GET /api/User/{id}` | `Admin\UserController@show` or edit props |
| `UserController.Create` | `POST /api/User` | `Admin\UserController@store` |
| `UserController.Update` | `PUT /api/User/{id}` | `Admin\UserController@update` or `ProfileController@update` for self-update |
| `UserController.Delete` | `DELETE /api/User/{id}` | `Admin\UserController@destroy` |
| `MenuController.GetAll` | `GET /api/Menu` | `MenuItemController@index` or `Admin\MenuItemController@index` |
| `MenuController.GetById` | `GET /api/Menu/{id}` | `MenuItemController@show` |
| `MenuController.Create` | `POST /api/Menu` | `Admin\MenuItemController@store` |
| `MenuController.Update` | `PUT /api/Menu/{id}` | `Admin\MenuItemController@update` |
| `MenuController.Delete` | `DELETE /api/Menu/{id}` | `Admin\MenuItemController@destroy` |
| `OutletsController.GetAll` | `GET /api/Outlets` | `OutletController@index` |
| `OutletsController.GetById` | `GET /api/Outlets/{id}` | `OutletController@show` |
| `OutletsController.Create` | `POST /api/Outlets` | `Admin\OutletController@store` |
| `OutletsController.UpdateOutlet` | `PUT /api/Outlets/{id}` | `Admin\OutletController@update` or `OutletSettingsController@update` |
| `ReportsController.SalesDaily` | `GET /api/Reports/sales/daily` | `Admin\ReportController@salesDaily` |
| `ReportsController.StockByOutlet` | `GET /api/Reports/stock/byoutlet/{outletId}` | `Admin\StockController@index` or `OutletStockController@index` |
| `TransactionsController.Create` | `POST /api/Transactions` | `TransactionController@store` or `OrderController@store` |
| `TransactionsController.GetAll` | `GET /api/Transactions` | `TransactionController@index` |
| `TransactionsController.GetById` | `GET /api/Transactions/{id}` | `TransactionController@show` |
| `TransactionsController.GetRecent` | `GET /api/Transactions/recent` | `Admin\DashboardController` props or `RecentTransactionsController@index` |
| `TransactionsController.Delete` | `DELETE /api/Transactions/{id}` | Prefer `TransactionCancellationController@store`; use `destroy` only if true delete remains |
| `TransactionStatusController.UpdateStatus` | `PUT /api/transactions/status/{id}` | `TransactionStatusController@update` |
| `PaymentController.CreateSnap` | `POST /api/payment/snap` | Payment action inside `OrderController@store` or `PaymentController@snap` |

## Service Mapping

| .NET source | Current responsibility | Suggested Laravel class |
| --- | --- | --- |
| `MidtransSnapService` | Create Midtrans Snap token via sandbox API. | `App\Services\MidtransSnapService` |
| Controller transaction block | Validate stock, decrement stock, create transaction/items, upload proof. | `App\Actions\Transactions\CreateTransaction` |
| Controller status update block | Validate status, restore stock on cancel, broadcast. | `App\Actions\Transactions\UpdateTransactionStatus` |
| Menu image handling in controller | Save/delete uploaded menu image. | Keep in controller for simple case or `App\Services\MenuImageService` |
| Report LINQ queries | Aggregate sales and stock data. | `App\Queries\SalesReportQuery`, `App\Queries\StockByOutletQuery`, or controller query builder methods |

## Model And Entity Mapping

| .NET entity | Suggested Laravel model | Suggested table | Key relationships |
| --- | --- | --- | --- |
| `User` | `App\Models\User` | `users` | `belongsTo Outlet`, `hasMany Transaction` |
| `UserToken` | Optional `App\Models\UserToken` | `user_tokens` or use Sanctum | `belongsTo User` |
| `Outlet` | `App\Models\Outlet` | `outlets` | `hasMany MenuItem`, `hasMany User`, `hasMany Transaction` |
| `MenuItem` | `App\Models\MenuItem` | `menu_items` | `belongsTo Outlet`, `hasOne Stock`, `hasMany TransactionItem` |
| `Stock` | `App\Models\Stock` | `stocks` | `belongsTo MenuItem` |
| `Transaction` | `App\Models\Transaction` | `transactions` | `belongsTo User`, `belongsTo Outlet`, `hasMany TransactionItem` |
| `TransactionItem` | `App\Models\TransactionItem` | `transaction_items` | `belongsTo Transaction`, `belongsTo MenuItem` |

Column naming:

- Convert .NET PascalCase to Laravel snake_case:
  - `FullName` to `full_name`
  - `OutletId` to `outlet_id`
  - `MenuItemId` to `menu_item_id`
  - `TotalAmount` to `total_amount`
  - `PaymentMethod` to `payment_method`
  - `PaymentProofPath` to `payment_proof_path`
  - `CreatedAt` to `created_at`

Use API Resources or Inertia prop mapping to preserve frontend camelCase/PascalCase expectations during phased migration.

## DTO And Validation Mapping

| .NET DTO | Laravel equivalent |
| --- | --- |
| `LoginDto` | `LoginRequest` |
| inline `RegisterRequest` | `RegisterRequest` |
| `UserCreateDto` | `StoreUserRequest` |
| `UserUpdateDto` | `UpdateUserRequest` |
| `OutletCreateDto` | `StoreOutletRequest` |
| `OutletUpdateDto` | `UpdateOutletRequest` |
| `MenuItemCreateDto` | `StoreMenuItemRequest` |
| `MenuItemUpdateDto` | `UpdateMenuItemRequest` |
| `TransactionFormDto` plus `TransactionCreateDto` | `StoreTransactionRequest` |
| `TransactionItemCreateDto` | nested validation inside `StoreTransactionRequest` |

Recommended validation examples:

- Menu:
  - `name: required|string|max:100`
  - `description: nullable|string|max:255`
  - `price: required|numeric|min:0|max:100000`
  - `outlet_id: required|exists:outlets,id`
  - `initial_stock_quantity: nullable|integer|min:0|max:1000`
  - `image_file: nullable|image|mimes:jpg,jpeg,png,gif|max:10240`
- Transaction:
  - `outlet_id: required|exists:outlets,id`
  - `customer_name: required|string|max:100`
  - `payment_method: required|in:COD,QRIS`
  - `payment_proof: required_if:payment_method,QRIS|nullable|image|mimes:jpg,jpeg,png|max:10240`
  - `items: required|array|min:1`
  - `items.*.menu_item_id: required|exists:menu_items,id`
  - `items.*.quantity: required|integer|min:1|max:1000`

## Middleware Mapping

| .NET middleware/config | Laravel equivalent |
| --- | --- |
| `UseAuthentication()` | `auth` middleware |
| `UseAuthorization()` | Policies/gates and route middleware |
| `TokenRevocationMiddleware` | Session auth or Sanctum token validation/revocation |
| CORS `AllowReactApp` | `config/cors.php`, likely simpler if Inertia served by same Laravel app |
| `UseStaticFiles()` for uploads | Laravel public disk with `storage:link` |
| SignalR token from query string | Broadcast auth endpoint and private channels |

## Auth Mapping

.NET current:

- Browser stores JWT in localStorage.
- Axios sends `Authorization: Bearer`.
- Middleware checks token table.
- Controllers manually inspect claims.

Laravel target:

- Browser uses Laravel session cookie.
- Inertia pages receive `auth.user`.
- CSRF protects form submissions.
- Policies use `Auth::user()`.
- Optional JSON endpoints use same session auth for first-party requests.
- Optional external API clients use Sanctum tokens.

Role mapping:

- `Admin`: admin route group and policies.
- `Cashier`/`Kasir`: cashier route group; normalize role name or support aliases.
- `Customer`/`Mahasiswa`: customer app route group; normalize role name or support aliases.

## Error Handling Mapping

| Current .NET response | Laravel recommendation |
| --- | --- |
| `BadRequest(ModelState)` | Form Request `422` validation errors |
| `BadRequest("message")` | `back()->withErrors()` for Inertia or JSON `{ message }` with proper status |
| `Unauthorized()` for forbidden action | Use `401` only for unauthenticated, `403` for authenticated but forbidden |
| `NotFound()` | `abort(404)` or route model binding |
| `StatusCode(500, { message, error })` | Let exception handler log; return safe user-facing message |
| Mixed string/object responses | Standardize per Inertia or JSON endpoint |

## Response Format Mapping

Current .NET responses are DTO objects with PascalCase properties after default ASP.NET JSON serialization behavior may produce camelCase depending on runtime defaults. Existing frontend types use camelCase.

Laravel options:

- For Inertia pages, return props shaped exactly for the React page.
- For retained JSON endpoints, use API Resources to define stable camelCase shape:
  - `MenuItemResource`
  - `OutletResource`
  - `UserResource`
  - `TransactionResource`
- Avoid exposing password hashes, raw tokens, or internal exception messages.

## Logging Mapping

.NET:

- Built-in logging configured in `appsettings`.
- No explicit structured domain logging found.
- Some frontend logging is noted in existing docs, but not backend source.

Laravel:

- Use Laravel logging channels.
- Log payment provider failures, order creation failures, and unexpected stock conflicts.
- Do not log secrets, raw bearer tokens, or full payment credentials.

## Queue And Background Job Mapping

No .NET queue/background job system was found.

Possible Laravel jobs/events:

- `TransactionCreated` event for broadcasting cashier updates.
- `TransactionStatusUpdated` event.
- Optional queued job for Midtrans webhook processing after inspecting separate Laravel API.
- Optional report export jobs if PDF/Excel export becomes real.

## Migration Recommendations

1. Inspect the separate Laravel API next, because active checkout/payment/cashier endpoints are documented there rather than in this .NET transaction/payment code.
2. Decide canonical roles and status values before writing migrations.
3. Create Laravel migrations from the data model in `12_DOTNET_DATA_MODEL.md`, with explicit indexes and FKs.
4. Implement auth/session scaffolding first, then map admin/customer/cashier route groups.
5. Port read-heavy pages as Inertia props before reintroducing polling/live JSON endpoints.
6. Use policies to replace scattered manual role/claim checks.
7. Port transaction creation only after reconciling .NET transaction logic with the separate Laravel payment flow.

