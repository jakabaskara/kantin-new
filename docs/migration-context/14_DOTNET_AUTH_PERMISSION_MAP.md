# .NET Auth And Permission Map

## Authentication Mechanism

Source files:

- `Program.cs`
- `Controllers/AuthController.cs`
- `Middleware/TokenRevocationMiddleware.cs`
- `Model/User.cs`
- `Model/UserToken.cs`

Authentication uses JWT bearer tokens:

- `Program.cs` registers `JwtBearerDefaults.AuthenticationScheme`.
- Token validation checks issuer, audience, lifetime, and signing key.
- `AuthController.Login` creates JWT tokens and returns `{ token }`.
- Issued JWTs are also stored in `UserToken`.
- `TokenRevocationMiddleware` verifies that a bearer token exists in `UserToken`, is not revoked, and has not expired.

Password handling:

- Passwords are hashed with `BCrypt.Net.BCrypt.HashPassword`.
- Login verifies with `BCrypt.Net.BCrypt.Verify`.

Suggested Laravel migration:

- For Laravel + Inertia, prefer session authentication:
  - Laravel `web` guard.
  - login via session cookie and CSRF.
  - shared Inertia `auth.user` prop.
- If API token compatibility remains necessary, use Sanctum:
  - browser SPA can still use session mode if same domain.
  - machine/mobile tokens can use Sanctum personal access tokens.

## Token Lifecycle

Active .NET behavior:

1. Login validates username/password.
2. JWT is generated.
3. Token expiry is set to `DateTime.UtcNow.AddHours(1)`.
4. Token row is inserted into `UserToken` with `ExpiredAt` and `Revoked = false`.
5. Each protected request must include `Authorization: Bearer <token>`.
6. Middleware rejects missing, unknown, revoked, or expired tokens.
7. Logout finds the exact token string and marks it revoked.

Notes:

- `Jwt:ExpireHours` exists in config and is used by a private helper, but the active `Login` action hardcodes one hour.
- Existing frontend does not currently call backend logout in `useAuth.logout()` according to `05_AUTH_AND_PERMISSION_FLOW.md`.
- Frontend stores JWT in `localStorage`.

Suggested Laravel migration:

- Session auth:
  - no JWT in localStorage.
  - `POST /login` creates session.
  - `POST /logout` invalidates session and regenerates CSRF token.
  - session lifetime configured in `config/session.php`.
- Sanctum token auth if needed:
  - issue token on login only for API clients.
  - revoke current token on logout.
  - do not store full raw token in a custom table.

## Claims

JWT creation in `AuthController.Login` uses:

- `ClaimTypes.NameIdentifier` with user id.
- `ClaimTypes.Name` with username.
- `ClaimTypes.Role` with role.
- custom `"OutletId"` with nullable outlet id converted to string.

JWT bearer config in `Program.cs`:

- `JwtSecurityTokenHandler.DefaultMapInboundClaims = false`.
- `NameClaimType = "username"`.
- `RoleClaimType = "role"`.

Frontend expected claims from existing docs:

- `nameid`
- `unique_name`
- `role`
- `OutletId`
- `nbf`, `exp`, `iat`, `iss`, `aud`
- optional `fullName`

Claim inconsistencies in backend:

| Source | Claims read |
| --- | --- |
| `UserController.cs` | `ClaimTypes.Role`, `ClaimTypes.NameIdentifier` |
| `OutletsController.cs` | `"role"`, `"OutletId"` |
| `TransactionsController.cs` | `"userId"`, `"role"` |
| `TransactionStatusController.cs` | `ClaimTypes.NameIdentifier`, `ClaimTypes.Role` |
| `PaymentController.cs` | `"username"`, `"userId"`, `"role"` |

Important migration note:

- Do not preserve these inconsistencies. In Laravel, derive identity from `Auth::user()` and use policies/middleware instead of manually parsing claim strings.
- If preserving JWT API compatibility, define one canonical token payload and update all code to use it consistently.

## Authorization Mechanism

The project uses a mix of:

- `[Authorize]` attributes.
- Custom token-revocation middleware.
- Manual role checks inside controller actions.
- Manual ownership/outlet checks inside controller actions.

