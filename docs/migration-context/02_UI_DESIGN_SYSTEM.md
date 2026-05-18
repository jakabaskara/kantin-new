# UI Design System

## Styling Sources

- Global Tailwind/CSS variables: `src/index.css`.
- Tailwind content/config: `tailwind.config.js`.
- shadcn metadata: `components.json`.
- Reusable primitives: `src/components/ui/*`.
- Page/layout hardcoded utilities: `src/pages/**/*`, `src/components/layouts/*`.
- Legacy starter CSS: `src/App.css` contains `#646cffaa`, `#61dafbaa`, `#888`, but `src/App.css` is not imported by `src/main.tsx`; treat as unused unless confirmed otherwise.

## Theme Tokens From `src/index.css`

### Light Mode Colors

| Token | Exact Value | Where Found |
| --- | --- | --- |
| `--background` | `oklch(1.0000 0 0)` | `src/index.css` |
| `--foreground` | `oklch(0.3211 0 0)` | `src/index.css` |
| `--card` | `oklch(1.0000 0 0)` | `src/index.css` |
| `--card-foreground` | `oklch(0.3211 0 0)` | `src/index.css` |
| `--popover` | `oklch(1.0000 0 0)` | `src/index.css` |
| `--popover-foreground` | `oklch(0.3211 0 0)` | `src/index.css` |
| `--primary` | `oklch(0.4900 0.1077 242.6503)` | `src/index.css` |
| `--primary-foreground` | `oklch(1.0000 0 0)` | `src/index.css` |
| `--secondary` | `oklch(0.9670 0.0029 264.5419)` | `src/index.css` |
| `--secondary-foreground` | `oklch(0.4461 0.0263 256.8018)` | `src/index.css` |
| `--muted` | `oklch(0.9846 0.0017 247.8389)` | `src/index.css` |
| `--muted-foreground` | `oklch(0.5510 0.0234 264.3637)` | `src/index.css` |
| `--accent` | `oklch(0.9514 0.0250 236.8242)` | `src/index.css` |
| `--accent-foreground` | `oklch(0.3791 0.1378 265.5222)` | `src/index.css` |
| `--destructive` | `oklch(0.6368 0.2078 25.3313)` | `src/index.css` |
| `--destructive-foreground` | `oklch(1.0000 0 0)` | `src/index.css` |
| `--border` / `--input` | `oklch(0.9276 0.0058 264.5313)` | `src/index.css` |
| `--ring` | `oklch(0.6231 0.1880 259.8145)` | `src/index.css` |
| `--sidebar` | `oklch(0.9846 0.0017 247.8389)` | `src/index.css` |
| `--sidebar-primary` | `oklch(0.6231 0.1880 259.8145)` | `src/index.css` |

### Dark Mode Colors

| Token | Exact Value | Where Found |
| --- | --- | --- |
| `--background`, `--sidebar` | `oklch(0.2046 0 0)` | `.dark` in `src/index.css` |
| `--foreground`, `--card-foreground`, `--popover-foreground`, `--secondary-foreground` | `oklch(0.9219 0 0)` | `.dark` in `src/index.css` |
| `--card`, `--popover`, `--secondary` | `oklch(0.2686 0 0)` | `.dark` in `src/index.css` |
| `--primary`, `--ring`, `--sidebar-primary` | `oklch(0.6231 0.1880 259.8145)` | `.dark` in `src/index.css` |
| `--muted` | `oklch(0.2393 0 0)` | `.dark` in `src/index.css` |
| `--muted-foreground` | `oklch(0.7155 0 0)` | `.dark` in `src/index.css` |
| `--accent`, `--sidebar-accent` | `oklch(0.3791 0.1378 265.5222)` | `.dark` in `src/index.css` |
| `--accent-foreground`, `--sidebar-accent-foreground` | `oklch(0.8823 0.0571 254.1284)` | `.dark` in `src/index.css` |
| `--destructive` | `oklch(0.6368 0.2078 25.3313)` | `.dark` in `src/index.css` |
| `--border`, `--input`, `--sidebar-border` | `oklch(0.3715 0 0)` | `.dark` in `src/index.css` |

## Hardcoded Utility Palette

These Tailwind color utilities are common across pages/layouts:

- Primary/action: `bg-primary`, `text-primary`, `hover:bg-primary/90`, `shadow-primary/20`, `focus-visible:ring-primary`, `focus-visible:border-primary`.
- Blue accents: `bg-blue-50`, `bg-blue-100`, `bg-blue-500`, `bg-blue-600`, `bg-blue-700`, `text-blue-50`, `text-blue-100`, `text-blue-500`, `text-blue-600`, `text-blue-700`, `text-blue-800`, `border-blue-200`, `border-blue-300`, `border-blue-500`, `from-blue-50`, `from-blue-500`, `to-blue-600`.
- Slate neutrals: `bg-slate-50`, `bg-slate-100`, `bg-slate-200`, `text-slate-400`, `text-slate-500`, `text-slate-600`, `text-slate-700`, `text-slate-900`, `border-slate-100`, `border-slate-200`, `border-slate-300`.
- Status colors:
  - Success: `bg-green-50`, `bg-green-100`, `bg-green-500`, `text-green-500`, `text-green-600`, `text-green-700`.
  - Warning: `bg-yellow-50`, `bg-yellow-100`, `text-yellow-700`, `border-yellow-200`; `bg-orange-50`, `bg-orange-100`, `text-orange-600`, `text-orange-700`, `border-orange-200`.
  - Error/destructive: `bg-red-50`, `bg-red-100`, `bg-red-500`, `bg-red-600`, `text-red-600`, `text-red-700`, `text-red-800`, `border-red-200`.
  - Unknown/neutral: `bg-gray-100`, `text-gray-700`.
- Auth particles color: `#000000` in `src/components/layouts/AuthLayout.tsx`.
- Placeholder image colors:
  - Dicebear menu background query: `b6e3f4,c0aede,d1d4f9` in `src/lib/image-utils.ts`.
  - Fallback URL: `https://via.placeholder.com/400x300/E2E8F0/64748B?text=No+Image` in `src/lib/image-utils.ts`.
  - Outlet placeholder query: `fcd34d` in `src/lib/image-utils.ts`.

## Typography

- Font tokens:
  - `--font-sans: Inter, sans-serif`
  - `--font-serif: Source Serif 4, serif`
  - `--font-mono: JetBrains Mono, monospace`
- No font import was found in `src/index.css` or `index.html`; TODO: confirm whether fonts are loaded elsewhere or rely on browser fallback.
- Common heading utilities:
  - Auth titles: `text-3xl font-bold tracking-tight`.
  - Admin page titles: `text-3xl font-bold text-slate-900`.
  - Customer/cashier page titles: `text-2xl md:text-3xl font-bold text-slate-900`.
  - Dialog titles: shadcn default `text-lg font-semibold leading-none tracking-tight`, sometimes overridden to `text-2xl`.
- Body/caption utilities:
  - `text-sm text-slate-500`, `text-xs text-slate-500`, `text-sm text-slate-600`.
  - Labels use `text-sm font-medium leading-none`.

## Spacing And Layout Patterns

- Page wrappers commonly use `space-y-6`.
- Admin content padding: `p-4 lg:p-8` in `AdminLayout`.
- Cashier content padding: `p-4 md:p-6 lg:p-8` in `CashierLayout`.
- Customer content: `container mx-auto px-4 py-6` with `pt-16 pb-20 md:pb-8 md:ml-64`.
- Card content commonly uses `p-4`, `p-5`, or `p-6`.
- Grid patterns:
  - Stats: `grid grid-cols-1 md:grid-cols-3/4 gap-4`.
  - Menu cards: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.
  - Cashier payment: `grid grid-cols-1 lg:grid-cols-3 gap-6`.

## Border Radius

- Global token: `--radius: 0.375rem`.
- shadcn primitives:
  - Button/Input/Select: `rounded-md`.
  - Card: `rounded-xl`.
  - Dialog desktop: `sm:rounded-lg`.
  - Badge: `rounded-full`.
