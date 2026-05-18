# Payment Gateway Flow

## Provider

- Payment provider: Midtrans.
- Package: `midtrans/midtrans-php`.
- Main integration file: `app/Http/Controllers/ApiController.php`.
- Config file: `config/services.php`.
- Env keys used by config:
  - `MIDTRANS_SERVER_KEY`
  - `MIDTRANS_CLIENT_KEY`
  - `MIDTRANS_IS_PRODUCTION`

Do not preserve committed fallback credential values from `config/services.php`; the target Laravel app should require these values from environment variables or secret management.

## Related Routes

| Method | Route | Handler | Middleware | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/api/transactions` | `ApiController@createTransaction` | `auth.dotnet` | Create local transaction and Midtrans Snap transaction. |
| `GET` | `/api/midtrans/callback` | `ApiController@paymentCallback` | `guest` | Public callback/redirect route; marks transaction status as paid/success. |
| `POST` | `/api/transactions/refresh-snap` | `ApiController@refreshSnapToken` | `auth.dotnet` | Create a new Snap redirect for a pending transaction. |
| `POST` | `/api/midtrans/snap` | `ApiController@createSnap` | `auth.dotnet` | Generic/test Snap transaction creator, not tied to local transaction persistence. |
| `GET` | `/api/transactions/status` | `ApiController@checkTransactionStatus` | `auth.dotnet` | Poll local transaction payment/order status. |
| `GET` | `/api/transactions/user` | `ApiController@userTransactionList` | `auth.dotnet` | Customer order history. |
| `GET` | `/api/transactions/outlet` | `ApiController@outletTransactionList` | `auth.dotnet` | Cashier outlet orders/history. |
| `POST` | `/api/cashierUpdateTransactionStatus` | `ApiController@cashierUpdateTransactionStatus` | `auth.dotnet` | Cashier updates local status. |

## Payment Initiation Flow

Source: `ApiController@createTransaction`.

1. Caller posts checkout payload to `POST /api/transactions`.
2. `auth.dotnet` validates the bearer token against `UserToken` and merges `current_user_id`.
3. Controller validates:
   - `customer_name`: required string max 200
   - `outlet_id`: required integer
   - `items`: required array min 1
   - `items.*.menu_item_id`: required integer
   - `items.*.quantity`: required integer min 1
   - `items.*.unit_price`: required numeric min 0
4. Starts a DB transaction.
5. Calculates `TotalAmount` by trusting client-supplied `unit_price * quantity`.
6. Creates a row in `Transactions`:
   - `CustomerName`
   - `TotalAmount`
   - `OutletId`
   - `PaymentMethod = QRIS`
   - `UserId = current_user_id` or `0`
   - `Status = 0`
7. Creates rows in `TransactionItems` for each item.
8. Configures Midtrans.
9. Builds Midtrans order id as `TRX-{Transactions.Id}`.
10. Builds Midtrans `item_details` from request items.
11. Builds Midtrans `customer_details` from request, with fallback email and phone.
12. Calls `Midtrans\Snap::createTransaction($payload)`.
13. Commits the DB transaction.
14. Returns JSON containing local transaction id, Midtrans order id, total amount, Snap token, and Snap redirect URL.

Success response shape:

```json
{
  "status": "success",
  "transaction_id": 123,
  "order_id": "TRX-123",
  "total_amount": 23000,
  "snap_token": "...",
  "snap_redirect_url": "https://..."
}
```

Error response shape:

```json
{
  "status": "error",
  "message": "..."
}
```

## Callback / Webhook Flow

Source: `ApiController@paymentCallback`.

Current route:

- `GET /api/midtrans/callback`

Current behavior:

1. Configures Midtrans server key and production flag.
2. Reads `order_id` from request input.
3. Returns `400` if `order_id` is missing.
4. Removes `TRX-` prefix and casts the remaining value to integer.
5. Returns `400` if transaction id cannot be parsed.
6. Finds local `Transactions` row.
7. Returns `404` if not found.
8. Sets `Transactions.Status = 1`.
9. Saves the transaction.
10. Builds redirect URL `https://kantin.jackserver.site/app/orders/{transactionId}`.
11. Returns JSON if the request expects/wants JSON; otherwise redirects the browser.

