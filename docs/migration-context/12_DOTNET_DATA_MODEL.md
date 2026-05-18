# .NET Data Model

Source of truth:

- Entity classes: `Model/*.cs`
- DbContext: `Data/ApplicationDbContext.cs`
- Mapping rules: `Mappings/MappingProfile.cs`

No EF Core migrations folder was found, so table names and relationships are inferred from DbSet names, entity names, navigation properties, EF conventions, and DataAnnotations.

## DbContext

`Data/ApplicationDbContext.cs`

| DbSet | Entity | Likely table |
| --- | --- | --- |
| `Outlets` | `Outlet` | `Outlets` |
| `MenuItems` | `MenuItem` | `MenuItems` |
| `Stocks` | `Stock` | `Stocks` |
| `Transactions` | `Transaction` | `Transactions` |
| `TransactionItems` | `TransactionItem` | `TransactionItems` |
| `Users` | `User` | `Users` |
| `UserToken` | `UserToken` | `UserToken` |

Fluent config:

- `Transaction.TotalAmount` precision is `18,2`.

Indexes/constraints:

- No explicit `HasIndex`, unique indexes, delete behavior, or foreign key constraints were configured in source.
- Username uniqueness is enforced in controller code, not visibly in database configuration.

## Entity: User

Source: `Model/User.cs`

Likely table: `Users`

| Field | Type | Required/nullability | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | required | Primary key via `[Key]`. |
| `Username` | `string` | required | `[Required]`, `[MaxLength(100)]`. Uniqueness checked in controllers only. |
| `PasswordHash` | `string` | required | BCrypt hash. |
| `Role` | `string` | required | `[Required]`, `[MaxLength(20)]`, default `"Customer"`. |
| `FullName` | `string?` | nullable | `[MaxLength(100)]`. |
| `CreatedAt` | `DateTime` | required | Defaults to `DateTime.UtcNow` in entity. |
| `OutletId` | `int?` | nullable | Stored for role `"Cashier"` only in create/update logic. |
| `Outlet` | `Outlet?` | nullable nav | FK by `[ForeignKey("OutletId")]`. |
| `Tokens` | `ICollection<UserToken>?` | nullable nav | One user has many tokens. |
| `Transactions` | `ICollection<Transaction>?` | nullable nav | One user has many transactions. |

Relationships:

- `User belongsTo Outlet` optionally.
- `User hasMany UserToken`.
- `User hasMany Transaction`.

Business rules:

- Password is never stored plain text.
- `OutletId` is nulled unless role is exactly `"Cashier"`.
- Admin-only create/delete is handled in controller.
- Admin or same user can update.

Suggested Laravel model:

- `App\Models\User`
- Fields: `username`, `password`, `role`, `full_name`, `outlet_id`, timestamps.
- Use `casts` for datetime.
- Use `Hash::make()` for passwords.
- Add unique index on `username`.
- Consider enum/canonical role values to resolve `Cashier` vs `Kasir` and `Customer` vs `Mahasiswa`.

Migration notes:

- `users.username` should be unique.
- `users.password` can replace `PasswordHash`.
- `users.role` max 20 or enum-like string.
- `users.outlet_id` nullable FK to `outlets.id`, `nullOnDelete()` if appropriate.

## Entity: UserToken

Source: `Model/UserToken.cs`

Likely table: `UserToken`

| Field | Type | Required/nullability | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | required | Primary key via `[Key]`. |
| `UserId` | `int` | required | `[Required]`, FK to user. |
| `Token` | `string` | required | Full JWT string stored in DB. |
| `ExpiredAt` | `DateTime` | required | Token expiry. |
| `Revoked` | `bool` | required | Default `false`. |
| `User` | `User?` | nullable nav | FK by `[ForeignKey("UserId")]`. |

Relationships:

- `UserToken belongsTo User`.

Suggested Laravel model:

- If using Laravel session auth, this table is not needed.
- If using Sanctum, use `personal_access_tokens` instead.
- If preserving current JWT revocation exactly, create `UserToken` model/table with `user_id`, `token`, `expired_at`, `revoked`.

Migration notes:

- Avoid storing full bearer tokens if Sanctum/session auth can satisfy the rewrite.
- If full tokens are stored, consider storing a hash of the token instead of the raw token.

## Entity: Outlet

Source: `Model/Outlet.cs`

