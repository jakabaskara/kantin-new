# Laravel API Merge Strategy

## Summary

This Laravel API should be treated as the active payment/order backup API, not as the primary application backend. It contains important Midtrans behavior and frontend contracts that must be preserved, but the implementation should be refactored when merged into the target Laravel + Inertia + React app.

The safest path is a staged merge:

1. Preserve current JSON contracts for old React screens.
2. Move payment and order behavior into Laravel services/actions/controllers.
3. Add security and idempotency around Midtrans.
4. Convert read-heavy screens to Inertia page props.
5. Retire temporary `.NET UserToken` compatibility once the app uses Laravel session auth.

## What Should Be Preserved As-Is Initially

Preserve behavior/contract:

- `POST /api/transactions` response fields:
  - `status`
  - `transaction_id`
  - `order_id`
  - `total_amount`
  - `snap_token`
  - `snap_redirect_url`
- `POST /api/transactions/refresh-snap` response fields.
- `GET /api/transactions/status` response shape, especially `data.payment_status` and nested `items.menu_item`.
- `GET /api/transactions/user` list/pagination shape while old frontend is active.
- `GET /api/transactions/outlet` list/pagination shape while old cashier pages are active.
- `POST /api/cashierUpdateTransactionStatus` shape while old cashier pages are active.
- Midtrans order id prefix compatibility: `TRX-{transactionId}`.
- Current status `0 -> 1` payment transition during an initial compatibility phase.

Preserve data access temporarily:

- Ability to read/write existing PascalCase SQL Server tables if there is no immediate data migration:
  - `Transactions`
  - `TransactionItems`
  - `MenuItems`
  - `Outlets`
  - `UserToken`

Do not preserve implementation style:

- Single catch-all `ApiController`.
- Client-supplied prices as final source of truth.
- Public payment callback without signature validation.
- Arbitrary `user_id` and `outlet_id` access patterns.
- Hardcoded frontend redirect URL.
- Committed fallback Midtrans credential values.

## What Should Be Moved Into The Main Laravel Inertia App

Move these behaviors into the target app:

- Customer checkout/order creation.
- Customer order history.
- Customer order tracking.
- Payment retry/refresh Snap token.
- Cashier incoming orders.
- Cashier transaction history.
- Cashier status update.
- Midtrans configuration and payment service.
- Compatibility API endpoints needed by old frontend during migration.

Suggested target structure:

| Current behavior | Target Laravel location |
| --- | --- |
| `ApiController@createTransaction` | `Customer\OrderController@store` plus `CreateOrderWithMidtransPayment` action |
| `ApiController@refreshSnapToken` | `Customer\PaymentController@refreshSnap` plus `MidtransSnapService` |
| `ApiController@paymentCallback` | `Payment\MidtransFinishController` and `Payment\MidtransNotificationController` |
| `ApiController@checkTransactionStatus` | `Customer\OrderController@show`, `Cashier\OrderController@show`, or JSON resource |
| `ApiController@userTransactionList` | `Customer\OrderController@index` |
| `ApiController@outletTransactionList` | `Cashier\OrderController@index` |
| `ApiController@cashierUpdateTransactionStatus` | `Cashier\OrderStatusController@update` |
| `CheckDotnetToken` | Transitional middleware only, then Laravel session/Sanctum auth |

## What Should Remain API-Only

Keep JSON/API routes for:

- Midtrans server-to-server notification/webhook.
- Payment refresh endpoint if it returns `snap_redirect_url` asynchronously.
- Polling endpoints while polling remains in the UI.
- Cashier live updates/status changes if not fully handled by Inertia form submissions.
- Backward-compatible endpoints during phased frontend cutover.

In the long-term Inertia app:

- Initial customer order history and cashier order pages can be rendered from web controllers with props.
- Polling can call JSON endpoints returning resources.
- Webhooks must remain public API endpoints but secured by signature validation.

## What Routes Should Become Web / Inertia Routes

Recommended web routes:

| Existing API | Target web route | Notes |
| --- | --- | --- |
| `GET /api/transactions/user` | `GET /orders` | Inertia customer order history, scoped to session user. |
| `GET /api/transactions/status` | `GET /orders/{transaction}` | Inertia customer order tracking, policy checked. |
| `GET /api/transactions/outlet` | `GET /cashier/orders` | Inertia cashier incoming orders/history, scoped to outlet. |
| `POST /api/cashierUpdateTransactionStatus` | `PATCH /cashier/orders/{transaction}/status` | Can be Inertia form submit or JSON. |
| `GET /api/transactions` | `GET /admin/transactions` | Admin Inertia transaction list, after merging .NET/admin data model. |

## What Routes Should Remain API Routes

Recommended API routes:

| Existing API | Target API route | Notes |
| --- | --- | --- |
| `POST /api/transactions` | `POST /api/orders` during compatibility, or `POST /orders` for Inertia | Preserve JSON response for old React checkout. |
| `POST /api/transactions/refresh-snap` | `POST /api/orders/{transaction}/payment/refresh-snap` | Keep JSON response with `snap_redirect_url`. |
| `GET /api/transactions/status` | `GET /api/orders/{transaction}` during polling compatibility | Apply policy. |
| `GET /api/transactions/outlet` | `GET /api/cashier/orders` during polling compatibility | Scope to cashier outlet. |
| `POST /api/cashierUpdateTransactionStatus` | `PATCH /api/cashier/orders/{transaction}/status` during compatibility | Apply policy. |

Remove or restrict:

- `GET /api/testing`
- `POST /api/midtrans/snap` if it is only a test helper.

## Public Secured Webhook Routes

