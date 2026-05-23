# Dokumentasi Proyek: Sistem Kantin Paramadina

> Dokumentasi teknis untuk keperluan presentasi akademik.  
> Stack: **Laravel 13 · Inertia.js v3 · React 19 · Tailwind CSS v4**

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Proses Instalasi & Setup](#2-proses-instalasi--setup)
3. [Arsitektur MVC di Laravel](#3-arsitektur-mvc-di-laravel)
4. [Skema Database & Migrasi](#4-skema-database--migrasi)
5. [Model & Eloquent ORM](#5-model--eloquent-orm)
6. [Controller](#6-controller)
7. [View — Inertia.js & React](#7-view--inertiajs--react)
8. [Routing](#8-routing)
9. [Middleware](#9-middleware)
10. [Form Request & Validasi](#10-form-request--validasi)
11. [Policy & Gate (Otorisasi)](#11-policy--gate-otorisasi)
12. [Session & Autentikasi](#12-session--autentikasi)
13. [Eloquent API Resources](#13-eloquent-api-resources)
14. [CRUD Lengkap Per Modul](#14-crud-lengkap-per-modul)
15. [Alur Data End-to-End](#15-alur-data-end-to-end)
12. [Eloquent API Resources](#12-eloquent-api-resources)
13. [CRUD Lengkap Per Modul](#13-crud-lengkap-per-modul)
14. [Alur Data End-to-End](#14-alur-data-end-to-end)

---

## 1. Gambaran Umum

Sistem Kantin Paramadina adalah aplikasi web berbasis **SPA (Single Page Application)** yang dibangun dengan pola **Server-Driven Rendering** menggunakan Inertia.js. Server Laravel tetap mengelola routing, autentikasi, dan logika bisnis; React di sisi klien hanya bertanggung jawab atas tampilan.

### Role Pengguna

| Role | Akses |
|------|-------|
| `Admin` | Kelola outlet, menu, stok, dan akun pengguna |
| `Cashier` | Terima & proses pesanan, input transaksi tunai |
| `Customer` | Lihat menu, buat pesanan, pantau status |

---

## 2. Proses Instalasi & Setup

### Prasyarat

| Kebutuhan | Versi Minimum |
|-----------|---------------|
| PHP | 8.3 |
| Composer | 2.x |
| Node.js | 20.x |
| npm | 10.x |
| Database | SQLite (default) atau MySQL/PostgreSQL |

---

### Langkah 1 — Clone & Masuk ke Direktori

```bash
git clone <url-repository> kantin-paramadina
cd kantin-paramadina
```

---

### Langkah 2 — Install Dependensi PHP

```bash
composer install
```

Perintah ini membaca `composer.json` dan mengunduh semua paket PHP ke folder `vendor/`. Paket utama yang diinstal:

| Paket | Fungsi |
|-------|--------|
| `laravel/framework ^13` | Core framework |
| `inertiajs/inertia-laravel ^3` | Jembatan Laravel ↔ React |
| `laravel/wayfinder ^0.1` | Generate TypeScript functions dari routes |

---

### Langkah 3 — Konfigurasi Environment

```bash
cp .env.example .env
php artisan key:generate
```

`php artisan key:generate` membuat `APP_KEY` yang digunakan untuk enkripsi session, cookie, dan data sensitif lainnya. Tanpa key ini aplikasi tidak bisa berjalan.

**Konfigurasi `.env` yang perlu diperhatikan:**

```env
APP_NAME=KantinParamadina
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database — default SQLite (tidak perlu instalasi tambahan)
DB_CONNECTION=sqlite

# Jika ingin MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=kantin_paramadina
# DB_USERNAME=root
# DB_PASSWORD=

# Session disimpan di database
SESSION_DRIVER=database
SESSION_LIFETIME=120
```

---

### Langkah 4 — Setup Database

```bash
php artisan migrate
```

Perintah ini membaca semua file di `database/migrations/` secara berurutan (berdasarkan timestamp nama file) dan membuat struktur tabel. Tabel yang akan dibuat:

```
sessions
users
outlets
menu_items
stocks
transactions
transaction_items
```

**Opsional — Buat akun admin awal via Tinker:**

```bash
php artisan tinker
```

```php
// Di dalam sesi tinker
App\Models\User::create([
    'name'      => 'Admin',
    'username'  => 'admin',
    'full_name' => 'Administrator',
    'password'  => bcrypt('password'),
    'role'      => 'Admin',
]);
```

Atau daftar akun Customer lewat halaman `/register`, lalu ubah role-nya menjadi Admin via tinker jika diperlukan.

---

### Langkah 5 — Install Dependensi JavaScript

```bash
npm install
```

Mengunduh semua paket Node ke `node_modules/`. Paket frontend utama:

| Paket | Fungsi |
|-------|--------|
| `react ^19` | UI library |
| `@inertiajs/react ^3` | Inertia client untuk React |
| `tailwindcss ^4` | Utility-first CSS framework |
| `react-hot-toast ^2` | Notifikasi toast |
| `react-markdown ^9` | Render markdown |

---

### Langkah 6 — Build atau Jalankan Dev Server

**Mode Development (hot reload):**

```bash
composer run dev
```

Perintah ini menjalankan 4 proses sekaligus secara paralel:

```
┌─────────────────────────────────────────────────────────┐
│ php artisan serve     → HTTP server di http://localhost  │
│ php artisan queue:listen → Queue worker untuk jobs       │
│ php artisan pail      → Log viewer di terminal           │
│ npm run dev           → Vite dev server + hot reload     │
└─────────────────────────────────────────────────────────┘
```

**Mode Production (build statis):**

```bash
npm run build
php artisan serve
```

`npm run build` mengompilasi semua asset React + Tailwind ke folder `public/build/` yang akan di-serve langsung oleh Laravel.

---

### Langkah 7 — Storage Link (untuk Upload Gambar Menu)

```bash
php artisan storage:link
```

Membuat symbolic link dari `public/storage` ke `storage/app/public`. Ini diperlukan agar gambar menu yang diupload oleh admin bisa diakses melalui URL publik (`/storage/menu-images/...`).

---

### Ringkasan Perintah Cepat

```bash
# Clone dan setup sekali jalan
git clone <url> kantin-paramadina && cd kantin-paramadina
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
npm install
composer run dev
```

---

### Daftar Semua Route

```
GET  /                         → redirect sesuai role
GET  /login                    → halaman login
POST /login                    → proses login
GET  /register                 → halaman registrasi
POST /register                 → proses registrasi
POST /logout                   → logout

# Admin (middleware: auth, role:Admin)
GET    /admin                  → dashboard
GET    /admin/outlets          → daftar outlet
POST   /admin/outlets          → tambah outlet
PATCH  /admin/outlets/{id}     → edit outlet
GET    /admin/menu             → daftar menu
POST   /admin/menu             → tambah menu
PATCH  /admin/menu/{id}        → edit menu
DELETE /admin/menu/{id}        → hapus menu
PATCH  /admin/menu/{id}/stock  → update stok
GET    /admin/stock            → halaman stok
GET    /admin/users            → kelola akun
POST   /admin/users            → tambah akun
PATCH  /admin/users/{id}       → edit akun
DELETE /admin/users/{id}       → hapus akun

# Customer (middleware: auth, role:Customer,Mahasiswa)
GET  /app                      → menu kantin
GET  /app/orders               → riwayat pesanan
POST /app/orders               → buat pesanan

# Cashier (middleware: auth, role:Cashier,Kasir)
GET    /cashier                        → pesanan masuk
PATCH  /cashier/orders/{id}/status     → update status pesanan
GET    /cashier/cash-payment           → halaman kasir tunai
POST   /cashier/cash-payment           → simpan transaksi tunai

# Dokumentasi
GET  /docs/overview            → halaman dokumentasi ini
```

---

## 3. Arsitektur MVC di Laravel

Laravel menggunakan pola **Model–View–Controller (MVC)**. Dalam proyek ini perannya dibagi sebagai berikut:

```
HTTP Request
    │
    ▼
routes/web.php          ← definisi URL dan Controller yang menangani
    │
    ▼
Middleware Pipeline      ← auth, role, HandleInertiaRequests
    │
    ▼
Form Request             ← validasi + otorisasi awal
    │
    ▼
Controller               ← logika aplikasi, query Eloquent
    │
    ├─── Model (Eloquent) ← representasi tabel database
    │
    ▼
Inertia::render()        ← mengirim data sebagai props ke React
    │
    ▼
React Page Component     ← "View" — menerima props, merender UI
```

### Lapisan yang Ada di Proyek

| Lapisan | Lokasi | Keterangan |
|---------|--------|------------|
| **Model** | `app/Models/` | Eloquent ORM, relasi, cast tipe |
| **Controller** | `app/Http/Controllers/` | Logika bisnis, query, return `Inertia::render()` |
| **View** | `resources/js/pages/` | Komponen React, menerima props dari controller |
| **Route** | `routes/web.php` | Pemetaan URL → Controller |
| **Middleware** | `app/Http/Middleware/` | Filter request sebelum masuk controller |
| **Form Request** | `app/Http/Requests/` | Validasi & otorisasi terpusat |
| **Policy** | `app/Policies/` | Aturan otorisasi per resource |
| **Resource** | `app/Http/Resources/` | Transformasi data sebelum dikirim ke frontend |

---

## 4. Skema Database & Migrasi

### Tabel yang Ada

#### `users`
```
id | name | email | username | full_name | password | role | outlet_id | remember_token | timestamps
```
- `role`: `Admin`, `Cashier`, `Customer` (plus alias lama `Kasir`, `Mahasiswa`)
- `outlet_id`: nullable — hanya diisi untuk role `Cashier`

#### `outlets`
```
id | name | location | qris_image_url | timestamps
```

#### `menu_items`
```
id | outlet_id (FK) | name | description | price | image_url | timestamps
```

#### `stocks`
```
id | menu_item_id (FK) | quantity | timestamps
```
Hubungan 1-to-1 dengan `menu_items`. Stok disimpan terpisah agar bisa dikunci (`lockForUpdate`) saat transaksi.

#### `transactions`
```
id | user_id (FK) | outlet_id (FK) | customer_name | total_amount
   | cash_received_amount | change_amount | payment_method
   | payment_status | order_status | payment_proof_path | timestamps
```

**Nilai `order_status`:**
| Nilai | Konstanta | Arti |
|-------|-----------|------|
| 1 | `ORDER_STATUS_RECEIVED` | Baru diterima |
| 2 | `ORDER_STATUS_PREPARING` | Sedang dimasak |
| 3 | `ORDER_STATUS_READY` | Siap diambil |
| 4 | `ORDER_STATUS_COMPLETED` | Selesai |
| 5 | `ORDER_STATUS_CANCELLED` | Dibatalkan |

#### `transaction_items`
```
id | transaction_id (FK) | menu_item_id (FK) | quantity | unit_price | timestamps
```
Harga (`unit_price`) disimpan snapshot saat transaksi dibuat — bukan FK ke menu — sehingga perubahan harga menu di kemudian hari tidak mengubah historis transaksi.

### Cara Kerja Migrasi

Migrasi Laravel adalah **version control untuk database**. Setiap file di `database/migrations/` adalah satu perubahan skema yang bisa dijalankan atau di-rollback.

```php
// Contoh: create_outlets_table.php
Schema::create('outlets', function (Blueprint $table) {
    $table->id();
    $table->string('name', 100);
    $table->string('location')->nullable();
    $table->timestamps();
});
```

Perintah:
```bash
php artisan migrate          # jalankan migrasi baru
php artisan migrate:status   # lihat status migrasi
php artisan make:migration   # buat file migrasi baru
```

---

## 5. Model & Eloquent ORM

Eloquent adalah ORM (Object-Relational Mapper) bawaan Laravel. Setiap model merepresentasikan satu tabel dan satu baris data adalah satu objek PHP.

### Fitur yang Digunakan

#### 4.1 Mass Assignment

Menentukan kolom mana yang boleh diisi secara massal (via `create()` atau `fill()`).

```php
// app/Models/Transaction.php
protected $fillable = [
    'user_id', 'outlet_id', 'customer_name',
    'total_amount', 'payment_method', 'order_status',
];
```

Model `User` menggunakan atribut PHP 8 modern:
```php
// app/Models/User.php
#[Fillable(['name', 'username', 'full_name', 'password', 'role', 'outlet_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable { ... }
```

#### 4.2 Casts

Mengkonversi tipe data kolom otomatis saat dibaca dari database.

```php
// app/Models/Transaction.php
protected function casts(): array
{
    return [
        'total_amount'         => 'decimal:2',
        'cash_received_amount' => 'decimal:2',
        'order_status'         => 'integer',  // tinyint → int PHP
    ];
}

// app/Models/User.php
protected function casts(): array
{
    return [
        'password'   => 'hashed',   // auto-hash saat disimpan
        'outlet_id'  => 'integer',
    ];
}
```

#### 4.3 Relasi Eloquent

```
User ──belongsTo──► Outlet
User ──hasMany────► Transaction

Outlet ──hasMany──► MenuItem
Outlet ──hasMany──► User
Outlet ──hasMany──► Transaction

MenuItem ──hasOne────► Stock
MenuItem ──hasMany───► TransactionItem
MenuItem ──belongsTo─► Outlet

Transaction ──belongsTo──► User
Transaction ──belongsTo──► Outlet
Transaction ──hasMany────► TransactionItem

TransactionItem ──belongsTo──► Transaction
TransactionItem ──belongsTo──► MenuItem
```

Contoh definisi relasi:
```php
// app/Models/MenuItem.php
public function outlet(): BelongsTo
{
    return $this->belongsTo(Outlet::class);
}

public function stock(): HasOne
{
    return $this->hasOne(Stock::class);
}
```

#### 4.4 Accessor (Computed Property)

```php
// app/Models/TransactionItem.php
public function getSubtotalAttribute(): float
{
    return (float) $this->unit_price * $this->quantity;
}
// akses: $item->subtotal
```

#### 4.5 Helper Method di Model

Model `User` memiliki method semantik yang digunakan di seluruh aplikasi:
```php
public function isAdmin(): bool    { return $this->role === 'Admin'; }
public function isCashier(): bool  { return in_array($this->role, ['Cashier', 'Kasir'], true); }
public function isCustomer(): bool { return in_array($this->role, ['Customer', 'Mahasiswa'], true); }
```

#### 4.6 Konstanta di Model

```php
// app/Models/Transaction.php
public const ORDER_STATUS_RECEIVED  = 1;
public const ORDER_STATUS_PREPARING = 2;
public const ORDER_STATUS_READY     = 3;
public const ORDER_STATUS_COMPLETED = 4;
public const ORDER_STATUS_CANCELLED = 5;
```

Konstanta ini dipakai di seluruh controller dan policy, menghindari "magic number" yang rawan typo.

#### 4.7 Eager Loading (Mencegah N+1)

```php
// Tanpa eager loading → N+1 query
$transactions = Transaction::all();
foreach ($transactions as $t) {
    echo $t->outlet->name; // query baru tiap iterasi!
}

// Dengan eager loading → 2 query total
$transactions = Transaction::with('outlet')->get();
```

Contoh di proyek:
```php
Transaction::query()
    ->with(['items.menuItem:id,name', 'outlet:id,name,location'])
    ->where('outlet_id', $outletId)
    ->get();
```

`items.menuItem:id,name` berarti: muat relasi `items`, lalu dari tiap item muat relasi `menuItem` tapi hanya kolom `id` dan `name`.

---

## 6. Controller

### Struktur Direktori

```
app/Http/Controllers/
├── Auth/
│   ├── AuthenticatedSessionController.php  (login, logout)
│   ├── RegisteredUserController.php        (registrasi)
│   └── Concerns/RedirectsUsersByRole.php   (trait redirect)
├── Admin/
│   ├── DashboardController.php
│   ├── MenuItemController.php
│   ├── OutletController.php
│   ├── StockController.php
│   └── UserController.php
├── Cashier/
│   ├── CashPaymentController.php
│   ├── OrderController.php
│   └── OrderStatusController.php
└── Customer/
    ├── MenuController.php
    └── OrderController.php
```

### Pola Umum Controller

Setiap controller mengikuti pola yang konsisten:

```php
public function index(FormRequest $request): Response
{
    // 1. Ambil & validasi filter dari FormRequest
    $filters = $request->validated();

    // 2. Query Eloquent dengan kondisi dinamis
    $data = Model::query()
        ->with([...])           // eager load relasi
        ->when($search, ...)    // filter opsional
        ->paginate(10);

    // 3. Kirim ke React via Inertia
    return Inertia::render('nama/halaman', [
        'data'    => Resource::collection($data)->resolve(),
        'filters' => $filters,
    ]);
}
```

### Invokable Controller

`DashboardController` menggunakan pola **single-action controller** dengan method `__invoke`:

```php
class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'outlets'      => Outlet::query()->count(),
                'menus'        => MenuItem::query()->count(),
                'lowStockItems'=> Stock::query()->where('quantity', '<=', 5)->count(),
            ],
            // ...
        ]);
    }
}
```

Di route: `Route::get('/', DashboardController::class)` — tanpa method.

### Trait: `RedirectsUsersByRole`

```php
// app/Http/Controllers/Auth/Concerns/RedirectsUsersByRole.php
trait RedirectsUsersByRole
{
    protected function redirectPathFor(?User $user): string
    {
        if ($user->isAdmin())   return route('admin.dashboard');
        if ($user->isCashier()) return route('cashier.orders.incoming');
        return route('customer.menu.index');
    }
}
```

Digunakan oleh `AuthenticatedSessionController` setelah login berhasil untuk mengarahkan user ke halaman yang sesuai rolenya.

### Database Transaction

Untuk operasi yang melibatkan beberapa tabel sekaligus, digunakan `DB::transaction()` agar atomik:

```php
// app/Http/Controllers/Customer/OrderController.php
$transactionId = DB::transaction(function () use ($items, $user): int {
    // 1. Validasi stok dengan LOCK FOR UPDATE
    $stocks = Stock::query()
        ->whereIn('menu_item_id', $menuIds)
        ->lockForUpdate()         // mencegah race condition
        ->get()
        ->keyBy('menu_item_id');

    // 2. Buat transaksi
    $transaction = Transaction::query()->create([...]);

    // 3. Buat item & kurangi stok
    foreach ($items as $item) {
        $transaction->items()->create([...]);
        $stock->decrement('quantity', $item['quantity']);
    }

    return $transaction->id;
});
```

Jika salah satu langkah gagal (misal stok tidak cukup), seluruh operasi di-rollback otomatis.

---

## 7. View — Inertia.js & React

### Konsep Inertia.js

Inertia.js adalah "glue" antara Laravel dan React. Ia **tidak** menggunakan API JSON yang terpisah. Alih-alih, controller mengirim data langsung sebagai **props** ke komponen React.

```
Controller                    React Page
──────────                    ──────────
Inertia::render('page', [  →  export default function Page({ data, filters }) {
    'data'    => $data,    →      // data & filters langsung tersedia
    'filters' => $filters, →      return <div>...</div>
])                         →  }
```

### Cara React Membaca Props dari Controller

```tsx
// resources/js/pages/customer/menu/index.tsx

type CustomerMenuIndexProps = {
    menus: CustomerMenuItem[];     // dari MenuItemResource::collection()
    outlets: OutletSummary[];      // dari OutletResource::collection()
    filters: CustomerMenuFilters;  // dari array ['search' => ..., 'outlet' => ...]
};

export default function CustomerMenuIndex({
    menus,
    outlets,
    filters,
}: CustomerMenuIndexProps) {
    // menus, outlets, filters langsung dipakai — tidak ada fetch/axios
    return (
        <div>
            {menus.map(menu => <MenuCard key={menu.id} menu={menu} />)}
        </div>
    );
}
```

### Shared Props via `HandleInertiaRequests`

Data yang dibutuhkan di **semua halaman** (auth user, flash message) dishare lewat middleware:

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'flash' => [
            'success' => fn () => $request->session()->get('success'),
            'error'   => fn () => $request->session()->get('error'),
        ],
        'auth' => [
            'user' => $request->user() ? [
                'id'       => $request->user()->id,
                'username' => $request->user()->username,
                'role'     => $request->user()->role,
                'outletId' => $request->user()->outlet_id,
            ] : null,
        ],
    ];
}
```

Di React, `auth.user` dan `flash` tersedia di semua halaman via `usePage().props`.

---

## 8. Routing

### File: `routes/web.php`

Semua route web ada dalam satu file, dikelompokkan berdasarkan role menggunakan **Route Group** dan **Middleware**.

### Route Group dengan Middleware & Prefix

```php
// Grup Admin — hanya bisa diakses oleh user dengan role 'Admin'
Route::middleware(['auth', 'role:Admin'])->prefix('admin')->group(function () {
    Route::get('/',        DashboardController::class)->name('admin.dashboard');
    Route::get('/outlets', [OutletController::class, 'index'])->name('admin.outlets.index');
    Route::post('/outlets',[OutletController::class, 'store'])->name('admin.outlets.store');
    // ...
});

// Grup Customer
Route::middleware(['auth', 'role:Customer,Mahasiswa'])->prefix('app')->group(function () {
    Route::get('/',      [MenuController::class,  'index'])->name('customer.menu.index');
    Route::get('/orders',[OrderController::class, 'index'])->name('customer.orders.index');
    Route::post('/orders',[OrderController::class,'store'])->name('customer.orders.store');
});

// Grup Cashier
Route::middleware(['auth', 'role:Cashier,Kasir'])->prefix('cashier')->group(function () {
    Route::get('/',                       [CashierOrderController::class, 'incoming'])->name('cashier.orders.incoming');
    Route::patch('/orders/{transaction}/status', [OrderStatusController::class, 'update'])->name('cashier.orders.status.update');
    Route::get('/cash-payment',           [CashPaymentController::class, 'index'])->name('cashier.cash-payment.index');
    Route::post('/cash-payment',          [CashPaymentController::class, 'store'])->name('cashier.cash-payment.store');
});
```

### Route Model Binding

Laravel secara otomatis mengambil model dari database berdasarkan parameter route:

```php
// Di route:
Route::patch('/menu/{menuItem}', [MenuItemController::class, 'update']);

// Di controller — $menuItem sudah berisi objek MenuItem dari DB, bukan ID mentah
public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): RedirectResponse
{
    $menuItem->update([...]);
    // Jika menuItem dengan ID yang diminta tidak ada → otomatis 404
}
```

### Named Routes

Semua route diberi nama (`.name('...')`). Manfaat: URL bisa berubah tanpa perlu mengupdate semua referensinya.

```php
// Di PHP:
return redirect()->route('admin.menu.index');

// Di React (via Wayfinder — generate TypeScript otomatis):
import { index as adminMenuIndex } from '@/routes/admin/menu';
router.get(adminMenuIndex.url());
```

### Redirect Berdasarkan Role di Root `/`

```php
Route::get('/', function () {
    $user = Auth::user();
    if (!$user)             return redirect()->route('login');
    if ($user->isAdmin())   return redirect()->route('admin.dashboard');
    if ($user->isCashier()) return redirect()->route('cashier.orders.incoming');
    return redirect()->route('customer.menu.index');
})->name('home');
```

### Route Guest vs Auth

```php
// Hanya bisa diakses jika BELUM login
Route::middleware('guest')->group(function () {
    Route::get('/login',    [AuthenticatedSessionController::class, 'create']);
    Route::post('/login',   [AuthenticatedSessionController::class, 'store']);
    Route::get('/register', [RegisteredUserController::class, 'create']);
    Route::post('/register',[RegisteredUserController::class, 'store']);
});

// Hanya bisa diakses jika SUDAH login
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth');
```

---

## 9. Middleware

### Konsep

Middleware adalah **lapisan filter** yang memproses request sebelum mencapai controller, atau memproses response sebelum dikirim ke browser. Urutannya membentuk sebuah "pipeline".

```
Request → [Middleware A] → [Middleware B] → Controller → Response
```

### Daftar Middleware yang Digunakan

#### 8.1 `auth` (Bawaan Laravel)

Memastikan user sudah login. Jika belum, redirect ke halaman login.

#### 8.2 `guest` (Bawaan Laravel)

Kebalikan `auth` — memastikan user **belum** login. Mencegah user yang sudah login mengakses halaman login/register.

#### 8.3 `EnsureUserHasRole` (Custom)

```php
// app/Http/Middleware/EnsureUserHasRole.php
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Cek apakah role user ada dalam daftar yang diizinkan
        if (!in_array($user->role, $roles, true)) {
            return redirect()->route('unauthorized');
        }

        return $next($request);  // lanjutkan ke controller
    }
}
```

Didaftarkan sebagai alias `role` di `bootstrap/app.php`:

```php
$middleware->alias([
    'role' => EnsureUserHasRole::class,
]);
```

Penggunaan di route:
```php
Route::middleware(['auth', 'role:Admin'])            // hanya Admin
Route::middleware(['auth', 'role:Customer,Mahasiswa']) // Customer ATAU Mahasiswa
Route::middleware(['auth', 'role:Cashier,Kasir'])    // Cashier ATAU Kasir
```

#### 8.4 `HandleInertiaRequests` (Custom — Inertia)

```php
// app/Http/Middleware/HandleInertiaRequests.php
class HandleInertiaRequests extends Middleware
{
    public function share(Request $request): array
    {
        return [
            ...parent::share($request), // errors validasi dari Inertia inti
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
            'auth' => ['user' => ...],
        ];
    }
}
```

Middleware ini berjalan di **setiap request web**. Ia menyuntikkan data bersama (shared props) ke setiap respons Inertia, sehingga `auth.user` dan `flash` selalu tersedia di semua halaman React tanpa perlu pass secara eksplisit dari masing-masing controller.

#### 8.5 `AddLinkHeadersForPreloadedAssets` (Bawaan Laravel)

Menambahkan HTTP `Link` header untuk preload aset, meningkatkan performa loading halaman.

### Registrasi Middleware Global

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware): void {
    // Ditambahkan ke SEMUA request web
    $middleware->web(append: [
        HandleInertiaRequests::class,
        AddLinkHeadersForPreloadedAssets::class,
    ]);

    // Alias — bisa dipanggil by name di route
    $middleware->alias([
        'role' => EnsureUserHasRole::class,
    ]);
})
```

---

## 10. Form Request & Validasi

### Konsep

**Form Request** adalah kelas PHP yang memisahkan logika **validasi** dan **otorisasi** dari controller. Ini membuat controller lebih bersih dan validasi bisa diuji secara terpisah.

```php
// Tanpa Form Request (tidak disarankan)
public function store(Request $request)
{
    $validated = $request->validate([...]);  // validasi di controller
    // ...
}

// Dengan Form Request (digunakan di proyek ini)
public function store(StoreMenuItemRequest $request)
{
    $validated = $request->validated();  // controller bersih
    // ...
}
```

### Struktur Form Request

Setiap Form Request memiliki dua method wajib:

```php
class StoreMenuItemRequest extends FormRequest
{
    // 1. Otorisasi — boleh atau tidak request ini diproses
    public function authorize(): bool
    {
        return $this->user()?->can('create', MenuItem::class) ?? false;
    }

    // 2. Aturan validasi
    public function rules(): array
    {
        return [
            'name'                 => ['required', 'string', 'max:100'],
            'price'                => ['required', 'numeric', 'min:0'],
            'outletId'             => ['required', 'integer', Rule::exists('outlets', 'id')],
            'initialStockQuantity' => ['nullable', 'integer', 'min:0'],
            'imageFile'            => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:10240'],
        ];
    }
}
```

### Contoh Validasi Kondisional

```php
// app/Http/Requests/Admin/StoreUserRequest.php
public function rules(): array
{
    $isCashier = $this->input('role') === 'Cashier';

    return [
        'role'     => ['required', 'string', Rule::in(['Admin', 'Cashier', 'Customer'])],
        'outletId' => [
            Rule::requiredIf($isCashier),  // wajib HANYA jika role = Cashier
            'nullable',
            'integer',
            Rule::exists('outlets', 'id'),
        ],
    ];
}
```

### Respons Error Validasi

Jika validasi gagal, Laravel **otomatis** mengembalikan error ke React via shared props `errors`. Di React:

```tsx
// Inertia menyuntikkan errors ke semua page props
const { errors } = usePage().props;
// atau via useForm():
const form = useForm({ name: '' });
form.post('/admin/menu');
// form.errors.name → pesan error dari server
```

---

## 11. Policy & Gate (Otorisasi)

### Perbedaan Autentikasi vs Otorisasi

- **Autentikasi** → "Siapa kamu?" → middleware `auth`, login/session
- **Otorisasi** → "Boleh tidak kamu melakukan ini?" → Policy & Gate

### Konsep Policy

**Policy** adalah kelas PHP yang mengemas aturan otorisasi untuk satu model. Laravel otomatis menemukan policy berdasarkan konvensi nama (`UserPolicy` untuk `User`, `MenuItemPolicy` untuk `MenuItem`, dst).

### Daftar Policy

#### `UserPolicy`

```php
public function viewAny(User $user): bool  { return $user->isAdmin(); }
public function create(User $user): bool   { return $user->isAdmin(); }
public function update(User $user, User $model): bool
{
    return $user->isAdmin() || $user->is($model); // admin atau diri sendiri
}
public function delete(User $user, User $model): bool
{
    return $user->isAdmin() && !$user->is($model); // tidak bisa hapus diri sendiri
}
```

#### `MenuItemPolicy`

```php
// Hanya Admin yang boleh melakukan semua operasi pada menu
public function viewAny(User $user): bool { return $user->isAdmin(); }
public function create(User $user): bool  { return $user->isAdmin(); }
public function update(User $user, MenuItem $menuItem): bool { return $user->isAdmin(); }
public function delete(User $user, MenuItem $menuItem): bool { return $user->isAdmin(); }
```

#### `TransactionPolicy`

```php
// Paling kompleks — berbeda per role
public function view(User $user, Transaction $transaction): bool
{
    if ($user->isAdmin())   return true;               // admin lihat semua
    if ($user->isCashier()) return $user->outlet_id === $transaction->outlet_id; // kasir hanya outlet-nya
    return $user->id === $transaction->user_id;        // customer hanya punyanya
}

public function create(User $user): bool    { return $user->isCustomer(); }
public function createCash(User $user): bool
{
    return $user->isCashier() && $user->outlet_id !== null; // kasir yg punya outlet
}
public function update(User $user, Transaction $transaction): bool
{
    return $user->isAdmin() || ($user->isCashier() && $user->outlet_id === $transaction->outlet_id);
}
```

#### `OutletPolicy`

```php
// Semua operasi hanya untuk Admin
// delete selalu false — outlet tidak bisa dihapus (proteksi data historis)
public function delete(User $user, Outlet $outlet): bool { return false; }
```

### Cara Menggunakan Policy di Controller

#### Via `Gate::authorize()`

```php
// app/Http/Controllers/Admin/OutletController.php
public function index(): Response
{
    Gate::authorize('viewAny', Outlet::class);
    // Jika tidak diizinkan → throw AuthorizationException → 403
    // ...
}
```

#### Via `authorize()` di Form Request

```php
// app/Http/Requests/Admin/StoreMenuItemRequest.php
public function authorize(): bool
{
    return $this->user()?->can('create', MenuItem::class) ?? false;
}
```

#### Via `$request->user()->can()`

```php
// app/Http/Requests/Customer/StoreOrderRequest.php
public function authorize(): bool
{
    return $this->user()?->can('create', Transaction::class) ?? false;
    // Transaction::class → Laravel resolve ke TransactionPolicy::create()
}
```

### Gate vs Policy

| | Gate | Policy |
|--|------|--------|
| Definisi | Closure di ServiceProvider | Kelas terpisah per Model |
| Digunakan untuk | Aturan sederhana, tidak terikat model | Aturan per model (CRUD) |
| Digunakan di proyek | `Gate::authorize()` di controller | Policy di Form Request & controller |

---

## 12. Session & Autentikasi

### Penyimpanan Session

Session disimpan di **database** (tabel `sessions`):

```
id | user_id | ip_address | user_agent | payload | last_activity
```

Session di-set di `config/session.php` → `driver = database`.

### Alur Login

```
1. User POST /login (username + password)
2. LoginRequest → validasi format input
3. Auth::attempt(['username' => ..., 'password' => ...], $remember)
   └── Laravel ambil user dari DB, verifikasi bcrypt password
4. Jika berhasil:
   - $request->session()->regenerate()  ← cegah session fixation attack
   - redirect ke halaman sesuai role
5. Jika gagal:
   - throw ValidationException → error dikembalikan ke form React
```

```php
// app/Http/Controllers/Auth/AuthenticatedSessionController.php
public function store(LoginRequest $request): RedirectResponse
{
    $credentials = $request->validated();
    $remember = (bool) ($credentials['remember'] ?? false);

    if (!Auth::attempt([
        'username' => $credentials['username'],
        'password' => $credentials['password'],
    ], $remember)) {
        throw ValidationException::withMessages([
            'username' => __('Username or password is incorrect.'),
        ]);
    }

    $request->session()->regenerate();
    return redirect()->intended($this->redirectPathFor($request->user()));
}
```

### Alur Logout

```php
public function destroy(Request $request): RedirectResponse
{
    Auth::logout();                          // hapus user dari session
    $request->session()->invalidate();       // hapus semua data session
    $request->session()->regenerateToken();  // buat CSRF token baru
    return redirect()->route('login');
}
```

### Registrasi

```php
// app/Http/Controllers/Auth/RegisteredUserController.php
User::create([
    'username'  => $validated['username'],
    'full_name' => $validated['fullName'] ?? null,
    'password'  => Hash::make($validated['password']),  // bcrypt otomatis via cast 'hashed'
    'role'      => 'Customer',  // selalu Customer saat daftar sendiri
]);
return redirect()->route('login');
```

### Flash Message (Session Sementara)

Flash message adalah data session yang hanya hidup selama **satu request berikutnya**. Digunakan untuk pesan sukses setelah redirect.

```php
// Controller mengirim flash
return redirect()->route('customer.orders.index')
    ->with('success', 'Pesanan berhasil dibuat.');

// HandleInertiaRequests membaca dan meneruskan ke React
'flash' => [
    'success' => fn () => $request->session()->get('success'),
],
```

React membaca dan menampilkan via `react-hot-toast`:
```tsx
// lib/inertia-toast.ts — listener global
router.on('success', (event) => {
    showFlashFromPage(event.detail.page);
    // jika page.props.flash.success ada → toast.success(...)
});
```

### CSRF Protection

Laravel secara otomatis melindungi semua request `POST`, `PATCH`, `PUT`, `DELETE` dengan **CSRF token**. Inertia.js otomatis menyertakan token ini di setiap request yang dikirim.

---

## 13. Eloquent API Resources

**Resource** adalah layer transformasi data antara model Eloquent dan format yang dikirim ke frontend. Ini memisahkan "bentuk data di database" dari "bentuk data yang dibutuhkan React".

```php
// app/Http/Resources/MenuItemResource.php
public function toArray(Request $request): array
{
    return [
        'id'            => $this->id,
        'name'          => $this->name,
        'price'         => (float) $this->price,       // cast ke float
        'outletId'      => $this->outlet_id,
        'outletName'    => $this->when(                // conditional — hanya jika relasi sudah dimuat
            $this->relationLoaded('outlet'),
            fn () => $this->outlet?->name,
        ),
        'stockQuantity' => $this->when(
            $this->relationLoaded('stock'),
            fn () => $this->stock?->quantity ?? 0,
            0,                                          // default jika relasi tidak dimuat
        ),
        'imageUrl'      => $this->image_url,           // snake_case → camelCase
    ];
}
```

**Manfaat Resource:**
- Mengubah `snake_case` kolom DB menjadi `camelCase` sesuai konvensi JavaScript
- Menyembunyikan field sensitif
- Menambahkan field kalkulasi (computed)
- Konsisten — perubahan format cukup di satu tempat

Penggunaan di controller:
```php
// Satu model
return Inertia::render('page', [
    'menu' => MenuItemResource::make($menuItem)->resolve(),
]);

// Koleksi
return Inertia::render('page', [
    'menus' => MenuItemResource::collection($menus)->resolve(),
]);
```

---

## 14. CRUD Lengkap Per Modul

### 13.1 Autentikasi

| Operasi | Method | URL | Controller | Notes |
|---------|--------|-----|------------|-------|
| Tampilkan form login | GET | `/login` | `AuthenticatedSessionController@create` | Guest only |
| Proses login | POST | `/login` | `AuthenticatedSessionController@store` | Guest only |
| Tampilkan form register | GET | `/register` | `RegisteredUserController@create` | Guest only |
| Proses register | POST | `/register` | `RegisteredUserController@store` | Guest only |
| Logout | POST | `/logout` | `AuthenticatedSessionController@destroy` | Auth only |

---

### 13.2 Admin — Outlet

| Operasi | Method | URL | Controller | Policy |
|---------|--------|-----|------------|--------|
| **Read** — daftar outlet | GET | `/admin/outlets` | `OutletController@index` | `viewAny` |
| **Create** — tambah outlet | POST | `/admin/outlets` | `OutletController@store` | via FormRequest `create` |
| **Update** — edit outlet | PATCH | `/admin/outlets/{outlet}` | `OutletController@update` | via FormRequest `update` |
| ~~Delete~~ | — | — | — | `delete` selalu `false` |

**Tidak ada delete** — outlet tidak dihapus untuk menjaga integritas data historis transaksi.

Kode `store`:
```php
public function store(StoreOutletRequest $request): RedirectResponse
{
    $validated = $request->validated();
    Outlet::query()->create([
        'name'          => $validated['name'],
        'location'      => $validated['location'] ?? null,
        'qris_image_url'=> $validated['qrisImageUrl'] ?? null,
    ]);
    return redirect()->route('admin.outlets.index');
}
```

---

### 13.3 Admin — Menu Item

| Operasi | Method | URL | Controller | Notes |
|---------|--------|-----|------------|-------|
| **Read** — daftar menu | GET | `/admin/menu` | `MenuItemController@index` | Paginasi 10/halaman |
| **Create** — tambah menu | POST | `/admin/menu` | `MenuItemController@store` | Bisa ke semua outlet |
| **Update** — edit menu | PATCH | `/admin/menu/{menuItem}` | `MenuItemController@update` | Upload gambar |
| **Delete** — hapus menu | DELETE | `/admin/menu/{menuItem}` | `MenuItemController@destroy` | Hapus gambar dari storage |

**Create** — dapat membuat menu untuk satu outlet atau semua outlet sekaligus:
```php
public function store(StoreMenuItemRequest $request): RedirectResponse
{
    DB::transaction(function () use ($imageUrl, $validated): void {
        $outletIds = $validated['outletId'] === 'all'
            ? Outlet::query()->pluck('id')   // semua outlet
            : collect([(int) $validated['outletId']]);

        $outletIds->each(function (int $outletId) use ($validated): void {
            $menuItem = MenuItem::query()->create([...]);
            $menuItem->stock()->create(['quantity' => $validated['initialStockQuantity'] ?? 0]);
        });
    });
}
```

**Delete** — juga menghapus file gambar dari storage, dengan pengecekan apakah gambar dipakai menu lain:
```php
private function deleteStoredImage(?string $imageUrl): void
{
    if (!$imageUrl || !str_starts_with($imageUrl, '/storage/')) return;

    // Cek apakah ada menu lain yang pakai gambar yang sama
    if (MenuItem::query()->where('image_url', $imageUrl)->exists()) return;

    Storage::disk('public')->delete(substr($imageUrl, strlen('/storage/')));
}
```

---

### 13.4 Admin — Stok

| Operasi | Method | URL | Controller | Notes |
|---------|--------|-----|------------|-------|
| **Read** — daftar stok | GET | `/admin/stock` | `StockController@index` | Filter search & outlet |
| **Update** — ubah stok | PATCH | `/admin/menu/{menuItem}/stock` | `StockController@update` | upsert (create or update) |

```php
public function update(UpdateStockRequest $request, MenuItem $menuItem): RedirectResponse
{
    $menuItem->stock()->updateOrCreate(
        ['menu_item_id' => $menuItem->id],  // kondisi pencarian
        ['quantity' => $validated['quantity']], // data yang diupdate/dibuat
    );
}
```

`updateOrCreate` → jika record stock belum ada, buat baru; jika sudah ada, update.

---

### 13.5 Admin — Pengguna

| Operasi | Method | URL | Controller | Policy |
|---------|--------|-----|------------|--------|
| **Read** — daftar user | GET | `/admin/users` | `UserController@index` | `viewAny` |
| **Create** — tambah user | POST | `/admin/users` | `UserController@store` | `create` |
| **Update** — edit user | PATCH | `/admin/users/{user}` | `UserController@update` | `update` |
| **Delete** — hapus user | DELETE | `/admin/users/{user}` | `UserController@destroy` | `delete` |

Catatan pada delete: admin tidak bisa menghapus akunnya sendiri (diatur di `UserPolicy::delete`).

---

### 13.6 Customer — Pesanan

| Operasi | Method | URL | Controller | Policy |
|---------|--------|-----|------------|--------|
| **Read** — riwayat pesanan | GET | `/app/orders` | `CustomerOrderController@index` | — |
| **Create** — buat pesanan | POST | `/app/orders` | `CustomerOrderController@store` | `Transaction::create` |

Alur `store` yang lengkap:
1. Validasi item (via `StoreOrderRequest`)
2. Otorisasi: `$user->can('create', Transaction::class)` → `TransactionPolicy::create` → hanya Customer
3. Mulai `DB::transaction()`
4. Ambil data menu dari DB (validasi menu masih ada)
5. Pastikan semua menu dari satu outlet
6. Lock stok untuk mencegah race condition (`lockForUpdate`)
7. Validasi stok cukup untuk setiap item
8. Hitung total dari harga menu di DB (bukan dari browser — mencegah manipulasi)
9. Buat `Transaction` dan `TransactionItem`
10. Kurangi stok
11. Redirect dengan flash message

---

### 13.7 Cashier — Pesanan Masuk

| Operasi | Method | URL | Controller | Notes |
|---------|--------|-----|------------|-------|
| **Read** — pesanan aktif | GET | `/cashier/` | `CashierOrderController@incoming` | Auto-poll 4 detik |
| **Update** — ubah status | PATCH | `/cashier/orders/{transaction}/status` | `OrderStatusController@update` | Termasuk restock saat cancel |

```php
// OrderStatusController@update
DB::transaction(function () use ($nextStatus, $transaction): void {
    $locked = Transaction::query()->lockForUpdate()->findOrFail($transaction->id);

    // Validasi: pesanan yang sudah dibatalkan tidak bisa diubah
    if ($locked->order_status === Transaction::ORDER_STATUS_CANCELLED) {
        throw ValidationException::withMessages([...]);
    }

    // Jika dibatalkan → kembalikan stok
    if ($nextStatus === Transaction::ORDER_STATUS_CANCELLED) {
        foreach ($locked->items as $item) {
            Stock::query()
                ->where('menu_item_id', $item->menu_item_id)
                ->increment('quantity', $item->quantity);  // restock
        }
    }

    $locked->update(['order_status' => $nextStatus]);
});
```

---

### 13.8 Cashier — Pembayaran Tunai

| Operasi | Method | URL | Controller | Notes |
|---------|--------|-----|------------|-------|
| **Read** — halaman kasir | GET | `/cashier/cash-payment` | `CashPaymentController@index` | Termasuk receipt terakhir |
| **Create** — simpan transaksi | POST | `/cashier/cash-payment` | `CashPaymentController@store` | Validasi uang cukup |

```php
// Validasi sisi server — uang yang diterima tidak boleh kurang dari total
if ($cashReceivedAmount < $totalAmount) {
    throw ValidationException::withMessages([
        'cashReceivedAmount' => 'Nominal bayar tidak boleh kurang dari total transaksi.',
    ]);
}
```

---

## 15. Alur Data End-to-End

Contoh alur lengkap **Customer membuat pesanan**:

```
1. Customer buka /app (GET)
   └── MenuController@index
       ├── Query: MenuItem::with(['outlet', 'stock'])->get()
       ├── Transform: MenuItemResource::collection()
       └── Return: Inertia::render('customer/menu/index', ['menus' => [...]])

2. React menerima props 'menus' — merender kartu menu

3. Customer klik "Tambah" beberapa menu → state lokal React (cart)

4. Customer klik "Buat Pesanan" → form.post('/app/orders')
   └── Request dikirim via Inertia (XHR dengan X-Inertia header)

5. Server menerima POST /app/orders
   ├── Middleware: auth → cek session, user ada
   ├── Middleware: role:Customer,Mahasiswa → cek role
   └── StoreOrderRequest
       ├── authorize(): $user->can('create', Transaction::class)
       │   └── TransactionPolicy::create() → isCustomer() → true
       └── rules(): validasi format items

6. CustomerOrderController@store
   ├── DB::transaction()
   │   ├── Ambil MenuItem dari DB → validasi exists
   │   ├── Cek semua menu dari 1 outlet
   │   ├── Lock stok → cek cukup
   │   ├── Hitung total dari DB (bukan dari browser)
   │   ├── Transaction::create([...])
   │   ├── TransactionItem::create([...]) per item
   │   └── Stock::decrement() per item
   └── redirect()->route('customer.orders.index', ['created' => $id])
       ->with('success', 'Pesanan berhasil dibuat.')

7. HandleInertiaRequests menyertakan flash ke response berikutnya

8. React (router.on 'success') → membaca flash.success → toast.success(...)

9. React merender halaman /app/orders dengan highlight pesanan baru
```

---

*Dokumentasi ini dibuat dari source code proyek Sistem Kantin Paramadina.*  
*Dibuat: Mei 2026*