Likely table: `Outlets`

| Field | Type | Required/nullability | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | required | Primary key by convention. |
| `Name` | `string` | required | `[Required]`. Create DTO max length is 100, but entity has no max length. |
| `Location` | `string?` | nullable | Create DTO max length is 255. |
| `QrisImageUrl` | `string?` | nullable | Create DTO max length is 255. |
| `MenuItems` | `ICollection<MenuItem>?` | nullable nav | Outlet has many menu items. |

Relationships:

- `Outlet hasMany MenuItem`.
- `Outlet hasMany User` through `User.OutletId` by convention.
- `Outlet hasMany Transaction` through `Transaction.OutletId` by convention.

Suggested Laravel model:

- `App\Models\Outlet`
- Relationships:
  - `hasMany(MenuItem::class)`
  - `hasMany(User::class)`
  - `hasMany(Transaction::class)`

Migration notes:

- `name` required, choose explicit max length, likely 100.
- `location` nullable max 255.
- `qris_image_url` nullable max 255.
- There is no .NET delete endpoint; decide Laravel delete behavior only after business confirmation.

## Entity: MenuItem

Source: `Model/MenuItem.cs`

Likely table: `MenuItems`

| Field | Type | Required/nullability | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | required | Primary key by convention. |
| `Name` | `string` | required | `[Required]`. Create/update DTO max length is 100. |
| `Description` | `string?` | nullable | Create/update DTO max length is 255. |
| `Price` | `decimal` | required | `[Column(TypeName = "decimal(18,2)")]`, DTO range 0 to 100000. |
| `OutletId` | `int` | required | FK to outlet. |
| `Outlet` | `Outlet?` | nullable nav | Belongs to outlet. |
| `ImageUrl` | `string?` | nullable | `[MaxLength(255)]`. |
| `Stock` | `Stock?` | nullable nav | Intended one stock row per menu item. |

Relationships:

- `MenuItem belongsTo Outlet`.
- `MenuItem hasOne Stock` intended.
- `MenuItem hasMany TransactionItem` by `TransactionItem.MenuItemId`.

Business rules:

- Image upload accepts `.jpg`, `.jpeg`, `.png`, `.gif`, max request size 10 MB.
- `ImageUrl` can also be supplied directly.
- Create optionally creates a `Stock` row from `InitialStockQuantity`.
- Update can change existing stock quantity if a stock row exists.
- Delete removes stock row first, then menu item.

Suggested Laravel model:

- `App\Models\MenuItem`
- Relationships:
  - `belongsTo(Outlet::class)`
  - `hasOne(Stock::class)`
  - `hasMany(TransactionItem::class)`

Migration notes:

- `price` decimal `18,2`.
- `outlet_id` FK required.
- `image_url` nullable max 255.
- Consider `cascadeOnDelete()` for stock or explicit application behavior.
- Add explicit validation in `StoreMenuItemRequest` and `UpdateMenuItemRequest`.

## Entity: Stock

Source: `Model/Stock.cs`

Likely table: `Stocks`

| Field | Type | Required/nullability | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | required | Primary key by convention. |
| `MenuItemId` | `int` | required | FK to menu item. |
| `MenuItem` | `MenuItem?` | nullable nav | Belongs to menu item. |
| `Quantity` | `int` | required | DTO range for create/update is 0 to 1000. |

Relationships:

- Intended `Stock belongsTo MenuItem`.
- Intended `MenuItem hasOne Stock`.
- Assumption: EF may infer a one-to-one due to reference navigation on both sides, but source does not explicitly configure uniqueness.

Business rules:

- Stock is decremented during transaction creation.
- Stock is restored on transaction delete or cancel status.
- Transaction creation fails if stock row is missing or insufficient.

Suggested Laravel model:

- `App\Models\Stock`
- Relationship: `belongsTo(MenuItem::class)`.

Migration notes:

- Add `unique('menu_item_id')` if one stock row per menu item is intended.
- Add `quantity` integer default 0.
- Use row locking or transaction-safe decrement in Laravel order creation.

## Entity: Transaction

Source: `Model/Transaction.cs`

Likely table: `Transactions`