- Page-level patterns: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`.

## Shadows And Elevation

- Global shadows in `src/index.css`: `--shadow-2xs`, `--shadow-xs`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`.
- Card primitive default: `shadow`.
- Common page utilities: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`.
- Hover elevation: `hover:shadow-md`, `hover:shadow-lg`, `hover:shadow-xl`.

## Button Variants

Defined in `src/components/ui/button.tsx`:

- `default`: `bg-primary text-primary-foreground shadow hover:bg-primary/90`
- `destructive`: `bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90`
- `outline`: `border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground`
- `secondary`: `bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80`
- `ghost`: `hover:bg-accent hover:text-accent-foreground`
- `link`: `text-primary underline-offset-4 hover:underline`

Sizes:

- `default`: `h-9 px-4 py-2`
- `sm`: `h-8 rounded-md px-3 text-xs`
- `lg`: `h-10 rounded-md px-8`
- `icon`: `h-9 w-9`

Page overrides frequently create full-width, taller primary buttons such as `h-11`, `h-12`, `h-14`, and gradient cashier buttons.

## Input/Form Styles

- `Input` in `src/components/ui/input.tsx`: `h-9`, `rounded-md`, `border-input`, `px-3`, `py-1`, `shadow-sm`, `placeholder:text-muted-foreground`, focus ring `ring-ring`.
- `Textarea` in `src/components/ui/textarea.tsx`: `min-h-[60px]`, `rounded-md`, `border-input`, `px-3 py-2`.
- Auth page inputs override with `pl-10 bg-slate-50 border-slate-200 focus-visible:ring-primary focus-visible:border-primary h-11`.
- Forms use `react-hook-form` wrappers in `src/components/ui/form.tsx`; validation messages use `text-[0.8rem] font-medium text-destructive`.
- Zod validation appears in login/register/menu/outlet/stock/user/cash payment pages.

## Table Styles

- Native `<table>` usage in `src/pages/admin/StockManagement.tsx` and `src/pages/admin/TransactionsList.tsx`.
- Header rows: `border-b border-slate-200`.
- Header cells: `text-left/text-center py-3 px-4 font-semibold text-slate-700`.
- Body rows: `border-b border-slate-100 hover:bg-slate-50`.
- Body cells: `py-3 px-4`.
- Tables are wrapped in `overflow-x-auto`.

## Card Styles

- Base card: `rounded-xl border bg-card text-card-foreground shadow`.
- Cards are used heavily for stats, lists, item cards, form sections, empty states, dialogs content groups.
- Product/menu cards often add image blocks, `overflow-hidden`, `border-2`, and hover border/shadow transitions.

## Modal/Dialog Styles

- Dialog primitive in `src/components/ui/dialog.tsx` uses Radix Dialog.
- Overlay: `fixed inset-0 z-50 bg-black/80` with open/closed animations.
- Content: centered fixed panel, `max-w-lg`, `bg-background`, `p-6`, `shadow-lg`, animation utilities, `sm:rounded-lg`.
- Page-specific dialogs set `max-w-md`, `max-w-lg`, `max-w-2xl`, `max-h-[90vh]`, and `overflow-y-auto`.

## Sidebar/Navbar/Header Styles

- `AdminLayout`: desktop sidebar `w-64 bg-white border-r border-slate-200`; active link `bg-primary text-white`; inactive `text-slate-700 hover:bg-slate-100`; mobile overlay `bg-black/50`.
- `CustomerLayout`: fixed translucent header `bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm`; desktop sidebar starts below header at `top-16`, active nav `bg-primary text-white shadow-lg`; mobile bottom nav active `text-blue-600` and `bg-blue-100`.
- `CashierLayout`: sidebar `w-72 bg-white border-r border-slate-200`, background `bg-linear-to-br from-slate-50 via-blue-50 to-slate-100`; active nav uses `bg-linear-to-r from-primary to-primary text-white shadow-lg shadow-blue-200`.
- `AuthLayout`: split screen with full image on desktop, dark overlay `bg-linear-to-t from-black/80 via-black/40 to-transparent`; form card `bg-white/80 backdrop-blur-sm lg:bg-white p-8 rounded-2xl shadow-xl border border-slate-100`.

## Empty/Loading/Error State Patterns

- Loading:
  - Spinners: `border-4 border-primary border-t-transparent rounded-full animate-spin`.
  - Text-only loading in cards: `text-center py-12 text-slate-500`.
  - Processing checkout overlay: `fixed inset-0 bg-black/50 backdrop-blur-sm`.
- Empty states:
  - Centered cards with large emoji/icons, `py-12` or `py-16`, `text-slate-500`.
  - Examples: menu not found, no orders, no active cashier orders, no stock.
- Error states:
  - Toasts with `sonner`.
  - Inline red cards: `border-red-200 bg-red-50`, `text-red-800`.
  - Checkout error block: `p-4 bg-red-50 border border-red-200 rounded-lg`.

## Recommendation For Preserving Design In Laravel Inertia React

- Move `src/index.css` tokens to `resources/css/app.css` or equivalent, preserving CSS variable names exactly.
- Copy `src/components/ui/*` and `src/lib/utils.ts` into `resources/js/Components/ui` and `resources/js/lib`.
- Keep lucide icons and shadcn/Radix dependencies if the target stack allows.
- Normalize repeated page patterns into shared Inertia layouts: `AdminLayout`, `CustomerLayout`, `CashierLayout`, `AuthLayout`.
- Preserve the palette tokens but consider replacing hardcoded `blue-*` action classes with `primary` token aliases over time.
- TODO: Confirm whether `bg-linear-*` utilities are valid in the target Tailwind setup; if not, migrate to Tailwind's current gradient utility syntax.