JSON callback success response:

```json
{
  "status": "success",
  "message": "Transaction updated successfully",
  "transaction_id": 123,
  "redirect_url": "https://kantin.jackserver.site/app/orders/123"
}
```

Important:

- No `POST` webhook route was found.
- `Midtrans\Notification` is imported but unused.
- No Midtrans `transaction_status`, `fraud_status`, `payment_type`, `gross_amount`, or `signature_key` fields are inspected.
- This should be treated as a public redirect/callback handler, not a complete payment notification implementation.

## Payment Retry Flow

Source: `ApiController@refreshSnapToken`.

Route:

- `POST /api/transactions/refresh-snap`

Behavior:

1. Validates `transaction_id` as required integer.
2. Loads `Transaction` with `items.menuItem`.
3. Fails with `404` if transaction is missing.
4. Allows refresh only when `Status` is `0`.
5. Configures Midtrans.
6. Builds new order id as `TRX-{Transactions.Id}-{time()}`.
7. Builds item details from stored transaction items.
8. Calls `Midtrans\Snap::createTransaction($payload)`.
9. Returns new Snap token and redirect URL.

Success response shape matches `createTransaction`, except `order_id` contains a timestamp suffix.

Callback parsing note:

- `paymentCallback` removes `TRX-` then casts to integer. In PHP, a string like `123-1710000000` casts to integer `123`, so callbacks for refreshed Snap order ids likely still map to the original transaction. This is implicit behavior and should be made explicit in the target app.

## Success / Failure Flow

Current local status behavior:

| Local `Transactions.Status` | Observed meaning | Where used |
| --- | --- | --- |
| `0` | Pending/unpaid | New checkout rows; only status eligible for Snap refresh. |
| `1` | Paid/success/ready for cashier list | Set by `paymentCallback`; `outletTransactionList` returns only status `1` when `is_all_transaction=false`. |
| `2` | Cashier-updated status | Allowed by `cashierUpdateTransactionStatus`; exact business meaning is not documented in code. TODO: confirm with frontend labels/business owner. |

Failure handling:

- If Midtrans Snap creation fails inside `createTransaction`, the DB transaction is rolled back.
- If payment fails at Midtrans after Snap creation, this Laravel API has no explicit failure callback handling.
- No timeout/expiry job was found to cancel stale status `0` transactions.
- No stock restoration/cancellation logic exists in this Laravel API.

## Signature Validation And Security Checks

Current checks:

- Authenticated payment initiation and status APIs require a bearer token present in the .NET `UserToken` table.
- Callback route is public.
- Callback only checks `order_id` maps to an existing local transaction.

Missing or TODO for target app:

- Validate Midtrans notification signature using server key.
- Verify `gross_amount` matches local `TotalAmount`.
- Map Midtrans `transaction_status` and `fraud_status`.
- Reject callback/notification if the payment belongs to an unexpected order id format.
- Use a `POST` server-to-server notification route for authoritative status updates.
- Keep browser finish redirect separate from webhook processing.
- Avoid returning raw exception file/line in production responses.

## Idempotency Handling

Current implementation:

- `paymentCallback` simply sets `Status = 1` every time it receives a valid order id.
- There is no dedicated payment attempt table, webhook event table, idempotency key, or notification log.
- `refreshSnapToken` can create multiple Midtrans order ids for the same local transaction while it remains pending.

Target migration recommendation:

- Preserve the local transaction id prefix behavior, but store each Snap attempt:
  - `transaction_id`
  - `midtrans_order_id`
  - `snap_token`
  - `redirect_url`
  - `status`
  - raw notification payload hash or event id if available
- Make notification handling idempotent by ignoring duplicate terminal status updates.

## Order / Invoice / Payment Status Mapping

