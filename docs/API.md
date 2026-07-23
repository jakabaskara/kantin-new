# API Reference — Sistem Kantin Paramadina

Dokumentasi ini untuk konsumsi dari project Flutter (atau client lain).  
Base path: `/api`  
Auth: **Laravel Sanctum** (Bearer token dari login).

---

## 1. Setup cepat

### Base URL

```
http://localhost:8000/api
```

Ganti host sesuai environment (mis. IP LAN WSL/PC untuk emulator Android: `http://10.0.2.2:8000/api`).

### Header wajib

| Header | Nilai |
|--------|-------|
| `Accept` | `application/json` |
| `Content-Type` | `application/json` (kecuali upload gambar menu → `multipart/form-data`) |
| `Authorization` | `Bearer {token}` (setelah login) |

### Flow Flutter (ganti mock login)

1. `POST /api/login` dengan `username` + `password`
2. Simpan `token` di secure storage (`flutter_secure_storage`)
3. Simpan `user` (terutama `role`) untuk routing UI
4. Setiap request berikutnya kirim header `Authorization: Bearer {token}`
5. `POST /api/logout` untuk revoke token

---

## 2. Auth

### `POST /api/login`

**Body**

```json
{
  "username": "customer_satu",
  "password": "password"
}
```

**Response `200`**

```json
{
  "message": "Login berhasil.",
  "token": "1|xxxxxxxxxxxxxxxx",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "username": "customer_satu",
    "fullName": "Customer Satu",
    "role": "Customer",
    "outletId": null,
    "outletName": null,
    "createdAt": "2026-07-22T00:00:00.000000Z"
  }
}
```

**Error `422`** — kredensial salah / validasi gagal.

---

### `POST /api/register`

Membuat akun **Customer**. Tidak auto-login (sama seperti web).

**Body**

```json
{
  "username": "baru",
  "fullName": "Nama Lengkap",
  "password": "password",
  "password_confirmation": "password"
}
```

**Response `201`**

```json
{
  "message": "Registrasi berhasil. Silakan login.",
  "user": { "...": "..." }
}
```

---

### `POST /api/logout`

Auth: Bearer required.

**Response `200`**

```json
{
  "message": "Logout berhasil."
}
```

---

### `GET /api/me`

Auth: Bearer required.

**Response `200`**

```json
{
  "data": {
    "id": 1,
    "username": "customer_satu",
    "fullName": "Customer Satu",
    "role": "Customer",
    "outletId": null,
    "outletName": null,
    "createdAt": "..."
  }
}
```

---

## 3. Role & akses

| Role di DB | Prefix API | Catatan |
|------------|------------|---------|
| `Admin` | `/api/admin/*` | Full admin |
| `Customer` / `Mahasiswa` | `/api/app/*` | Menu + order |
| `Cashier` / `Kasir` | `/api/cashier/*` | Order masuk + cash payment; scoped ke `outletId` user |

Salah role → `403` `{ "message": "Forbidden." }`  
Tanpa token → `401`

Routing UI Flutter dari `user.role`:

- `Admin` → dashboard admin
- `Cashier` / `Kasir` → kasir
- lainnya → customer

---

## 4. Admin API

Semua butuh Bearer + role Admin.

### `GET /api/admin`

Dashboard stats.

```json
{
  "data": {
    "stats": {
      "outlets": 2,
      "menus": 10,
      "stockItems": 10,
      "lowStockItems": 1,
      "users": 5,
      "cashiers": 2
    },
    "lowStockMenus": [],
    "recentOutlets": []
  }
}
```

---

### Outlets

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/admin/outlets` | List outlet |
| POST | `/api/admin/outlets` | Buat outlet |
| PATCH | `/api/admin/outlets/{id}` | Update outlet |

**Body create/update**

```json
{
  "name": "Kantin A",
  "location": "Lt 1",
  "qrisImageUrl": null
}
```

---

### Menu

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/admin/menu` | List paginated (`?search=&outlet=&page=`) |
| POST | `/api/admin/menu` | Buat menu (JSON atau multipart) |
| PATCH | `/api/admin/menu/{id}` | Update menu |
| DELETE | `/api/admin/menu/{id}` | Hapus menu |

**Body create (JSON)**

```json
{
  "name": "Nasi Goreng",
  "description": "Pedas",
  "price": 15000,
  "outletId": 1,
  "initialStockQuantity": 10
}
```

