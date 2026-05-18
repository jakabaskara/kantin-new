# Existing Laravel API Overview

## Source Scope

Inspected project: `api-backup-kantin`.

Primary files:

- `composer.json`
- `routes/api.php`
- `routes/web.php`
- `routes/console.php`
- `bootstrap/app.php`
- `app/Http/Controllers/ApiController.php`
- `app/Http/Middleware/CheckDotnetToken.php`
- `app/Models/Transaction.php`
- `app/Models/TransactionItem.php`
- `app/Models/MenuItems.php`
- `app/Models/Outlets.php`
- `app/Models/User.php`
- `config/services.php`
- `config/database.php`
- `config/queue.php`
- `config/auth.php`
- `database/migrations/*`
- `.env.example`

Existing migration context read first:

- `docs/migration-context/00_PROJECT_OVERVIEW.md`
- `docs/migration-context/04_FRONTEND_API_USAGE.md`
- `docs/migration-context/11_DOTNET_API_CONTRACTS.md`
- `docs/migration-context/12_DOTNET_DATA_MODEL.md`

## Laravel Version

- Detected by `php artisan --version`: Laravel Framework `12.46.0`.
- `composer.json` requires `laravel/framework` `^12.0`, PHP `^8.2`, `laravel/sanctum` `^4.0`, and `midtrans/midtrans-php`.

## Project Purpose

This Laravel project is a special-purpose backup/API companion to the main application. Based on the existing frontend documentation and this codebase, it currently handles:

- Customer checkout creation for QRIS/Midtrans Snap payment.
- Midtrans redirect/callback handling.
- Payment retry by refreshing a Snap transaction for pending local transactions.
- Customer transaction history and transaction status polling.
- Cashier transaction polling by outlet.
- Cashier status updates for Laravel-created transactions.
- A generic Midtrans Snap test/helper endpoint.

It does not appear to own the main menu, outlet, user, auth, stock, admin report, or full transaction lifecycle logic. Those areas are primarily covered by the .NET backend in the existing architecture.

## Main Modules

| Module | Files | Notes |
| --- | --- | --- |
| API routes | `routes/api.php` | Defines 10 API routes, all handled by `ApiController`. |
| Web route | `routes/web.php` | Only default `/` welcome view. No Inertia or business web route. |
| Console/scheduler | `routes/console.php` | Only Laravel starter `inspire` command. No scheduler or domain commands. |
| Payment/transaction controller | `app/Http/Controllers/ApiController.php` | Contains all transaction queries, transaction creation, Midtrans Snap calls, callback handling, and cashier status updates. |
| .NET token bridge middleware | `app/Http/Middleware/CheckDotnetToken.php` | Validates bearer token against the .NET `UserToken` table and injects current user fields into the Laravel request. |
| Eloquent models | `app/Models/Transaction.php`, `TransactionItem.php`, `MenuItems.php`, `Outlets.php` | Map to existing PascalCase SQL Server tables/columns. |
| Laravel starter user model | `app/Models/User.php` | Default Laravel user model, not aligned with the existing .NET `Users` table shape. |
| Midtrans config | `config/services.php` | Adds `services.midtrans.*` config. Values should come from env in the target app. Do not preserve committed fallback credential values. |
| Queue config | `config/queue.php`, `database/migrations/0001_01_01_000002_create_jobs_table.php` | Database queue is configured, but no app jobs were found. |

## Payment Gateway Provider

- Provider: Midtrans.
- Package: `midtrans/midtrans-php`.
- Classes used:
  - `Midtrans\Config`
  - `Midtrans\Snap`
- `Midtrans\Notification` is imported in `ApiController` but is not used.

Payment methods are not fully modeled. `createTransaction()` stores `PaymentMethod` as `QRIS`, but the Snap payload does not restrict enabled payments. `createSnap()` accepts optional `enabled_payments` and defaults to several Midtrans methods.

## Auth And Security Mechanism

API routes mostly use custom middleware alias `auth.dotnet`, registered in `bootstrap/app.php`.

`auth.dotnet` behavior in `app/Http/Middleware/CheckDotnetToken.php`:

