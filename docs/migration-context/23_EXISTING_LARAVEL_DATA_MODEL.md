# Existing Laravel Data Model

## Overview

This Laravel API uses two different data model styles:

1. Laravel starter/framework tables from migrations, such as lowercase `users`, `sessions`, `jobs`, `cache`, and `personal_access_tokens`.
2. Existing .NET-style SQL Server tables with PascalCase names and columns, accessed by custom Eloquent models and query builder:
   - `Transactions`
   - `TransactionItems`
   - `MenuItems`
   - `Outlets`
   - `UserToken`

No Laravel migrations were found for the domain tables used by payment/transaction code. Assumption: this API shares the existing .NET SQL Server database.

## Database Configuration

Source files:

- `.env.example`
- `config/database.php`

Detected:

- `.env.example` uses `DB_CONNECTION=sqlsrv`.
- `config/database.php` includes standard Laravel `sqlsrv` connection settings.
- `config/queue.php` uses database queue by default, but no domain jobs exist.

## Model: `App\Models\Transaction`

Source: `app/Models/Transaction.php`

Table:

- `Transactions`

Primary key:

- `Id`

Timestamps:

- Disabled with `public $timestamps = false`.

Fillable fields:

| Field | Notes |
| --- | --- |
| `CustomerName` | Set from `customer_name`. |
| `TotalAmount` | Calculated in Laravel from request item unit prices and quantities. |
| `OutletId` | Set from request `outlet_id`. |
| `PaymentMethod` | Set to `QRIS` by `createTransaction`. |
| `PaymentProofPath` | Fillable but not used by current Midtrans flow. |
| `UserId` | Set from `current_user_id` injected by middleware or `0`. |
| `Status` | Used as payment/order status. |

Relationships:

- `items()` -> `hasMany(TransactionItem::class, 'TransactionId', 'Id')`.

Status enums/constants:

- No constants or enum class exist.
- Observed values:
  - `0`: pending/unpaid.
  - `1`: set by Midtrans callback; also used as paid/success filter for cashier incoming orders.
  - `2`: allowed by cashier status update; exact meaning TODO.

Payment-related fields:

- `TotalAmount`
- `PaymentMethod`
- `PaymentProofPath`
- `Status`

Suggested target Laravel model/migration notes:

- Prefer `App\Models\Transaction` or rename to `Order` if business language allows.
- Use Laravel snake_case columns in the new schema only after migration mapping is defined:
  - `customer_name`
  - `total_amount`
  - `outlet_id`
  - `payment_method`
  - `payment_status`
  - `order_status`
  - `user_id`
- Add casts:
  - money decimal
  - status enum/backed enum if available
  - datetime timestamps
- Split `payment_status` and `order_status` if possible.
- Add indexes for `user_id`, `outlet_id`, `payment_status`, `order_status`, and `created_at`.
- Preserve compatibility serialization (`payment_status`, `total_amount`, etc.) while old frontend contracts remain active.

## Model: `App\Models\TransactionItem`

Source: `app/Models/TransactionItem.php`

Table:

- `TransactionItems`

Primary key:

- `Id`

Timestamps:

- Disabled.

Fillable fields:

| Field | Notes |
| --- | --- |
| `TransactionId` | FK to `Transactions.Id`. |
| `MenuItemId` | FK to `MenuItems.Id`. |
| `Quantity` | Client supplied, min 1 in `createTransaction`. |
| `UnitPrice` | Client supplied in Laravel API. |

Relationships:

- `transaction()` -> `belongsTo(Transaction::class, 'TransactionId', 'Id')`.
- `menuItem()` -> `belongsTo(MenuItems::class, 'MenuItemId', 'Id')`.

Status enums/constants:

- None.

Payment-related fields:

- `UnitPrice`
- `Quantity`

Suggested target Laravel model/migration notes:

- Use `transaction_items` or `order_items`.
- Fields:
  - `transaction_id` / `order_id`
  - `menu_item_id`
  - `quantity`
  - `unit_price`
  - optional computed accessor `subtotal`
- In target app, derive `unit_price` server-side from `MenuItem.Price`, not from request payload.
- Add foreign keys and indexes.

## Model: `App\Models\MenuItems`

Source: `app/Models/MenuItems.php`

Table:

- `MenuItems`

Primary key:

- `Id`

Timestamps:

- Disabled.

Fillable fields:

| Field | Notes |
| --- | --- |
| `Name` | Used in nested transaction status/list responses through relationship. |
| `Description` | Used in nested response. |
| `Price` | Used in nested response only; not used to calculate checkout total in current Laravel API. |
| `OutletId` | Existing outlet association. |
| `ImageUrl` | Used in nested response. |
| `StockId` | Fillable but no relationship or usage found. This differs from .NET docs where `Stock` likely references `MenuItemId`. TODO: verify real DB schema. |

Relationships:

- No relationships are defined in this model.
- It is referenced by `TransactionItem::menuItem()`.

Status enums/constants:

- None.

Payment-related fields:

- `Price`, but current checkout trusts request `unit_price`.

Suggested target Laravel model/migration notes:

- Prefer singular class name `MenuItem`.
- Define:
  - `belongsTo(Outlet::class)`
  - `hasOne(Stock::class)` if stock table is preserved.
  - `hasMany(TransactionItem::class)`