`outletId` boleh `"all"` untuk membuat menu di semua outlet.

Upload gambar: `multipart/form-data` dengan field `imageFile` (+ field lain sama).

**Response list**

```json
{
  "data": {
    "menus": [],
    "outlets": [],
    "filters": { "search": "", "outlet": null }
  },
  "meta": {
    "currentPage": 1,
    "lastPage": 1,
    "perPage": 10,
    "total": 0
  }
}
```

---

### Stock

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/admin/stock` | List menu + stok (paginated, filter sama menu) |
| PATCH | `/api/admin/menu/{id}/stock` | Update stok |

**Body**

```json
{
  "quantity": 20
}
```

---

### Users

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/admin/users` | List paginated (`?search=&role=&outlet=&page=`) |
| POST | `/api/admin/users` | Buat user |
| PATCH | `/api/admin/users/{id}` | Update user |
| DELETE | `/api/admin/users/{id}` | Hapus user (bukan diri sendiri) |

**Roles yang valid:** `Admin`, `Cashier`, `Customer`

**Body create**

```json
{
  "username": "kasir1",
  "fullName": "Kasir Satu",
  "password": "password",
  "role": "Cashier",
  "outletId": 1
}
```

`outletId` **wajib** jika `role` = `Cashier`. Untuk Admin/Customer biarkan `null` / tidak dikirim.

Update: `password` opsional (kirim string kosong / omit jika tidak ganti).

---

## 5. Customer API

Semua butuh Bearer + role Customer/Mahasiswa.

### `GET /api/app/menu`

Query: `?search=&outlet=`

```json
{
  "data": {
    "menus": [
      {
        "id": 1,
        "name": "Nasi Goreng",
        "description": "...",
        "price": 15000,
        "outletId": 1,
        "outletName": "Kantin A",
        "stockQuantity": 5,
        "imageUrl": "/storage/menu-images/xxx.jpg"
      }
    ],
    "outlets": [],
    "filters": { "search": "", "outlet": null }
  }
}
```

---

### `GET /api/app/orders`

Riwayat pesanan milik user (maks 20, terbaru dulu).

```json
{
  "data": [
    {
      "id": 10,
      "customerName": "Customer Satu",
      "totalAmount": 30000,
      "paymentMethod": "BYPASS",
      "paymentStatus": "paid",
      "orderStatus": 1,
      "status": 1,
      "outletId": 1,
      "outletName": "Kantin A",
      "createdAt": "...",
      "items": [
        {
          "id": 1,
          "menuItemId": 1,
          "menuName": "Nasi Goreng",
          "quantity": 2,
          "unitPrice": 15000,
          "subtotal": 30000
        }
      ]
    }
  ]
}
```

---

### `POST /api/app/orders`

Membuat pesanan. Harga dihitung **server-side**. Semua item harus dari **satu outlet**. Stok dikurangi. Payment: `BYPASS` + `paid`.

**Body**

```json
{
  "items": [
    { "menuItemId": 1, "quantity": 2 },
    { "menuItemId": 3, "quantity": 1 }
  ]
}
```

**Response `201`**

```json
{
  "message": "Pesanan berhasil dibuat.",
  "data": { "...transaction...": true }
}
```

---

## 6. Cashier API

Semua butuh Bearer + role Cashier/Kasir. Data otomatis scoped ke `outlet_id` kasir.

### `GET /api/cashier/orders`

Pesanan masuk status Received / Preparing / Ready.

```json
{
  "data": {
    "orders": [],
    "outlet": { "id": 1, "name": "Kantin A", "location": "Lt 1" },
    "stats": {
      "received": 2,
      "preparing": 1,
      "ready": 0
    }
  }
}
```

---

### `PATCH /api/cashier/orders/{id}/status`

**Body**

```json
{
  "status": 2
}
```

**Order status**

| Nilai | Arti |
|------:|------|
| 1 | Received |
| 2 | Preparing |
| 3 | Ready |
| 4 | Completed |
| 5 | Cancelled (stok dikembalikan) |

---

### `GET /api/cashier/cash-payment`

Data POS: menu outlet, recent transactions, flag `canSubmitCashTransaction`.

---

### `POST /api/cashier/cash-payment`

Transaksi tunai walk-in. Payment: `COD` + `paid`.

**Body**

