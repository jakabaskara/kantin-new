# .NET Backend Overview

## Detected Runtime And Packages

- Project file: `Kantin_Paramadina.csproj`
- Target framework: `.NET 8` via `<TargetFramework>net8.0</TargetFramework>`.
- Main packages:
  - `Microsoft.AspNetCore.Authentication.JwtBearer`
  - `Microsoft.EntityFrameworkCore.SqlServer`
  - `Microsoft.EntityFrameworkCore.Tools`
  - `AutoMapper`
  - `BCrypt.Net-Next`
  - `Swashbuckle.AspNetCore`
  - `System.IdentityModel.Tokens.Jwt`

## Project Structure

| Path | Purpose |
| --- | --- |
| `Program.cs` | App bootstrap, DI registration, JWT auth, CORS, middleware pipeline, Swagger, SignalR hub mapping. |
| `Controllers/*Controller.cs` | REST API endpoints for auth, users, menu, outlets, transactions, reports, payment, and transaction status. |
| `Model/*.cs` | EF Core entity models and Midtrans request/response models. |
| `DTO/*.cs` | Request and response DTOs, mostly with DataAnnotations validation. |
| `Data/ApplicationDbContext.cs` | EF Core DbContext and DbSet declarations. Namespace is `Kantin_Paramadina.Model` despite living under `Data/`. |
| `Mappings/MappingProfile.cs` | AutoMapper entity-to-DTO and DTO-to-entity mapping rules. |
| `Middleware/TokenRevocationMiddleware.cs` | Custom bearer-token database revocation check. |
| `Service/MidtransSnapService.cs` | Midtrans Snap HTTP client integration. |
| `Hubs/TransactionHub.cs` | SignalR hub for outlet transaction notifications. |
| `appsettings.json` and `appsettings.Development.json` | Configuration. Contains DB/JWT/Midtrans settings; secrets must be moved to environment variables in migration. |

## Main Modules

- Auth:
  - `Controllers/AuthController.cs`
  - `Model/User.cs`
  - `Model/UserToken.cs`
  - `DTO/LoginDto.cs`
  - inline `RegisterRequest` class inside `AuthController.cs`
- User management:
  - `Controllers/UserController.cs`
  - `DTO/UserCreateDto.cs`, `DTO/UserUpdateDto.cs`, `DTO/UserDto.cs`
- Menu and stock:
  - `Controllers/MenuController.cs`
  - `Model/MenuItem.cs`, `Model/Stock.cs`
  - `DTO/MenuItemCreateDto.cs`, `DTO/MenuItemUpdateDto.cs`, `DTO/MenuItemDto.cs`
- Outlets:
  - `Controllers/OutletsController.cs`
  - `Model/Outlet.cs`
  - `DTO/OutletCreateDto.cs`, `DTO/OutletUpdateDto.cs`, `DTO/OutletDto.cs`
- Transactions:
  - `Controllers/TransactionsController.cs`
  - `Controllers/TransactionStatusController.cs`
  - `Model/Transaction.cs`, `Model/TransactionItem.cs`
  - `DTO/TransactionCreateDto.cs`, `DTO/TransactionFormDto.cs`, `DTO/TransactionDto.cs`
- Reports:
  - `Controllers/ReportsController.cs`
- Payment/Midtrans:
  - `Controllers/PaymentController.cs`
  - `Service/MidtransSnapService.cs`
  - `Model/MidtransSnapRequest.cs`, `Model/MidtransSnapResponse.cs`

## Auth Approach

- Authentication uses JWT bearer tokens.
- Passwords are hashed with BCrypt in `AuthController.Register`, `AuthController.Login`, `UserController.Create`, and `UserController.Update`.
- Login stores the issued JWT in the `UserToken` table with `ExpiredAt` and `Revoked`.
- Logout marks a matching `UserToken` row as revoked.
- `TokenRevocationMiddleware` checks the `Authorization: Bearer ...` token against `UserToken` for all requests except `/api/auth/login` and `/api/auth/register`.
- Token expiry:
  - `AuthController.Login` hardcodes `DateTime.UtcNow.AddHours(1)`.
  - The unused private `GenerateJwtToken` helper reads `Jwt:ExpireHours`.
  - Migration should preserve the active behavior or explicitly choose one token/session lifetime.