- Reads `Authorization: Bearer <token>`.
- Looks up the exact token string in SQL Server table `UserToken`.
- Rejects missing, unknown, revoked, or expired tokens.
- Decodes the JWT payload manually without cryptographic signature verification.
- Merges these request fields:
  - `current_user_id` from `UserToken.UserId`
  - `current_username` from JWT `unique_name`
  - `current_role` from JWT `role`
  - `current_outlet_id` from JWT `OutletId`
  - `jwt_full_payload`

Security notes:

- Token existence/revocation is checked against DB, but JWT signature is not verified by Laravel.
- Endpoint-level authorization is minimal. For example, any valid token can request any `user_id` in `/transactions/user` or any `outlet_id` in `/transactions/outlet`.
- `cashierUpdateTransactionStatus` optionally validates `outlet_id` only if the caller supplies it.
- `/api/midtrans/callback` uses `guest`, not `auth.dotnet`, and is public.
- The callback currently does not validate a Midtrans signature or status payload.

## Queue And Job Usage

- `QUEUE_CONNECTION=database` is present in `.env.example`.
- `config/queue.php` is Laravel default database queue configuration.
- `database/migrations/0001_01_01_000002_create_jobs_table.php` creates `jobs`, `job_batches`, and `failed_jobs`.
- No application jobs were found under `app/Jobs`.
- No event/listener classes were found.
- No queued payment webhook processing currently exists.

## Webhook / Callback Usage

The only payment callback route is:

- `GET /api/midtrans/callback` -> `ApiController@paymentCallback`

Behavior:

- Reads `order_id` from request input.
- Expects an order id shaped like `TRX-{transactionId}`.
- Finds `Transactions.Id`.
- Sets `Transactions.Status = 1`.
- Redirects to `https://kantin.jackserver.site/app/orders/{transactionId}` unless JSON is requested.

Important migration note:

- This looks more like a Midtrans browser redirect/finish callback than a full server-to-server payment notification handler. It does not use `Midtrans\Notification`, does not inspect `transaction_status`, and does not verify `signature_key`.

## Database Usage

`.env.example` sets `DB_CONNECTION=sqlsrv`, and the active domain models map to PascalCase tables and columns matching the .NET data model:

- `Transactions`
- `TransactionItems`
- `MenuItems`
- `Outlets`
- `UserToken` through query builder in middleware

The Laravel migrations are mostly starter/framework tables:

- `users`, `password_reset_tokens`, `sessions`
- `cache`, `cache_locks`
- `jobs`, `job_batches`, `failed_jobs`
- `personal_access_tokens`

No Laravel migration was found for the existing PascalCase domain tables. Assumption: this API is reading/writing the existing .NET SQL Server database schema directly.

## External Integrations

| Integration | Files | Purpose |
| --- | --- | --- |
| Midtrans Snap | `composer.json`, `config/services.php`, `app/Http/Controllers/ApiController.php` | Create Snap redirect URLs/tokens for checkout and retry. |
| .NET auth database | `app/Http/Middleware/CheckDotnetToken.php` | Validate existing JWTs against `UserToken`. |
| Existing frontend backup API calls | `docs/migration-context/04_FRONTEND_API_USAGE.md` | Checkout, history, tracking, cashier polling, and cashier status update use this Laravel API. |

## Tests

Only Laravel starter tests were found:

- `tests/Feature/ExampleTest.php`
- `tests/Unit/ExampleTest.php`

No tests currently cover transaction creation, Midtrans flows, callback handling, token middleware, or cashier status updates.

## Notes For Target Laravel + Inertia App

- Preserve the active Midtrans checkout behavior before replacing internals.
- Move payment logic out of `ApiController` into dedicated controllers/actions/services:
  - `Customer\OrderController@store`
  - `Customer\PaymentController@refreshSnap`
  - `Payment\MidtransCallbackController`
  - `Cashier\OrderStatusController@update`
  - `App\Services\Payments\MidtransSnapService`
- Use Form Requests for validation instead of inline controller validation.
- Replace `.NET UserToken` middleware with Laravel session auth for Inertia pages, but keep a temporary compatibility middleware only while old React/.NET clients still call the API.
- Normalize model/table names in the new app only after a deliberate data migration plan. This existing project intentionally targets PascalCase .NET tables.
- Add a real public Midtrans notification endpoint with signature verification and idempotent status updates before production cutover.
- Do not carry committed fallback Midtrans credential values into the target config; use env-only secrets.
