# Auth And Permission Flow

## Login Flow

Files:

- `src/pages/auth/LoginPage.tsx`
- `src/hooks/useAuth.ts`
- `src/services/auth.service.ts`
- `src/components/auth/GuestRoute.tsx`
- `src/components/auth/ProtectedRoute.tsx`

Flow:

1. `LoginPage` validates `{ username, password }` with Zod.
2. `useAuth.login` calls `authService.login(credentials)` through a TanStack mutation.
3. `authService.login` posts to `POST /Auth/login`.
4. Response is expected to contain `{ token }`.
5. JWT is decoded with `jwtDecode<JwtPayload>()`.
6. Decoded claims become a frontend `User`:
   - `id = parseInt(decoded.nameid)`
   - `username = decoded.unique_name`
   - `role = decoded.role`
   - `outletId = decoded.OutletId ? parseInt(decoded.OutletId) : null`
   - `fullName = decoded.fullName || ''`
7. Auth data is saved to localStorage:
   - `token`
   - `user`
   - `outletId`
   - `fullName`
8. `useAuth` redirects by role:
   - `Admin` -> `/admin`
   - `Kasir` or `Cashier` -> `/cashier`
   - everything else -> `/app`

TODO: `authService.login` stores `fullName` as `user.username`, not `user.fullName`. Confirm whether this is intentional.

## Register Flow

Files:

- `src/pages/auth/RegisterPage.tsx`
- `src/hooks/useAuth.ts`
- `src/services/auth.service.ts`

Flow:

1. `RegisterPage` validates `username`, `fullName`, `password`, `confirmPassword`.
2. `useAuth.register` calls `authService.register(data)`.
3. `authService.register` posts to `POST /Auth/register` with submitted fields and forced `role: 'Customer'`.
4. Backend response is logged only.
5. User is redirected to `/login`.
6. There is no auto-login after register.

## Logout Flow

There are two logout implementations:

- `useAuth.logout()` is the one used by layouts/profile:
  - removes `token`
  - removes `user`
  - clears React Query cache
  - shows `Logout berhasil`
  - navigates to `/login`
- `authService.logout()` exists but is not used by `useAuth.logout()`:
  - posts to `POST /Auth/logout`
  - removes `token`
  - removes `user`

TODO: Decide whether Laravel migration should call a backend logout route. For session auth, it should.

## Token/Session Storage

Storage keys:

| Key | Set In | Read In | Notes |
| --- | --- | --- | --- |
| `token` | `src/services/auth.service.ts` | `src/hooks/useAuth.ts`, `src/lib/axios.ts`, direct backup API calls | JWT bearer token. No expiration handling. |
| `user` | `src/services/auth.service.ts` | `src/hooks/useAuth.ts`, `authService.getCurrentUser()` | JSON string of decoded user. |
| `outletId` | `src/services/auth.service.ts` | `src/hooks/useAuth.ts` | Stored separately for convenience. |
| `fullName` | `src/services/auth.service.ts` | `src/hooks/useAuth.ts` | Currently stores username. TODO. |
| `order_{transaction_id}` | `src/pages/customer/CheckoutPage.tsx` | No current read detected | Stores order snapshot after creating backup transaction. |

The shared Axios client adds `Authorization: Bearer <token>` automatically. Backup API calls manually add the same header.

## Protected Route Behavior

`ProtectedRoute` in `src/components/auth/ProtectedRoute.tsx`:

- Calls `useAuth()` and `useLocation()`.
- If not authenticated, redirects to `/login` with `state={{ from: location }}`.
- If `allowedRoles` is provided and `user.role` is not included, redirects to `/unauthorized`.
- Logs checks to the browser console.

`GuestRoute` in `src/components/auth/GuestRoute.tsx`:

- If authenticated and user exists:
  - `Admin` -> `/admin`
  - all other authenticated roles -> `/app`
- TODO: This does not redirect `Kasir`/`Cashier` to `/cashier`, unlike `useAuth.login()`.

## Role/Permission Checks

Role checks are route-level only:

- Customer app: `["Customer", "Mahasiswa"]`.
- Admin: `["Admin"]`.
- Cashier: `["Kasir", "Cashier"]`.

No fine-grained permission checks were found in page actions. Admin actions are assumed allowed because route group requires Admin.

## Redirect Behavior

- `/` always redirects to `/login`.
- Login success redirects based on role after a 100ms timeout.
- Register success redirects to `/login`.
- Logout redirects to `/login`.
- Unauthorized role redirects to `/unauthorized`.
- Customer checkout redirects browser to `snap_redirect_url` with `window.location.href`.
- Payment retry in order tracking redirects browser to `snap_redirect_url`.

## User Object Shape

Frontend `User` type in `src/types/auth.types.ts`:

```ts
export interface User {
    id: number;
    username: string;
    fullName: string;
    role: string;
    outletId?: number | null;
    email?: string;
    phone?: string;
}
```

JWT payload shape expected by frontend:

```ts
export interface JwtPayload {
    nameid: string;
    unique_name: string;
    role: string;
    OutletId?: string;
    nbf: number;
    exp: number;
    iat: number;
    iss: string;
    aud: string;
    fullName?: string;
}
```

User management DTO in `src/services/user.service.ts`:

```ts
export interface UserDto {
    id: number;
    username: string;
    role: string;
    fullName: string | null;
    outletId: number | null;
    createdAt: string;
}
```

## Suggested Laravel Inertia Auth Migration Notes

- Prefer Laravel session auth over frontend-stored JWT if the rewrite is a single Laravel + Inertia app.
- Share authenticated user with Inertia globally, for example `auth.user`, including `id`, `username`, `fullName`, `role`, and `outletId`.
- Replace `ProtectedRoute` with Laravel middleware:
  - `auth`
  - role middleware such as `role:Admin`, `role:Kasir,Cashier`, `role:Customer,Mahasiswa`.
- Replace `GuestRoute` with Laravel `guest` middleware.
- Move role-based post-login redirect to Laravel controller or `authenticated()` hook.
- Use Inertia `router.post(route('logout'))` for logout.
- Avoid keeping JWT in `localStorage` unless the frontend must call an external API directly.
- If backup/Laravel special APIs remain separate, consider server-side proxy/controller calls so browser code does not need multiple base URLs or bearer-token plumbing.
- TODO: Confirm whether roles are canonicalized as Indonesian (`Kasir`, `Mahasiswa`) or English (`Cashier`, `Customer`) in the target Laravel domain.