Current:

- `GET /api/midtrans/callback` is public and updates payment status.

Recommended target:

- `POST /webhooks/midtrans`:
  - Public route.
  - CSRF-exempt.
  - Validates Midtrans signature.
  - Verifies local order/payment amount.
  - Processes payment state idempotently.
  - Stores raw notification metadata safely.
- `GET /payments/midtrans/finish`:
  - Browser redirect only.
  - Does not make authoritative payment state changes.
  - Redirects user to the order tracking page.

Security requirements for target webhook:

- Validate `signature_key`.
- Validate `order_id` belongs to a known payment attempt.
- Validate gross amount.
- Map Midtrans statuses explicitly.
- Log duplicate notifications without duplicating side effects.
- Never expose secret values or raw exception file/line to clients.

## Jobs / Events To Preserve Or Add

Current app:

- No jobs found.
- No event/listener classes found.
- Queue tables and database queue config exist.

Recommended additions:

- Event: `OrderPaid` after successful payment transition.
- Event: `OrderStatusUpdated` after cashier status update.
- Job: `ProcessMidtransNotification` if webhook work becomes heavier than a simple transaction update.
- Optional job: expire stale pending payments.
- Optional notification/event broadcast for cashier order updates if replacing polling later.

## Payment Migration Risks

High priority risks:

- Callback currently marks payment success based only on `order_id`.
- No payment failure/expiry handling exists.
- No idempotency table or payment attempt tracking exists.
- Refreshed Snap order ids are not persisted.
- Status values are overloaded and conflict with .NET order status semantics.
- Checkout total uses client-supplied `unit_price`.
- Stock is not decremented by this Laravel payment path.
- Authorization permits broad access to arbitrary `user_id`, `outlet_id`, and `transaction_id`.

Compatibility risks:

- Old frontend expects lowercase backup API routes and specific response fields.
- Cashier screens may depend on `is_all_transaction=false` meaning only `Status = 1`.
- Payment redirect URL is currently hardcoded to the deployed React frontend host.
- The target Inertia app will likely use session auth, while old clients use .NET JWT/UserToken.

## Recommended Migration Order

1. Create a payment behavior safety net:
   - Write tests around current request/response shapes.
   - Capture Midtrans Snap payload shape.
   - Document status behavior and frontend expectations.

2. Extract without changing behavior:
   - Move Midtrans configuration and Snap calls into `MidtransSnapService`.
   - Move transaction creation into an action.
   - Keep old routes pointing to the new internals.

3. Add policy/auth hardening:
   - Scope customer routes to current user.
   - Scope cashier routes to current outlet.
   - Add admin-only access for global transaction lists.
   - Keep `auth.dotnet` only for compatibility endpoints.

4. Add payment attempt persistence:
   - Store Midtrans order id, token, redirect URL, transaction id, and status.
   - Store/refactor refreshed Snap attempts explicitly.

5. Replace callback with proper Midtrans notification handling:
   - Add signed `POST /webhooks/midtrans`.
   - Keep finish redirect as non-authoritative.
   - Map Midtrans statuses to payment status.

6. Normalize statuses:
   - Split payment status and order status.
   - Provide compatibility resource fields for old frontend.

7. Integrate with Inertia pages:
   - Customer checkout/order history/order tracking.
   - Cashier incoming orders and transaction history.
   - Admin transactions when .NET transaction/report ownership is merged.

8. Data migration / schema cleanup:
   - Decide whether to keep PascalCase legacy tables on a legacy connection or migrate to Laravel snake_case tables.
   - Add missing foreign keys, indexes, casts, and enums.

9. Retire compatibility:
   - Remove `GET /api/testing`.
   - Remove or lock down `POST /api/midtrans/snap`.
   - Remove `.NET UserToken` bridge when all clients use Laravel auth.
   - Remove old backup API endpoint aliases after frontend cutover.

## Suggested Target Route Sketch

Web/Inertia:

```php
Route::middleware('auth')->group(function () {
    Route::get('/orders', [CustomerOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{transaction}', [CustomerOrderController::class, 'show'])->name('orders.show');
    Route::post('/orders', [CustomerOrderController::class, 'store'])->name('orders.store');
    Route::post('/orders/{transaction}/payment/refresh-snap', [CustomerPaymentController::class, 'refreshSnap'])->name('orders.payment.refresh-snap');

    Route::get('/cashier/orders', [CashierOrderController::class, 'index'])->name('cashier.orders.index');
    Route::patch('/cashier/orders/{transaction}/status', [CashierOrderStatusController::class, 'update'])->name('cashier.orders.status');

    Route::get('/admin/transactions', [AdminTransactionController::class, 'index'])->name('admin.transactions.index');
});
```

API/webhook:

```php
Route::post('/webhooks/midtrans', MidtransNotificationController::class)
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

Route::get('/payments/midtrans/finish', MidtransFinishController::class)
    ->name('payments.midtrans.finish');
```

Compatibility API:

```php
Route::middleware('auth.dotnet')->prefix('api')->group(function () {
    Route::post('/transactions', [LegacyTransactionController::class, 'store']);
    Route::get('/transactions/user', [LegacyTransactionController::class, 'userIndex']);
    Route::get('/transactions/outlet', [LegacyTransactionController::class, 'outletIndex']);
    Route::get('/transactions/status', [LegacyTransactionController::class, 'show']);
    Route::post('/transactions/refresh-snap', [LegacyPaymentController::class, 'refreshSnap']);
    Route::post('/cashierUpdateTransactionStatus', [LegacyCashierTransactionStatusController::class, 'update']);
});
```