```json
{
  "customerName": "Pelanggan walk-in",
  "cashReceivedAmount": 50000,
  "items": [
    { "menuItemId": 1, "quantity": 2 }
  ]
}
```

`cashReceivedAmount` harus ≥ total. Response berisi `changeAmount`.

---

## 7. Shape data umum

### User

```json
{
  "id": 1,
  "username": "string",
  "fullName": "string|null",
  "role": "Admin|Cashier|Customer|Kasir|Mahasiswa",
  "outletId": 1,
  "outletName": "string|null",
  "createdAt": "ISO8601"
}
```

### Outlet

```json
{
  "id": 1,
  "name": "string",
  "location": "string|null",
  "qrisImageUrl": "string|null",
  "menuItemsCount": 0
}
```

### MenuItem

```json
{
  "id": 1,
  "name": "string",
  "description": "string|null",
  "price": 15000.0,
  "outletId": 1,
  "outletName": "string|null",
  "stockQuantity": 10,
  "imageUrl": "string|null"
}
```

`imageUrl` relatif ke host app (contoh full URL: `http://localhost:8000/storage/...`). Pastikan `php artisan storage:link` sudah dijalankan.

---

## 8. Error format

### Validasi `422`

```json
{
  "message": "The username field is required. (and 1 more error)",
  "errors": {
    "username": ["The username field is required."],
    "password": ["The password field is required."]
  }
}
```

### Unauthorized `401`

```json
{
  "message": "Unauthenticated."
}
```

### Forbidden `403`

```json
{
  "message": "Forbidden."
}
```

---

## 9. Contoh Dart (ringkas)

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

const baseUrl = 'http://10.0.2.2:8000/api'; // Android emulator

Future<Map<String, dynamic>> login(String username, String password) async {
  final res = await http.post(
    Uri.parse('$baseUrl/login'),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'username': username,
      'password': password,
    }),
  );

  if (res.statusCode != 200) {
    throw Exception(jsonDecode(res.body));
  }

  return jsonDecode(res.body) as Map<String, dynamic>;
}

Future<http.Response> apiGet(String path, String token) {
  return http.get(
    Uri.parse('$baseUrl$path'),
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    },
  );
}
```

Setelah login:

```dart
final data = await login('customer_satu', 'password');
final token = data['token'] as String;
final role = data['user']['role'] as String;
// simpan token, navigasi berdasarkan role
```

---

## 10. Mapping route web → API

| Web (Inertia) | API |
|---------------|-----|
| `POST /login` | `POST /api/login` |
| `POST /register` | `POST /api/register` |
| `POST /logout` | `POST /api/logout` |
| — | `GET /api/me` |
| `GET /admin` | `GET /api/admin` |
| `GET/POST /admin/outlets` | `GET/POST /api/admin/outlets` |
| `PATCH /admin/outlets/{id}` | `PATCH /api/admin/outlets/{id}` |
| `GET/POST /admin/menu` | `GET/POST /api/admin/menu` |
| `PATCH/DELETE /admin/menu/{id}` | `PATCH/DELETE /api/admin/menu/{id}` |
| `GET /admin/stock` | `GET /api/admin/stock` |
| `PATCH /admin/menu/{id}/stock` | `PATCH /api/admin/menu/{id}/stock` |
| `GET/POST /admin/users` | `GET/POST /api/admin/users` |
| `PATCH/DELETE /admin/users/{id}` | `PATCH/DELETE /api/admin/users/{id}` |
| `GET /app` | `GET /api/app/menu` |
| `GET/POST /app/orders` | `GET/POST /api/app/orders` |
| `GET /cashier` | `GET /api/cashier/orders` |
| `PATCH /cashier/orders/{id}/status` | `PATCH /api/cashier/orders/{id}/status` |
| `GET/POST /cashier/cash-payment` | `GET/POST /api/cashier/cash-payment` |

Halaman docs Inertia (`/docs/overview`) **tidak** di-expose sebagai API.

---

## 11. Catatan untuk Flutter

1. Field JSON memakai **camelCase** (`fullName`, `menuItemId`, `orderStatus`).
2. Jangan percaya harga dari client — kirim `menuItemId` + `quantity` saja.
3. Cashier tanpa `outletId` akan mendapat list kosong / tidak bisa submit cash.
4. Untuk Android emulator → `10.0.2.2`; device fisik → IP mesin host di LAN.
5. Jalankan server: `php artisan serve --host=0.0.0.0 --port=8000`.