Existing Laravel API uses a single integer `Transactions.Status` for both payment and cashier/order workflow. This conflicts with the .NET status model documented in `docs/migration-context/12_DOTNET_DATA_MODEL.md`, where statuses `1..5` represent order progress and cancellation.

Observed Laravel mapping:

| Event | Stored `Status` |
| --- | --- |
| Local transaction created before payment | `0` |
| Midtrans callback received for local transaction | `1` |
| Cashier status update | `0`, `1`, or `2` |

Recommended target model:

- Split payment state from order fulfillment state if possible:
  - `payment_status`: `pending`, `paid`, `failed`, `expired`, `cancelled`
  - `order_status`: `received`, `preparing`, `ready`, `completed`, `cancelled`
- If a single legacy status must be preserved initially, document an explicit compatibility enum and avoid mixing it with the .NET `1..5` order status semantics without mapping.

## Related Controllers / Services / Jobs

Current:

- Controller: `app/Http/Controllers/ApiController.php`
- Middleware: `app/Http/Middleware/CheckDotnetToken.php`
- Models:
  - `app/Models/Transaction.php`
  - `app/Models/TransactionItem.php`
  - `app/Models/MenuItems.php`
  - `app/Models/Outlets.php`
- Service classes: none.
- Jobs: none.
- Events/listeners: none.

Suggested target:

- `App\Services\Payments\MidtransSnapService`
- `App\Actions\Orders\CreatePaidOnlineOrder`
- `App\Actions\Payments\RefreshMidtransSnap`
- `App\Actions\Payments\HandleMidtransNotification`
- `App\Http\Controllers\Customer\OrderController`
- `App\Http\Controllers\Customer\PaymentController`
- `App\Http\Controllers\Payment\MidtransNotificationController`
- `App\Events\OrderPaid`
- Optional queued job: `ProcessMidtransNotification`

## Related Database Tables / Models

Current tables/models:

- `Transactions` -> `App\Models\Transaction`
- `TransactionItems` -> `App\Models\TransactionItem`
- `MenuItems` -> `App\Models\MenuItems`
- `Outlets` -> `App\Models\Outlets`
- `UserToken` -> query builder in `CheckDotnetToken`

Payment-related fields:

- `Transactions.TotalAmount`
- `Transactions.PaymentMethod`
- `Transactions.PaymentProofPath` (fillable but not used by current Midtrans flow)
- `Transactions.Status`
- `Transactions.UserId`
- `Transactions.OutletId`
- `TransactionItems.UnitPrice`

Missing payment persistence:

- No `midtrans_order_id` column.
- No `snap_token` column.
- No `snap_redirect_url` column.
- No raw webhook/notification payload table.
- No payment attempt table.

## Frontend Or .NET Dependency

Detected from existing docs:

- React frontend checkout calls backup API `POST /transactions` and expects `snap_redirect_url`.
- React order tracking calls `GET /transactions/status` and `POST /transactions/refresh-snap`.
- React order history calls `GET /transactions/user`.
- React cashier pages call `GET /transactions/outlet` and `POST /cashierUpdateTransactionStatus`.
- Laravel `auth.dotnet` depends on the .NET `UserToken` table and JWT payload shape.
- Laravel domain models depend on .NET-style SQL Server tables.

## Risks / TODOs For Migration

- TODO: Confirm whether Midtrans is configured to call `/api/midtrans/callback` as a finish redirect, payment notification URL, or both.
- TODO: Confirm exact meaning of Laravel `Status = 2`.
- TODO: Confirm whether customer-supplied `unit_price` is intentional. Target app should calculate price server-side from menu items.
- TODO: Confirm stock behavior. This Laravel API does not decrement or restore stock.
- TODO: Confirm whether `/api/midtrans/snap` is actively used or only a test endpoint.
- Risk: Current callback marks transactions successful using only `order_id`; this is unsafe for production payment finalization.
- Risk: Role/user authorization is too broad for customer and cashier transaction queries.
- Risk: A refreshed Snap order id is not stored, which makes reconciliation and debugging harder.
- Risk: Existing frontend depends on response field names such as `snap_redirect_url` and `payment_status`; preserve these during phased migration.