Important behavior to preserve or intentionally fix:

- The revocation middleware returns `401` for missing bearer tokens even on controller actions without `[Authorize]`.
- The JWT claims expected by several controllers are inconsistent:
  - Some code reads `ClaimTypes.NameIdentifier` and `ClaimTypes.Role`.
  - Some code reads string claims such as `"userId"`, `"role"`, `"username"`, and `"OutletId"`.
  - The frontend docs expect JWT claims like `nameid`, `unique_name`, `role`, and `OutletId`.
- Several transaction/payment endpoints may fail authorization because they read `"userId"` and `"role"` claims that are not issued by `AuthController.Login` as explicit claim names.

## Database Approach

- EF Core with SQL Server.
- DbContext: `Data/ApplicationDbContext.cs`.
- DbSets:
  - `Outlets`
  - `MenuItems`
  - `Stocks`
  - `Transactions`
  - `TransactionItems`
  - `Users`
  - `UserToken`
- Migrations folder was not found in the repository.
- Fluent configuration is minimal:
  - `Transaction.TotalAmount` has precision `18,2`.
- Other schema details rely on EF Core conventions plus DataAnnotations on entity classes.
- No repository layer was found; controllers use `ApplicationDbContext` directly.

## Dependency Injection And Services

Registered in `Program.cs`:

- `ApplicationDbContext` using SQL Server.
- JWT bearer authentication and authorization.
- CORS policy `AllowReactApp`.
- `HttpClient` typed client for `MidtransSnapService`.
- SignalR.
- AutoMapper profile `MappingProfile`.
- Controllers and Swagger.

No domain service layer exists except `MidtransSnapService`; most business logic currently lives inside controllers.

## Middleware And Pipeline

Pipeline order in `Program.cs`:

1. Swagger in development.
2. HTTPS redirection.
3. Static files.
4. Routing.
5. CORS policy `AllowReactApp`.
6. JWT authentication.
7. `TokenRevocationMiddleware`.
8. Authorization.
9. Controllers.
10. SignalR hub at `/transactionHub`.

Notes:

- Static files are enabled for uploaded images and QRIS/payment proof paths.
- CORS allows production frontend `https://kantin.jackserver.site` and local Vite `http://localhost:5173`.
- `AllowCredentials()` is enabled, mainly useful for SignalR/cookies.

## External Integrations

- SQL Server via EF Core.
- Midtrans Snap sandbox endpoint in `MidtransSnapService`.
- SignalR real-time notifications:
  - `TransactionCreated`
  - `TransactionStatusUpdated`
  - Outlet group names use `Outlet_{outletId}`.
- Swagger/OpenAPI in development.

Payment note:

- This .NET project contains `POST /api/payment/snap`, but current frontend documentation shows active payment/order creation calls going to the separate backup/special Laravel API (`env.backupApiUrl`) for `/transactions`, `/transactions/refresh-snap`, and cashier flows.
- Treat this .NET payment endpoint as legacy or incomplete until the separate Laravel API is inspected.

## Notes For Laravel Migration

- Prefer Laravel session auth for the Inertia rewrite unless a public token API must remain.
- If token auth is still required, use Sanctum and store/revoke personal access tokens server-side.
- Move controller business rules into Laravel Form Requests, policies, actions/services, and database transactions.
- Use Eloquent models:
  - `User`, `Outlet`, `MenuItem`, `Stock`, `Transaction`, `TransactionItem`, `UserToken` or Sanctum token model.
- Use Laravel migrations to explicitly define foreign keys, indexes, unique username constraint, decimal precision, file path columns, and timestamps.
- Replace AutoMapper with Eloquent API Resources or Inertia props.
- Replace DataAnnotations with Form Request validation.
- Replace SignalR with Laravel broadcasting/events if live cashier/order notifications are retained.
- Move secrets from `appsettings.json` into `.env` and never commit them.
- Decide whether to preserve the current broad token middleware behavior. For Laravel/Inertia, web pages should normally use `auth` middleware and not require browser-managed bearer tokens.

