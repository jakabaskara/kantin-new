# Existing Laravel API Contracts

Source routes:

- `routes/api.php`
- Verified with `php artisan route:list --path=api`.

Common middleware:

- `auth.dotnet` is registered in `bootstrap/app.php`.
- It is implemented by `app/Http/Middleware/CheckDotnetToken.php`.
- It requires a bearer token stored in `UserToken`, not revoked, and not expired.
- It injects `current_user_id`, `current_username`, `current_role`, `current_outlet_id`, and `jwt_full_payload` into the request.

Common response style:

- Most endpoints return JSON with `status: "success"` or `status: "error"`.
- Laravel validation failures use Laravel's default validation JSON response when the caller accepts JSON.

## Endpoint Inventory

| Method | Route | Controller/action | Auth/security | Caller | Suggested target route/action |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/midtrans/callback` | `ApiController@paymentCallback` | Public `guest`; no signature validation | Midtrans browser callback/unknown | `GET /payments/midtrans/finish` for browser redirect plus separate `POST /webhooks/midtrans` |
| `GET` | `/api/testing` | `ApiController@testing` | `auth.dotnet` | Unknown/test only | Remove or keep local-only debug route |
| `POST` | `/api/transactions` | `ApiController@createTransaction` | `auth.dotnet` | React customer checkout | `POST /orders` or `POST /api/orders` handled by `Customer\OrderController@store` |
| `GET` | `/api/transactions` | `ApiController@transactionList` | `auth.dotnet` | Unknown/admin maybe | `GET /admin/transactions` Inertia props or `GET /api/admin/transactions` |
| `GET` | `/api/transactions/user` | `ApiController@userTransactionList` | `auth.dotnet`; accepts arbitrary `user_id` | React customer order history | `GET /orders` for current user, no `user_id` query |
| `GET` | `/api/transactions/outlet` | `ApiController@outletTransactionList` | `auth.dotnet`; accepts arbitrary `outlet_id` | React cashier incoming/history | `GET /cashier/orders` scoped to assigned outlet |
| `POST` | `/api/cashierUpdateTransactionStatus` | `ApiController@cashierUpdateTransactionStatus` | `auth.dotnet`; optional outlet check only if `outlet_id` supplied | React cashier incoming orders | `PATCH /cashier/orders/{transaction}/status` |
| `GET` | `/api/transactions/status` | `ApiController@checkTransactionStatus` | `auth.dotnet`; accepts arbitrary `transaction_id` | React order tracking, cashier detail | `GET /orders/{transaction}` with policy or Inertia show props |
| `POST` | `/api/transactions/refresh-snap` | `ApiController@refreshSnapToken` | `auth.dotnet`; only status `0` refreshable | React order tracking payment retry | `POST /orders/{transaction}/payment/refresh-snap` |
| `POST` | `/api/midtrans/snap` | `ApiController@createSnap` | `auth.dotnet` | Unknown/test helper | Fold into payment service or remove if unused |

## `GET /api/midtrans/callback`

Controller/action:

- `app/Http/Controllers/ApiController.php`
- `ApiController@paymentCallback`

Request payload/query params:

- `order_id`: required by controller. Expected shape `TRX-{transactionId}` or, implicitly, `TRX-{transactionId}-{timestamp}`.

Validation rules:

- Manual checks only:
  - Missing `order_id` -> `400`.
  - Invalid parsed id -> `400`.
  - Unknown transaction -> `404`.

Response shape:

JSON success when request expects/wants JSON:

```json
{
  "status": "success",
  "message": "Transaction updated successfully",
  "transaction_id": 123,
  "redirect_url": "https://kantin.jackserver.site/app/orders/123"
}
```

Otherwise redirects to the hardcoded frontend order tracking URL.

Auth/security requirement:

- Public route with `guest` middleware.
- No Midtrans signature validation.
- No payment status validation.

External service called:

- None. Midtrans config is set, but no Midtrans API/notification object is used.

Database changes:

- Updates `Transactions.Status` to `1`.

Caller:

- Payment gateway callback/redirect. Exact Midtrans configuration not present in repo.

Suggested target Laravel route/controller/action:

- Browser finish route: `GET /payments/midtrans/finish` -> `Payment\MidtransFinishController`.
- Server notification route: `POST /webhooks/midtrans` -> `Payment\MidtransNotificationController@store`.
- Make only the notification route authoritative for paid/failed status changes.

## `GET /api/testing`

Controller/action:

- `ApiController@testing`

Request payload/query params:

- Any request input.

Response shape:

- Calls `dd($request->all())`; this dumps data and stops execution.

Auth/security requirement:

- `auth.dotnet`.

Validation rules:

- None.

External service called:

- None.

Database changes:

- None.

Caller:

- Unknown/test only.

Suggested target Laravel route/controller/action:

- Remove before migration or keep behind local environment only.

## `POST /api/transactions`

Controller/action:

- `ApiController@createTransaction`

Request payload:

```json
{
  "customer_name": "Customer Name",
  "email": "customer@example.com",
  "phone": "08123456789",
  "outlet_id": 1,
  "current_outlet_id": 1,
  "current_user_id": 6,
  "items": [
    {
      "menu_item_id": 10,
      "quantity": 2,
      "unit_price": 15000,
      "name": "Menu Name"
    }
  ]
}
```

Notes:

- `current_user_id` is injected by middleware and may also be sent by existing frontend.
- `email`, `phone`, and `items.*.name` are used but not validated.
- `current_outlet_id` is not used by the controller.

Validation rules:

- `customer_name`: required string max 200
- `outlet_id`: required integer
- `items`: required array min 1
- `items.*.menu_item_id`: required integer
- `items.*.quantity`: required integer min 1
- `items.*.unit_price`: required numeric min 0

Response shape:

```json
{
  "status": "success",
  "transaction_id": 123,
  "order_id": "TRX-123",
  "total_amount": 30000,
  "snap_token": "...",
  "snap_redirect_url": "https://..."
}
```

Auth/security requirement:

- `auth.dotnet`.
- No role check.
- Uses `current_user_id` from token middleware for `Transactions.UserId`.

External service called:

- Midtrans Snap `createTransaction`.

Database changes:

- Creates `Transactions` row.
- Creates `TransactionItems` rows.
- Does not validate menu/outlet existence before insert.
- Does not decrement stock.

Caller:

- React frontend customer checkout, documented in `docs/migration-context/04_FRONTEND_API_USAGE.md` as `src/pages/customer/CheckoutPage.tsx`.

Suggested target Laravel route/controller/action:

- `POST /orders` -> `Customer\OrderController@store`.
- Use `StoreOrderRequest`.
- Use authenticated session user instead of `current_user_id`.
- Calculate item prices server-side from menu ids.
- Wrap local order/payment attempt creation and Snap call in an action/service.
- Preserve JSON response fields during phased frontend migration, especially `snap_redirect_url`.

## `GET /api/transactions`

Controller/action:

- `ApiController@transactionList`

Query params:

- `page`: optional, default `1`.
- `limit`: optional, default `10`.
- `status`: optional, filters `Transactions.Status`.

Validation rules:

- None.

Response shape:

```json
{
  "status": "success",
  "data": [
    {
      "id": 123,
      "customer_name": "Customer Name",
      "total_amount": "30000.00",
      "payment_method": "QRIS",
      "payment_status": 1,
      "created_at": "..."
    }
  ],
  "pagination": {
    "current_page": 1,
    "total": 1,
    "per_page": 10,
    "last_page": 1
  }
}
```

Auth/security requirement:

- `auth.dotnet`.
- No role check.

External service called:

- None.

Database changes:

- None.

Caller:

- Unknown. Existing frontend docs list admin transaction reads against .NET `/Transactions`, not this lowercase backup endpoint.

Suggested target Laravel route/controller/action:

- `GET /admin/transactions` -> `Admin\TransactionController@index` for Inertia page props.
- Optional JSON: `GET /api/admin/transactions`.
- Require admin policy/middleware.

## `GET /api/transactions/user`

Controller/action:

- `ApiController@userTransactionList`

Query params:

- `user_id`: required integer.
- `page`: optional, default `1`.
- `limit`: optional, default `10`.
- `status`: optional.

Validation rules:

- `user_id`: required integer.

Response shape:

Same list/pagination shape as `GET /api/transactions`, filtered by `Transactions.UserId`.

Auth/security requirement:

- `auth.dotnet`.
- No check that `user_id` equals `current_user_id`.

External service called:

- None.

Database changes:

- None.

Caller:

- React frontend customer order history, documented as `src/pages/customer/OrderHistory.tsx`.

Suggested target Laravel route/controller/action:

- `GET /orders` -> `Customer\OrderController@index`.
- Scope to authenticated user automatically.
- Do not accept arbitrary `user_id` for customer route.

## `GET /api/transactions/outlet`

Controller/action:

- `ApiController@outletTransactionList`

Query params:

- `outlet_id`: required integer.
- `page`: optional, default `1`.
- `limit`: optional, default `10`.
- `status`: optional but currently not applied in the query.
- `is_all_transaction`: optional, default true. If false-ish, only `Status = 1` rows are returned.

Validation rules:

- `outlet_id`: required integer.

Manual checks:

- `Outlets::find($outlet_id)` must exist.

Response shape:

```json
{
  "status": "success",
  "data": [
    {
      "id": 123,
      "customer_name": "Customer Name",
      "total_amount": "30000.00",
      "payment_method": "QRIS",
      "payment_status": 1,
      "outlet_id": 1,
      "created_at": "...",
      "items": [
        {
          "menu_item_id": 10,
          "quantity": 2,
          "unit_price": "15000.00",
          "menu_item": {
            "id": 10,
            "name": "Menu Name",
            "description": "...",
            "price": "15000.00",
            "image_url": "..."
          }
        }
      ]
    }
  ],
  "pagination": {
    "current_page": 1,
    "total": 1,
    "per_page": 10,
    "last_page": 1
  }
}
```

Auth/security requirement:

- `auth.dotnet`.
- No check that `outlet_id` matches `current_outlet_id`.

External service called:

- None.

Database changes:

- None.

Caller:

- React cashier incoming orders and transaction history:
  - `src/services/cashier.service.ts`
  - `src/pages/cashier/OrdersIncoming.tsx`
  - `src/pages/cashier/DailyTransactions.tsx`

Suggested target Laravel route/controller/action:

- `GET /cashier/orders` -> `Cashier\OrderController@index`.
- Scope to authenticated cashier's outlet.
- Use `status` and `is_all_transaction` intentionally or replace with named filters such as `paid_only`.

## `POST /api/cashierUpdateTransactionStatus`

Controller/action:

- `ApiController@cashierUpdateTransactionStatus`

Request payload:

```json
{
  "transaction_id": 123,
  "status": 2,
  "outlet_id": 1
}
```

Validation rules:

- `transaction_id`: required integer.
- `status`: required integer in `0,1,2`.

Manual checks:

- Transaction must exist.
- If `outlet_id` is supplied, transaction `OutletId` must equal supplied `outlet_id`.

Response shape:

```json
{
  "status": "success",
  "message": "Transaction status updated successfully",
  "data": {
    "id": 123,
    "customer_name": "Customer Name",
    "total_amount": "30000.00",
    "payment_method": "QRIS",
    "payment_status": 2,
    "outlet_id": 1
  }
}
```

Auth/security requirement:

- `auth.dotnet`.
- Outlet authorization only happens when client sends `outlet_id`.

External service called:

- None.

Database changes:

- Updates `Transactions.Status`.

Caller:

- React cashier incoming orders:
  - `src/services/cashier.service.ts`
  - `src/pages/cashier/OrdersIncoming.tsx`

Suggested target Laravel route/controller/action:

- `PATCH /cashier/orders/{transaction}/status` -> `Cashier\OrderStatusController@update`.
- Use a policy to require cashier assigned outlet.
- Consider separating payment status from order fulfillment status.

## `GET /api/transactions/status`

Controller/action:

- `ApiController@checkTransactionStatus`

Query params:

- `transaction_id`: read from input; not validated.

Validation rules:

- None. TODO: add required integer validation in target app.

Response shape:

```json
{
  "status": "success",
  "data": {
    "id": 123,
    "customer_name": "Customer Name",
    "total_amount": "30000.00",
    "payment_method": "QRIS",
    "payment_status": 1,
    "created_at": "...",
    "items": [
      {
        "menu_item_id": 10,
        "quantity": 2,
        "unit_price": "15000.00",
        "menu_item": {
          "id": 10,
          "name": "Menu Name",
          "description": "...",
          "price": "15000.00",
          "image_url": "..."
        }
      }
    ]
  }
}
```

Auth/security requirement:

- `auth.dotnet`.
- No policy check that transaction belongs to current user or outlet.

External service called:

- None.

Database changes:

- None.

Caller:

- React customer order tracking: `src/pages/customer/OrderTracking.tsx`.
- React cashier transaction detail path through `src/services/cashier.service.ts` / `src/pages/cashier/DailyTransactions.tsx`.

Suggested target Laravel route/controller/action:

- Customer: `GET /orders/{transaction}` -> `Customer\OrderController@show`.
- Cashier: `GET /cashier/orders/{transaction}` -> `Cashier\OrderController@show`.
- Enforce policy by owner/outlet/role.

## `POST /api/transactions/refresh-snap`

Controller/action:

- `ApiController@refreshSnapToken`

Request payload:

```json
{
  "transaction_id": 123,
  "email": "customer@example.com",
  "phone": "08123456789"
}
```

Validation rules:

- `transaction_id`: required integer.

Manual checks:

- Transaction must exist.
- `Transactions.Status` must be `0`.

Response shape:

```json
{
  "status": "success",
  "transaction_id": 123,
  "order_id": "TRX-123-1710000000",
  "total_amount": "30000.00",
  "snap_token": "...",
  "snap_redirect_url": "https://..."
}
```

Auth/security requirement:

- `auth.dotnet`.
- No policy check that current user owns the transaction.

External service called:

- Midtrans Snap `createTransaction`.

Database changes:

- None. New Snap order id/token/redirect URL are not stored.

Caller:

- React customer order tracking payment retry: `src/pages/customer/OrderTracking.tsx`.

Suggested target Laravel route/controller/action:

- `POST /orders/{transaction}/payment/refresh-snap` -> `Customer\PaymentController@refreshSnap`.
- Require current user ownership and pending payment status.
- Store payment attempt metadata.

## `POST /api/midtrans/snap`

Controller/action:

- `ApiController@createSnap`

Request payload:

```json
{
  "order_id": "OPTIONAL-ID",
  "customer_name": "Customer Name",
  "email": "customer@example.com",
  "phone": "08123456789",
  "items": [
    {
      "id": "SKU-1",
      "price": 15000,
      "quantity": 2,
      "name": "Menu Name"
    }
  ],
  "enabled_payments": ["gopay", "bank_transfer"]
}
```

Notes:

- If `items` is missing, the controller uses hardcoded dummy items.
- If `order_id` is missing, it generates one using `current_user_id` and timestamp.
- This endpoint does not create a local `Transactions` row.

Validation rules:

- None.

Response shape:

```json
{
  "status": "ok",
  "order_id": "G109172341-6-1710000000",
  "gross_amount": 38000,
  "token": "...",
  "redirect_url": "https://..."
}
```

Auth/security requirement:

- `auth.dotnet`.

External service called:

- Midtrans Snap `createTransaction`.

Database changes:

- None.

Caller:

- Unknown. Not listed in existing frontend API usage.

Suggested target Laravel route/controller/action:

- Remove if unused.
- If still needed as a development utility, restrict to local/admin only.
- Production payment creation should go through the order/payment service that persists a local transaction.

## Cross-Cutting Migration Notes

- Preserve current backup API contracts while the old React app is still active.
- New Inertia pages should use web/session routes and controller props where possible.
- Keep JSON endpoints for polling, payment retry, cashier live updates, and public webhooks.
- Replace arbitrary `user_id`, `outlet_id`, and `transaction_id` query access with policies/scoped route model binding.
- Extract Midtrans calls from controller into a service and add integration tests around request payloads and callback handling.
