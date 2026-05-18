# UI Preservation Guide

This guide consolidates the existing React frontend design system for the Laravel + Inertia + React rewrite. The goal is technical migration first, visual redesign later.

## Final Color Palette

Preserve the CSS variables from `src/index.css`, documented in `docs/migration-context/02_UI_DESIGN_SYSTEM.md`.

### Light Mode Tokens

| Token | Value |
| --- | --- |
| `--background` | `oklch(1.0000 0 0)` |
| `--foreground` | `oklch(0.3211 0 0)` |
| `--card` | `oklch(1.0000 0 0)` |
| `--card-foreground` | `oklch(0.3211 0 0)` |
| `--popover` | `oklch(1.0000 0 0)` |
| `--popover-foreground` | `oklch(0.3211 0 0)` |
| `--primary` | `oklch(0.4900 0.1077 242.6503)` |
| `--primary-foreground` | `oklch(1.0000 0 0)` |
| `--secondary` | `oklch(0.9670 0.0029 264.5419)` |
| `--secondary-foreground` | `oklch(0.4461 0.0263 256.8018)` |
| `--muted` | `oklch(0.9846 0.0017 247.8389)` |
| `--muted-foreground` | `oklch(0.5510 0.0234 264.3637)` |
| `--accent` | `oklch(0.9514 0.0250 236.8242)` |
| `--accent-foreground` | `oklch(0.3791 0.1378 265.5222)` |
| `--destructive` | `oklch(0.6368 0.2078 25.3313)` |
| `--destructive-foreground` | `oklch(1.0000 0 0)` |
| `--border` / `--input` | `oklch(0.9276 0.0058 264.5313)` |
| `--ring` | `oklch(0.6231 0.1880 259.8145)` |
| `--sidebar` | `oklch(0.9846 0.0017 247.8389)` |
| `--sidebar-primary` | `oklch(0.6231 0.1880 259.8145)` |

### Dark Mode Tokens

| Token | Value |
| --- | --- |
| `--background`, `--sidebar` | `oklch(0.2046 0 0)` |
| `--foreground`, `--card-foreground`, `--popover-foreground`, `--secondary-foreground` | `oklch(0.9219 0 0)` |
| `--card`, `--popover`, `--secondary` | `oklch(0.2686 0 0)` |
| `--primary`, `--ring`, `--sidebar-primary` | `oklch(0.6231 0.1880 259.8145)` |
| `--muted` | `oklch(0.2393 0 0)` |
| `--muted-foreground` | `oklch(0.7155 0 0)` |
| `--accent`, `--sidebar-accent` | `oklch(0.3791 0.1378 265.5222)` |
| `--accent-foreground`, `--sidebar-accent-foreground` | `oklch(0.8823 0.0571 254.1284)` |
| `--destructive` | `oklch(0.6368 0.2078 25.3313)` |
| `--border`, `--input`, `--sidebar-border` | `oklch(0.3715 0 0)` |

### Hardcoded Utility Colors To Preserve

- Primary/action: `bg-primary`, `text-primary`, `hover:bg-primary/90`.
- Blue accents: `blue-50`, `blue-100`, `blue-500`, `blue-600`, `blue-700`, `blue-800`, `border-blue-*`, `from-blue-*`, `to-blue-*`.
- Neutrals: `slate-50`, `slate-100`, `slate-200`, `slate-400`, `slate-500`, `slate-600`, `slate-700`, `slate-900`, `border-slate-*`.
- Success: `green-50`, `green-100`, `green-500`, `green-600`, `green-700`.
- Warning: `yellow-50`, `yellow-100`, `yellow-700`, `orange-50`, `orange-100`, `orange-600`, `orange-700`.
- Error: `red-50`, `red-100`, `red-500`, `red-600`, `red-700`, `red-800`.
- Neutral unknown state: `gray-100`, `gray-700`.

Do not replace the design with a different brand palette during migration.

## Typography

Preserve token names:

- `--font-sans: Inter, sans-serif`
- `--font-serif: Source Serif 4, serif`
- `--font-mono: JetBrains Mono, monospace`

TODO: Existing docs found no font import in `src/index.css` or `index.html`. Confirm whether fonts are loaded elsewhere or add a deliberate loading strategy.

Common typography:

- Auth titles: `text-3xl font-bold tracking-tight`.
- Admin page titles: `text-3xl font-bold text-slate-900`.
- Customer/cashier page titles: `text-2xl md:text-3xl font-bold text-slate-900`.
- Dialog titles: `text-lg font-semibold leading-none tracking-tight`, sometimes `text-2xl`.
- Captions/body: `text-sm text-slate-500`, `text-xs text-slate-500`, `text-sm text-slate-600`.
- Labels: `text-sm font-medium leading-none`.

## Layout Rules

Preserve these patterns:

- Admin content padding: `p-4 lg:p-8`.
- Cashier content padding: `p-4 md:p-6 lg:p-8`.
- Customer content: `container mx-auto px-4 py-6`, with fixed header/top spacing and mobile bottom nav.
- Page sections commonly use `space-y-6`.
- Stats grids: `grid grid-cols-1 md:grid-cols-3/4 gap-4`.
- Menu cards: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.
- Cashier payment layout: `grid grid-cols-1 lg:grid-cols-3 gap-6`.
- Tables use `overflow-x-auto`, `border-b`, `py-3 px-4`, and `hover:bg-slate-50`.
- Cards use `rounded-xl border bg-card text-card-foreground shadow`.
- Dialog overlays/content follow the existing Radix/shadcn behavior.

Layout-specific preservation:

- `AdminLayout`: white desktop sidebar `w-64`, slate borders, primary active links, mobile overlay.
- `CustomerLayout`: translucent fixed header, desktop sidebar below header, active nav primary/blue, mobile bottom nav.
- `CashierLayout`: wider sidebar `w-72`, slate/blue gradient page background, primary active nav.
- `AuthLayout`: split desktop image area, dark overlay, form card with `bg-white/80 backdrop-blur-sm lg:bg-white p-8 rounded-2xl shadow-xl border border-slate-100`, and particles.

## Components To Reuse

Reuse mostly as-is with import path changes:

- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/radio-group.tsx`
- `src/lib/utils.ts`

## Components To Refactor

Refactor lightly:

- `src/components/layouts/AdminLayout.tsx`: replace React Router APIs with Inertia `Link`, children, route matching, and shared auth props.
- `src/components/layouts/CustomerLayout.tsx`: same as above; also resolve `/app/cart` link with no declared route.
- `src/components/layouts/CashierLayout.tsx`: consume `auth.user.outletId` from Inertia props.
- `src/components/layouts/AuthLayout.tsx`: replace `Outlet` with children and fix asset paths.
- `src/components/ui/form.tsx`: reuse if keeping React Hook Form for client feedback; otherwise refactor pages toward Inertia `useForm` while keeping labels/messages styling.
- `src/components/ui/particles.tsx`: verify browser-only canvas lifecycle under Inertia.
- `src/lib/image-utils.ts`: update base URL behavior to Laravel storage/public asset URLs.
- `src/components/common/Logo.tsx`: fix asset path; existing path uses `/assets/img/...` while actual asset is under `src/assets/img`.

## Components To Rewrite Or Remove

- `src/components/auth/ProtectedRoute.tsx`: replace with Laravel middleware and policies.
- `src/components/auth/GuestRoute.tsx`: replace with Laravel guest middleware and server redirects.
- `src/hooks/useAuth.ts`: replace with Inertia shared props and Laravel auth routes.
- `src/lib/axios.ts`: remove for migrated Inertia pages; keep only a scoped client for retained JSON endpoints if necessary.
- `src/lib/react-query.ts`: keep only if polling/live queries remain; do not use as the default page data layer.
- `src/components/layouts/DashboardLayout.tsx`, `src/pages/Home.tsx`, `src/pages/About.tsx`: unmounted/sample; do not port unless requirements appear.

## Tailwind / Theme Recommendation

The target project uses Tailwind CSS v4. Follow v4 syntax:

```css
@import "tailwindcss";

@theme {
  --color-primary: var(--primary);
}
```

Recommendations:

- Put preserved variables in `resources/css/app.css`.
- Use CSS-first `@theme`; do not introduce a Tailwind v3-style config unless the project already requires it.
- Avoid deprecated v3 utilities such as `bg-opacity-*`, `text-opacity-*`, `flex-shrink-*`, and `overflow-ellipsis`.
- Preserve existing utility classes first. Normalize only after behavior is migrated.
- Confirm whether `bg-linear-*` utilities from the old code are valid in target Tailwind v4; migrate to valid gradient syntax if needed.

## Inertia Layout Recommendation

- Use role-specific persistent layouts:
  - `AuthLayout` for login/register.
  - `AdminLayout` for `/admin/*`.
  - `CustomerLayout` for `/app/*`.
  - `CashierLayout` for `/cashier/*`.
- Layouts should accept `children`.
- Navigation should use Inertia `Link`.
- Active nav should use route names, Wayfinder, or `usePage().url`.
- Logout should submit to Laravel logout route.
- Layout user panels should consume `usePage().props.auth.user`.

## Avoiding Visual Drift

- Start by porting tokens, UI primitives, layouts, and common utilities before porting pages.
- Keep existing class names where possible during first migration.
- Do not swap shadcn-style primitives for a different UI kit.
- Do not introduce new spacing scale, border radius, or shadows unless fixing a concrete layout issue.
- Preserve page-level empty/loading/error states and toast behavior.
- Compare migrated pages against the documented existing pages:
  - Admin: dashboard cards, sidebar, tables, management dialogs.
  - Customer: menu card grid, cart dialog, checkout overlay, mobile bottom nav.
  - Cashier: active order cards, transaction table/history, gradient background.
- Any deliberate visual change should be documented as an assumption or follow-up, not hidden inside backend migration work.