| Field | Type | Required/nullability | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | required | Primary key by convention. |
| `CreatedAt` | `DateTime` | required | Defaults to `DateTime.UtcNow`. |
| `CustomerName` | `string?` | nullable entity | Create DTO requires max 100. |
| `TotalAmount` | `decimal` | required | Fluent precision `18,2`. Calculated server-side. |
| `Items` | `ICollection<TransactionItem>?` | nullable nav | One transaction has many items. |
| `OutletId` | `int?` | nullable | Create DTO requires outlet id, but entity nullable. |
| `Outlet` | `Outlet?` | nullable nav | Belongs to outlet. |
| `UserId` | `int` | required | Owner user id from token. |
| `User` | `User` | required nav | Belongs to user. |
| `PaymentMethod` | `string` | required | Default `"COD"`, create DTO regex `COD|QRIS`. |
| `PaymentProofPath` | `string?` | nullable | Path to uploaded QRIS proof. |
| `Status` | `int` | required | Default `1`. |

Status meanings from source comments:

- `1`: pesanan diterima
- `2`: sedang dimasak
- `3`: siap diambil
- `4`: selesai
- `5`: dibatalkan

Relationships:

- `Transaction belongsTo User`.
- `Transaction belongsTo Outlet` optionally by entity shape.
- `Transaction hasMany TransactionItem`.

Business rules:

- Total is calculated from menu prices and quantities.
- Item unit prices are copied from menu price at time of transaction.
- QRIS payment requires upload proof in the .NET transaction flow.
- Status update to `5` restores stock once if previous status was not `5`.

Suggested Laravel model:

- `App\Models\Transaction`
- Relationships:
  - `belongsTo(User::class)`
  - `belongsTo(Outlet::class)`
  - `hasMany(TransactionItem::class)`
- Consider a PHP backed enum or constants for status and payment method.

Migration notes:

- Use `created_at`/`updated_at` timestamps or preserve `created_at` only if behavior requires.
- `total_amount` decimal `18,2`.
- `payment_method` string with validation or enum-like check.
- `payment_proof_path` nullable.
- `status` tiny integer/default 1.
- Add indexes for `user_id`, `outlet_id`, `created_at`, and `status`.

## Entity: TransactionItem

Source: `Model/TransactionItem.cs`

Likely table: `TransactionItems`

| Field | Type | Required/nullability | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | required | Primary key by convention. |
| `TransactionId` | `int` | required | FK to transaction. |
| `Transaction` | `Transaction?` | nullable nav | Belongs to transaction. |
| `MenuItemId` | `int` | required | FK to menu item. |
| `MenuItem` | `MenuItem?` | nullable nav | Belongs to menu item. |
| `Quantity` | `int` | required | DTO range 1 to 1000. |
| `UnitPrice` | `decimal` | required | `[Column(TypeName = "decimal(18,2)")]`. |
| `SubTotal` | computed property | not stored | `UnitPrice * Quantity`. |

Relationships:

- `TransactionItem belongsTo Transaction`.
- `TransactionItem belongsTo MenuItem`.

Business rules:

- `UnitPrice` is server-derived from `MenuItem.Price`.
- `SubTotal` is calculated in DTO/model, not persisted.

Suggested Laravel model:

- `App\Models\TransactionItem`
- Relationships:
  - `belongsTo(Transaction::class)`
  - `belongsTo(MenuItem::class)`
- Accessor for `subtotal`.

Migration notes:

- `unit_price` decimal `18,2`.
- Add indexes for `transaction_id` and `menu_item_id`.

## Non-Database Models

### MidtransSnapRequest

Source: `Model/MidtransSnapRequest.cs`

- `transaction_details.order_id`
- `transaction_details.gross_amount`
- `customer_details.first_name`
- `customer_details.email`

Used by `Service/MidtransSnapService.cs`.

### MidtransSnapResponse

Source: `Model/MidtransSnapResponse.cs`

- `token`
- `redirect_url`

Used by `PaymentController.CreateSnap`.

## Laravel Data Model Summary

Suggested Eloquent models:

- `User`
- `Outlet`
- `MenuItem`
- `Stock`
- `Transaction`
- `TransactionItem`
- Optional `UserToken` only if not using sessions/Sanctum.

Suggested migration priorities:

- Explicit foreign keys and indexes.
- Unique `users.username`.
- Decimal precision on money fields.
- Explicit max lengths matching DTOs.
- Normalize column names to Laravel snake_case while preserving API response shape through Resources/Inertia props.
- Add factories/seeders only after business data requirements are confirmed.