- Use server-side price lookup during order creation.
- Decide whether target schema follows .NET's `Stocks.MenuItemId` model or this Laravel model's fillable `StockId`. Existing .NET docs suggest `Stocks.MenuItemId`; mark `StockId` as a compatibility/TODO field until DB is confirmed.

## Model: `App\Models\Outlets`

Source: `app/Models/Outlets.php`

Table:

- `Outlets`

Primary key:

- `Id`

Timestamps:

- Disabled.

Fillable fields:

| Field | Notes |
| --- | --- |
| `Name` | Used to validate existence in outlet transaction list only by `find()`. |
| `Location` | Fillable but not returned by current Laravel API responses. |

Relationships:

- No relationships are defined in this model.
- `outletTransactionList` uses `Outlets::find($outletId)` before querying `Transactions`.

Status enums/constants:

- None.

Payment-related fields:

- None directly, but `Transactions.OutletId` scopes cashier views.

Suggested target Laravel model/migration notes:

- Prefer singular class name `Outlet`.
- Define:
  - `hasMany(MenuItem::class)`
  - `hasMany(Transaction::class)`
  - `hasMany(User::class)` for cashier assignment.
- Include `qris_image_url` if preserving .NET outlet QRIS data.
- Use policies to scope cashier access to their assigned outlet.

## Model: `App\Models\User`

Source: `app/Models/User.php`

Table:

- Default Laravel `users`.

Primary key:

- Default `id`.

Timestamps:

- Enabled by default.

Fillable fields:

- `name`
- `email`
- `password`

Hidden fields:

- `password`
- `remember_token`

Casts:

- `email_verified_at` as datetime.
- `password` as hashed.

Relationships:

- None.

Status enums/constants:

- None.

Payment-related fields:

- None.

Migration note:

- This model does not match the .NET `Users` table documented in `docs/migration-context/12_DOTNET_DATA_MODEL.md`, which uses `Username`, `PasswordHash`, `Role`, `FullName`, `CreatedAt`, and `OutletId`.
- The current payment API does not authenticate through this model; it relies on `UserToken`.
- Target Laravel + Inertia should likely replace this starter shape with the migrated application user model and session auth.

## Table: `UserToken`

Source:

- `app/Http/Middleware/CheckDotnetToken.php`

Access pattern:

- Query builder: `DB::table('UserToken')->where('Token', $token)->first()`.

Fields used:

| Field | Notes |
| --- | --- |
| `Token` | Exact bearer token string. |
| `UserId` | Used as trusted current user id. |
| `Revoked` | Must not equal `1`. |
| `ExpiredAt` | Must not be in the past. |

Relationships:

- No Eloquent model here.
- From .NET docs, `UserToken` belongs to user.

Payment-related fields:

- None directly, but this table gates all protected Laravel payment/order APIs.

Suggested target Laravel model/migration notes:

- Prefer Laravel session auth for Inertia pages.
- If API token compatibility is still required, use Sanctum or a dedicated transitional token guard.
- Do not store raw bearer tokens in new design unless required; store hashed tokens.
- Avoid decoding JWT payload without signature verification.

## Laravel Framework Tables From Migrations

Source: `database/migrations/*`

### `users`

Created by `0001_01_01_000000_create_users_table.php`.

Fields:

- `id`
- `name`
- `email`
- `email_verified_at`
- `password`
- `remember_token`
- timestamps

Notes:

- Starter Laravel auth table.
- Not aligned with existing .NET user schema.

### `password_reset_tokens`

Fields:

- `email`
- `token`
- `created_at`

### `sessions`

Fields:

- `id`
- `user_id`
- `ip_address`
- `user_agent`
- `payload`
- `last_activity`

Target notes:

- Useful for Laravel + Inertia session auth.

### `cache` and `cache_locks`

Created by `0001_01_01_000001_create_cache_table.php`.

### `jobs`, `job_batches`, `failed_jobs`

Created by `0001_01_01_000002_create_jobs_table.php`.

Notes:

- Queue tables exist, but no app jobs currently use them.

### `personal_access_tokens`

Created by `2026_01_11_164437_create_personal_access_tokens_table.php`.

Notes:

- Sanctum package is installed and migration exists.
- Current API does not use Sanctum for auth.

## Data Model Gaps

- No Eloquent `Stock` model exists in this Laravel API.
- No migrations exist for `Transactions`, `TransactionItems`, `MenuItems`, `Outlets`, or `UserToken`.
- No payment attempts table exists.
- No webhook notification log table exists.
- No explicit relationships are defined on `Transaction` to `Outlet` or `User`.
- No model casts are defined for money/status/date fields.
- No status enum/constants are defined.

## Suggested Target Data Model Direction

Preserve during transition:

- Existing transaction response field names expected by old frontend:
  - `id`
  - `customer_name`
  - `total_amount`
  - `payment_method`
  - `payment_status`
  - `created_at`
  - `items`
  - `menu_item`

Refactor in target Laravel app:

- Create canonical Eloquent models:
  - `User`
  - `Outlet`
  - `MenuItem`
  - `Stock`
  - `Transaction` or `Order`
  - `TransactionItem` or `OrderItem`
  - `PaymentAttempt`
  - optional `PaymentNotification`
- Use snake_case database columns for new tables, or maintain PascalCase only for a transitional legacy connection.
- Separate payment status from order status.
- Add database constraints, indexes, and foreign keys.
- Calculate totals server-side.
- Add tests around model relationships and payment status transitions.