No centralized policy/permission layer was found.

## Roles And Permissions

Roles detected in backend source:

- `Admin`
- `Cashier`
- `Customer`

Roles detected in frontend docs:

- `Admin`
- `Kasir`
- `Cashier`
- `Customer`
- `Mahasiswa`

TODO:

- Decide canonical target roles. The Laravel app should avoid mixing `Kasir` and `Cashier` unless both are intentionally supported aliases.

Permission behavior found:

| Area | Current rule |
| --- | --- |
| Register | Public. Cashier requires outlet id. |
| Login | Public. |
| Logout | Authenticated token required. |
| User list/detail | `[Authorize]`, but no admin-only check for read. |
| User create/delete | Admin only by manual role check. |
| User update | Admin or same user. |
| Menu read/write/delete | No role check in controller. Middleware still requires a valid token. |
| Outlet read | No role check in controller. Middleware still requires token. |
| Outlet create | Manual admin role check. |
| Outlet update | Admin or user assigned to same outlet. |
| Reports | No role check in controller. Middleware still requires token. |
| Transactions | Intended admin/all, cashier/outlet, customer/own. Some logic may be broken by claim mismatch. |
| Transaction status | Admin/all, cashier/outlet, customer/own. |
| Payment snap | Authenticated. Amount hardcoded. |
| SignalR hub | Authenticated. Client joins/leaves outlet groups by supplied outlet id; no explicit server-side outlet authorization in hub method. |

Suggested Laravel authorization:

- Middleware:
  - `auth`
  - `guest`
  - role middleware for broad route groups if needed.
- Policies:
  - `UserPolicy`
  - `OutletPolicy`
  - `MenuItemPolicy`
  - `TransactionPolicy`
  - `ReportPolicy` or admin middleware for reports.
- Gates or enum methods for role checks:
  - `isAdmin()`
  - `isCashier()`
  - `isCustomer()`
- Broadcast channels:
  - authorize `outlet.{id}` by checking admin role or user's `outlet_id`.

## Guards And Middleware

.NET:

- JWT bearer auth scheme.
- Custom `TokenRevocationMiddleware`.
- `[Authorize]` attributes.

Laravel:

- Use `web` guard for Inertia routes.
- Optional `sanctum` guard for API endpoints.
- Replace revocation middleware with:
  - session invalidation for web.
  - Sanctum token revocation for token APIs.
- Add route middleware examples:
  - `Route::middleware(['auth', 'role:Admin'])->prefix('admin')...`
  - `Route::middleware(['auth'])->patch('/transactions/{transaction}/status', ...)`

## Password Handling

.NET behavior:

- BCrypt hashing and verification.
- Password min length exists on `UserCreateDto` only.
- Register inline DTO has no DataAnnotations, but frontend validates.
- User update allows optional password max 100 with no minimum length.

Laravel migration:

- Use `Hash::make` and `Hash::check`.
- Enforce consistent password rules in Form Requests:
  - registration/create: required, min length.
  - update: nullable, min length when present.
- Consider Laravel password validation defaults if appropriate.

## Error Handling Shape

Common .NET responses:

- String errors, e.g. `"Username sudah digunakan."`
- Object errors, e.g. `{ message = "..." }`
- ModelState validation objects.
- `401` string from middleware, e.g. `"Authorization header missing."`
- `500 { message, error }` in transaction creation.

Laravel migration:

- For Inertia form submissions, use validation errors in the session.
- For JSON endpoints, standardize:
  - `422` validation errors.
  - `401` unauthenticated.
  - `403` unauthorized.
  - `404` not found.
  - consistent `{ message, errors? }` JSON.

## Recommended Laravel Auth Shape

For the target Laravel + Inertia + React rewrite:

1. Use Laravel session auth as default.
2. Share authenticated user through Inertia:
   - `id`
   - `username`
   - `fullName`
   - `role`
   - `outletId`
3. Replace frontend `ProtectedRoute` with Laravel route middleware.
4. Replace frontend JWT decoding with server-provided props.
5. Use policies for object-level checks.
6. Keep token auth only for external clients or if the separate Laravel payment API requires it.
7. For cashier live updates, authorize broadcast channels by role/outlet membership.

