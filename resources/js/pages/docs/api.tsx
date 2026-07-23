import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type DocsApiProps = {
    baseUrl: string;
    appUrl: string;
};

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type Endpoint = {
    id: string;
    method: HttpMethod;
    path: string;
    title: string;
    description: string;
    auth: boolean;
    roles?: string[];
    query?: string;
    body?: string;
    response: string;
    status?: number;
};

type EndpointGroup = {
    id: string;
    title: string;
    description: string;
    endpoints: Endpoint[];
};

const METHOD_STYLES: Record<HttpMethod, string> = {
    GET: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    POST: 'bg-blue-100 text-blue-800 border-blue-200',
    PATCH: 'bg-amber-100 text-amber-900 border-amber-200',
    DELETE: 'bg-rose-100 text-rose-800 border-rose-200',
};

function CopyChip({ value, label }: { value: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    function copy() {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    }

    return (
        <button
            className="inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-700 transition hover:border-slate-300 hover:bg-white"
            onClick={copy}
            title="Salin"
            type="button"
        >
            <span className="truncate">{label ?? value}</span>
            <span className="shrink-0 text-[10px] font-sans font-semibold uppercase tracking-wide text-slate-400">
                {copied ? 'OK' : 'Salin'}
            </span>
        </button>
    );
}

function CodePanel({
    title,
    code,
    tone = 'dark',
}: {
    title: string;
    code: string;
    tone?: 'dark' | 'light';
}) {
    const [copied, setCopied] = useState(false);

    function copy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    }

    return (
        <div
            className={`overflow-hidden rounded-lg border ${
                tone === 'dark'
                    ? 'border-slate-800 bg-slate-950'
                    : 'border-slate-200 bg-white'
            }`}
        >
            <div
                className={`flex items-center justify-between border-b px-3 py-2 ${
                    tone === 'dark'
                        ? 'border-white/10 bg-white/5'
                        : 'border-slate-200 bg-slate-50'
                }`}
            >
                <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                        tone === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}
                >
                    {title}
                </span>
                <button
                    className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                        tone === 'dark'
                            ? 'text-slate-400 hover:bg-white/10 hover:text-white'
                            : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                    }`}
                    onClick={copy}
                    type="button"
                >
                    {copied ? 'Tersalin' : 'Salin'}
                </button>
            </div>
            <pre
                className={`overflow-x-auto p-3 text-[12px] leading-relaxed ${
                    tone === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}
            >
                <code>{code}</code>
            </pre>
        </div>
    );
}

function EndpointCard({
    endpoint,
    baseUrl,
}: {
    endpoint: Endpoint;
    baseUrl: string;
}) {
    const [open, setOpen] = useState(false);
    const fullUrl = `${baseUrl}${endpoint.path}${endpoint.query ?? ''}`;

    return (
        <article
            className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            id={endpoint.id}
        >
            <button
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50/80 sm:px-5"
                onClick={() => setOpen((v) => !v)}
                type="button"
            >
                <span
                    className={`mt-0.5 inline-flex min-w-16 shrink-0 items-center justify-center rounded border px-2 py-0.5 text-[11px] font-bold tracking-wide ${METHOD_STYLES[endpoint.method]}`}
                >
                    {endpoint.method}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-semibold text-slate-900">
                            {endpoint.path}
                        </p>
                        {endpoint.auth ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                Bearer
                            </span>
                        ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Public
                            </span>
                        )}
                        {endpoint.roles?.map((role) => (
                            <span
                                className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                                key={role}
                            >
                                {role}
                            </span>
                        ))}
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                        {endpoint.title}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {endpoint.description}
                    </p>
                </div>
                <svg
                    className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open ? (
                <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-5">
                    <div>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Full URL
                        </p>
                        <CopyChip value={fullUrl} />
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                        {endpoint.body ? (
                            <CodePanel
                                code={endpoint.body}
                                title={`Request body → ${endpoint.status ?? 200}`}
                            />
                        ) : (
                            <CodePanel
                                code={
                                    endpoint.method === 'GET'
                                        ? '// Tidak ada body.\n// Gunakan query string bila ada.'
                                        : '// Tidak ada body.'
                                }
                                title="Request body"
                            />
                        )}
                        <CodePanel
                            code={endpoint.response}
                            title={`Response ${endpoint.status ?? 200}`}
                        />
                    </div>
                </div>
            ) : null}
        </article>
    );
}

function buildGroups(): EndpointGroup[] {
    return [
        {
            id: 'auth',
            title: 'Authentication',
            description:
                'Login untuk mendapatkan token Sanctum. Token dikirim sebagai Authorization: Bearer {token}.',
            endpoints: [
                {
                    id: 'post-login',
                    method: 'POST',
                    path: '/login',
                    title: 'Login',
                    description:
                        'Autentikasi username & password. Mengembalikan token + data user.',
                    auth: false,
                    status: 200,
                    body: JSON.stringify(
                        {
                            username: 'customer_satu',
                            password: 'password',
                        },
                        null,
                        2,
                    ),
                    response: JSON.stringify(
                        {
                            message: 'Login berhasil.',
                            token: '1|xxxxxxxxxxxxxxxx',
                            tokenType: 'Bearer',
                            user: {
                                id: 1,
                                username: 'customer_satu',
                                fullName: 'Customer Satu',
                                role: 'Customer',
                                outletId: null,
                                outletName: null,
                                createdAt: '2026-07-22T00:00:00.000000Z',
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'post-register',
                    method: 'POST',
                    path: '/register',
                    title: 'Register Customer',
                    description:
                        'Membuat akun Customer. Tidak auto-login — lanjutkan ke /login.',
                    auth: false,
                    status: 201,
                    body: JSON.stringify(
                        {
                            username: 'baru',
                            fullName: 'Nama Lengkap',
                            password: 'password',
                            password_confirmation: 'password',
                        },
                        null,
                        2,
                    ),
                    response: JSON.stringify(
                        {
                            message: 'Registrasi berhasil. Silakan login.',
                            user: {
                                id: 12,
                                username: 'baru',
                                fullName: 'Nama Lengkap',
                                role: 'Customer',
                                outletId: null,
                                outletName: null,
                                createdAt: '2026-07-22T00:00:00.000000Z',
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'post-logout',
                    method: 'POST',
                    path: '/logout',
                    title: 'Logout',
                    description: 'Revoke token yang sedang dipakai.',
                    auth: true,
                    status: 200,
                    response: JSON.stringify(
                        { message: 'Logout berhasil.' },
                        null,
                        2,
                    ),
                },
                {
                    id: 'get-me',
                    method: 'GET',
                    path: '/me',
                    title: 'Profil saya',
                    description: 'Ambil data user dari token aktif.',
                    auth: true,
                    status: 200,
                    response: JSON.stringify(
                        {
                            data: {
                                id: 1,
                                username: 'customer_satu',
                                fullName: 'Customer Satu',
                                role: 'Customer',
                                outletId: null,
                                outletName: null,
                                createdAt: '2026-07-22T00:00:00.000000Z',
                            },
                        },
                        null,
                        2,
                    ),
                },
            ],
        },
        {
            id: 'admin',
            title: 'Admin',
            description: 'Butuh role Admin. Prefix /admin.',
            endpoints: [
                {
                    id: 'get-admin-dashboard',
                    method: 'GET',
                    path: '/admin',
                    title: 'Dashboard',
                    description: 'Statistik ringkas, low stock, outlet terbaru.',
                    auth: true,
                    roles: ['Admin'],
                    response: JSON.stringify(
                        {
                            data: {
                                stats: {
                                    outlets: 2,
                                    menus: 10,
                                    stockItems: 10,
                                    lowStockItems: 1,
                                    users: 5,
                                    cashiers: 2,
                                },
                                lowStockMenus: [],
                                recentOutlets: [],
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'get-admin-outlets',
                    method: 'GET',
                    path: '/admin/outlets',
                    title: 'List outlets',
                    description: 'Semua outlet + jumlah menu.',
                    auth: true,
                    roles: ['Admin'],
                    response: JSON.stringify(
                        {
                            data: [
                                {
                                    id: 1,
                                    name: 'Kantin A',
                                    location: 'Lt 1',
                                    qrisImageUrl: null,
                                    menuItemsCount: 8,
                                },
                            ],
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'post-admin-outlets',
                    method: 'POST',
                    path: '/admin/outlets',
                    title: 'Buat outlet',
                    description: 'Tambah outlet baru.',
                    auth: true,
                    roles: ['Admin'],
                    status: 201,
                    body: JSON.stringify(
                        {
                            name: 'Kantin A',
                            location: 'Lt 1',
                            qrisImageUrl: null,
                        },
                        null,
                        2,
                    ),
                    response: JSON.stringify(
                        {
                            message: 'Outlet berhasil dibuat.',
                            data: {
                                id: 1,
                                name: 'Kantin A',
                                location: 'Lt 1',
                                qrisImageUrl: null,
                                menuItemsCount: 0,
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'patch-admin-outlets',
                    method: 'PATCH',
                    path: '/admin/outlets/{id}',
                    title: 'Update outlet',
                    description: 'Perbarui nama / lokasi / QRIS.',
                    auth: true,
                    roles: ['Admin'],
                    body: JSON.stringify(
                        {
                            name: 'Kantin A Updated',
                            location: 'Lt 2',
                            qrisImageUrl: null,
                        },
                        null,
                        2,
                    ),
                    response: JSON.stringify(
                        {
                            message: 'Outlet berhasil diperbarui.',
                            data: {
                                id: 1,
                                name: 'Kantin A Updated',
                                location: 'Lt 2',
                                qrisImageUrl: null,
                                menuItemsCount: 8,
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'get-admin-menu',
                    method: 'GET',
                    path: '/admin/menu',
                    title: 'List menu',
                    description: 'Paginated. Filter ?search=&outlet=&page=',
                    auth: true,
                    roles: ['Admin'],
                    query: '?search=&outlet=&page=1',
                    response: JSON.stringify(
                        {
                            data: {
                                menus: [
                                    {
                                        id: 1,
                                        name: 'Nasi Goreng',
                                        description: 'Pedas',
                                        price: 15000,
                                        outletId: 1,
                                        outletName: 'Kantin A',
                                        stockQuantity: 10,
                                        imageUrl: null,
                                    },
                                ],
                                outlets: [],
                                filters: { search: '', outlet: null },
                            },
                            meta: {
                                currentPage: 1,
                                lastPage: 1,
                                perPage: 10,
                                total: 1,
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'post-admin-menu',
                    method: 'POST',
                    path: '/admin/menu',
                    title: 'Buat menu',
                    description:
                        'outletId bisa angka atau "all". Upload gambar: multipart field imageFile.',
                    auth: true,
                    roles: ['Admin'],
                    status: 201,
                    body: JSON.stringify(
                        {
                            name: 'Nasi Goreng',
                            description: 'Pedas',
                            price: 15000,
                            outletId: 1,
                            initialStockQuantity: 10,
                        },
                        null,
                        2,
                    ),
                    response: JSON.stringify(
                        {
                            message: 'Menu berhasil dibuat.',
                            data: [
                                {
                                    id: 1,
                                    name: 'Nasi Goreng',
                                    price: 15000,
                                    outletId: 1,
                                    stockQuantity: 10,
                                },
                            ],
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'patch-admin-menu',
                    method: 'PATCH',
                    path: '/admin/menu/{id}',
                    title: 'Update menu',
                    description: 'Update detail menu (+ opsional stockQuantity / imageFile).',
                    auth: true,
                    roles: ['Admin'],
                    body: JSON.stringify(
                        {
                            name: 'Nasi Goreng Spesial',
                            description: 'Pedas manis',
                            price: 17000,
                            stockQuantity: 12,
                        },
                        null,
                        2,
                    ),
                    response: JSON.stringify(
                        {
                            message: 'Menu berhasil diperbarui.',
                            data: {
                                id: 1,
                                name: 'Nasi Goreng Spesial',
                                price: 17000,
                                stockQuantity: 12,
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'delete-admin-menu',
                    method: 'DELETE',
                    path: '/admin/menu/{id}',
                    title: 'Hapus menu',
                    description: 'Menghapus menu dan file gambar orphan.',
                    auth: true,
                    roles: ['Admin'],
                    response: JSON.stringify(
                        { message: 'Menu berhasil dihapus.' },
                        null,
                        2,
                    ),
                },
                {
                    id: 'get-admin-stock',
                    method: 'GET',
                    path: '/admin/stock',
                    title: 'List stok',
                    description: 'Sama seperti list menu, fokus stok.',
                    auth: true,
                    roles: ['Admin'],
                    query: '?search=&outlet=&page=1',
                    response: JSON.stringify(
                        {
                            data: {
                                menus: [],
                                outlets: [],
                                filters: { search: '', outlet: null },
                            },
                            meta: {
                                currentPage: 1,
                                lastPage: 1,
                                perPage: 10,
                                total: 0,
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'patch-admin-stock',
                    method: 'PATCH',
                    path: '/admin/menu/{id}/stock',
                    title: 'Update stok',
                    description: 'Set quantity stok menu (0–1000).',
                    auth: true,
                    roles: ['Admin'],
                    body: JSON.stringify({ quantity: 20 }, null, 2),
                    response: JSON.stringify(
                        {
                            message: 'Stok berhasil diperbarui.',
                            data: {
                                id: 1,
                                name: 'Nasi Goreng',
                                stockQuantity: 20,
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'get-admin-users',
                    method: 'GET',
                    path: '/admin/users',
                    title: 'List users',
                    description: 'Paginated. Filter ?search=&role=&outlet=&page=',
                    auth: true,
                    roles: ['Admin'],
                    query: '?search=&role=&outlet=&page=1',
                    response: JSON.stringify(
                        {
                            data: {
                                users: [],
                                outlets: [],
                                filters: {
                                    search: '',
                                    role: null,
                                    outlet: null,
                                },
                                roles: ['Admin', 'Cashier', 'Customer'],
                            },
                            meta: {
                                currentPage: 1,
                                lastPage: 1,
                                perPage: 10,
                                total: 0,
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'post-admin-users',
                    method: 'POST',
                    path: '/admin/users',
                    title: 'Buat user',
                    description:
                        'Role: Admin | Cashier | Customer. outletId wajib untuk Cashier.',
                    auth: true,
                    roles: ['Admin'],
                    status: 201,
                    body: JSON.stringify(
                        {
                            username: 'kasir1',
                            fullName: 'Kasir Satu',
                            password: 'password',
                            role: 'Cashier',
                            outletId: 1,
                        },
                        null,
                        2,
                    ),
                    response: JSON.stringify(
                        {
                            message: 'User berhasil dibuat.',
                            data: {
                                id: 5,
                                username: 'kasir1',
                                fullName: 'Kasir Satu',
                                role: 'Cashier',
                                outletId: 1,
                                outletName: 'Kantin A',
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'patch-admin-users',
                    method: 'PATCH',
                    path: '/admin/users/{id}',
                    title: 'Update user',
                    description: 'Password opsional (kosongkan jika tidak diganti).',
                    auth: true,
                    roles: ['Admin'],
                    body: JSON.stringify(
                        {
                            username: 'kasir1',
                            fullName: 'Kasir Satu Updated',
                            password: '',
                            role: 'Cashier',
                            outletId: 1,
                        },
                        null,
                        2,
                    ),
                    response: JSON.stringify(
                        {
                            message: 'User berhasil diperbarui.',
                            data: {
                                id: 5,
                                username: 'kasir1',
                                role: 'Cashier',
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'delete-admin-users',
                    method: 'DELETE',
                    path: '/admin/users/{id}',
                    title: 'Hapus user',
                    description: 'Tidak bisa menghapus akun sendiri.',
                    auth: true,
                    roles: ['Admin'],
                    response: JSON.stringify(
                        { message: 'User berhasil dihapus.' },
                        null,
                        2,
                    ),
                },
            ],
        },
        {
            id: 'customer',
            title: 'Customer',
            description: 'Butuh role Customer / Mahasiswa. Prefix /app.',
            endpoints: [
                {
                    id: 'get-app-menu',
                    method: 'GET',
                    path: '/app/menu',
                    title: 'List menu customer',
                    description: 'Semua menu tersedia. Filter ?search=&outlet=',
                    auth: true,
                    roles: ['Customer'],
                    query: '?search=&outlet=',
                    response: JSON.stringify(
                        {
                            data: {
                                menus: [
                                    {
                                        id: 1,
                                        name: 'Nasi Goreng',
                                        description: '...',
                                        price: 15000,
                                        outletId: 1,
                                        outletName: 'Kantin A',
                                        stockQuantity: 5,
                                        imageUrl: '/storage/menu-images/xxx.jpg',
                                    },
                                ],
                                outlets: [],
                                filters: { search: '', outlet: null },
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'get-app-orders',
                    method: 'GET',
                    path: '/app/orders',
                    title: 'Riwayat pesanan',
                    description: 'Pesanan milik user login (maks 20).',
                    auth: true,
                    roles: ['Customer'],
                    response: JSON.stringify(
                        {
                            data: [
                                {
                                    id: 10,
                                    customerName: 'Customer Satu',
                                    totalAmount: 30000,
                                    paymentMethod: 'BYPASS',
                                    paymentStatus: 'paid',
                                    orderStatus: 1,
                                    outletId: 1,
                                    outletName: 'Kantin A',
                                    items: [
                                        {
                                            id: 1,
                                            menuItemId: 1,
                                            menuName: 'Nasi Goreng',
                                            quantity: 2,
                                            unitPrice: 15000,
                                            subtotal: 30000,
                                        },
                                    ],
                                },
                            ],
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'post-app-orders',
                    method: 'POST',
                    path: '/app/orders',
                    title: 'Buat pesanan',
                    description:
                        'Harga dihitung server. Semua item harus dari satu outlet. Stok dikurangi.',
                    auth: true,
                    roles: ['Customer'],
                    status: 201,
                    body: JSON.stringify(
                        {
                            items: [
                                { menuItemId: 1, quantity: 2 },
                                { menuItemId: 3, quantity: 1 },
                            ],
                        },
                        null,
                        2,
                    ),
                    response: JSON.stringify(
                        {
                            message: 'Pesanan berhasil dibuat.',
                            data: {
                                id: 10,
                                totalAmount: 45000,
                                paymentMethod: 'BYPASS',
                                paymentStatus: 'paid',
                                orderStatus: 1,
                            },
                        },
                        null,
                        2,
                    ),
                },
            ],
        },
        {
            id: 'cashier',
            title: 'Cashier',
            description:
                'Butuh role Cashier / Kasir. Data otomatis scoped ke outlet kasir.',
            endpoints: [
                {
                    id: 'get-cashier-orders',
                    method: 'GET',
                    path: '/cashier/orders',
                    title: 'Pesanan masuk',
                    description: 'Status Received / Preparing / Ready + stats.',
                    auth: true,
                    roles: ['Cashier'],
                    response: JSON.stringify(
                        {
                            data: {
                                orders: [],
                                outlet: {
                                    id: 1,
                                    name: 'Kantin A',
                                    location: 'Lt 1',
                                },
                                stats: {
                                    received: 2,
                                    preparing: 1,
                                    ready: 0,
                                },
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'patch-cashier-status',
                    method: 'PATCH',
                    path: '/cashier/orders/{id}/status',
                    title: 'Update status pesanan',
                    description:
                        '1 Received → 2 Preparing → 3 Ready → 4 Completed | 5 Cancelled (restock).',
                    auth: true,
                    roles: ['Cashier'],
                    body: JSON.stringify({ status: 2 }, null, 2),
                    response: JSON.stringify(
                        {
                            message: 'Pesanan mulai diproses.',
                            data: {
                                id: 10,
                                orderStatus: 2,
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'get-cashier-cash',
                    method: 'GET',
                    path: '/cashier/cash-payment',
                    title: 'Data POS tunai',
                    description: 'Menu outlet + recent transactions.',
                    auth: true,
                    roles: ['Cashier'],
                    response: JSON.stringify(
                        {
                            data: {
                                menus: [],
                                outlet: { id: 1, name: 'Kantin A' },
                                canSubmitCashTransaction: true,
                                recentTransactions: [],
                            },
                        },
                        null,
                        2,
                    ),
                },
                {
                    id: 'post-cashier-cash',
                    method: 'POST',
                    path: '/cashier/cash-payment',
                    title: 'Simpan transaksi tunai',
                    description:
                        'Walk-in COD. cashReceivedAmount harus ≥ total. Change dihitung server.',
                    auth: true,
                    roles: ['Cashier'],
                    status: 201,
                    body: JSON.stringify(
                        {
                            customerName: 'Pelanggan walk-in',
                            cashReceivedAmount: 50000,
                            items: [{ menuItemId: 1, quantity: 2 }],
                        },
                        null,
                        2,
                    ),
                    response: JSON.stringify(
                        {
                            message: 'Transaksi tunai berhasil disimpan.',
                            data: {
                                id: 20,
                                totalAmount: 30000,
                                cashReceivedAmount: 50000,
                                changeAmount: 20000,
                                paymentMethod: 'COD',
                                paymentStatus: 'paid',
                                orderStatus: 1,
                            },
                        },
                        null,
                        2,
                    ),
                },
            ],
        },
    ];
}

const TOC = [
    { id: 'mulai', title: 'Mulai cepat' },
    { id: 'headers', title: 'Headers' },
    { id: 'auth', title: 'Authentication' },
    { id: 'admin', title: 'Admin' },
    { id: 'customer', title: 'Customer' },
    { id: 'cashier', title: 'Cashier' },
    { id: 'errors', title: 'Error codes' },
    { id: 'status', title: 'Order status' },
];

export default function DocsApi({ baseUrl, appUrl }: DocsApiProps) {
    const groups = buildGroups();
    const [activeId, setActiveId] = useState('mulai');

    useEffect(() => {
        const ids = [
            'mulai',
            'headers',
            ...groups.map((g) => g.id),
            'errors',
            'status',
        ];

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((e) => e.isIntersecting);

                if (visible) {
                    setActiveId(visible.target.id);
                }
            },
            { rootMargin: '-12% 0px -78% 0px' },
        );

        ids.forEach((id) => {
            const el = document.getElementById(id);

            if (el) {
                observer.observe(el);
            }
        });

        return () => observer.disconnect();
    }, [groups]);

    const curlLogin = `curl -X POST "${baseUrl}/login" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -d '{"username":"customer_satu","password":"password"}'`;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Head title="Dokumentasi API" />

            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
                            KP
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Sistem Kantin Paramadina
                            </p>
                            <p className="text-xs text-slate-500">
                                Dokumentasi API · Sanctum
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            className="hidden h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
                            href="/docs/overview"
                        >
                            Overview MVC
                        </Link>
                        <Link
                            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                            href="/"
                        >
                            ← App
                        </Link>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex items-start gap-8 xl:gap-12">
                    <aside className="sticky top-16 hidden max-h-[calc(100dvh-4.5rem)] w-56 shrink-0 overflow-y-auto xl:block">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Navigasi
                        </p>
                        <nav>
                            <ul className="space-y-0.5">
                                {TOC.map((item) => (
                                    <li key={item.id}>
                                        <a
                                            className={`block rounded-md px-2.5 py-1.5 text-sm transition ${
                                                activeId === item.id
                                                    ? 'bg-blue-50 font-semibold text-blue-700'
                                                    : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                            href={`#${item.id}`}
                                        >
                                            {item.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>

                    <main className="min-w-0 flex-1 space-y-10">
                        <section className="scroll-mt-24" id="mulai">
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                REST API
                            </p>
                            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                                Dokumentasi API
                            </h1>
                            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
                                Endpoint JSON untuk aplikasi Flutter. Auth memakai
                                Laravel Sanctum — login sekali, simpan token,
                                kirim Bearer di setiap request.
                            </p>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Base URL
                                    </p>
                                    <div className="mt-2">
                                        <CopyChip value={baseUrl} />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        App host: {appUrl}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Alur Flutter
                                    </p>
                                    <ol className="mt-2 space-y-1 text-sm text-slate-700">
                                        <li>1. POST /login → simpan token</li>
                                        <li>2. Baca user.role untuk navigasi</li>
                                        <li>3. Header Authorization: Bearer …</li>
                                        <li>4. POST /logout saat keluar</li>
                                    </ol>
                                </div>
                            </div>

                            <div className="mt-4">
                                <CodePanel code={curlLogin} title="Contoh curl login" />
                            </div>
                        </section>

                        <section className="scroll-mt-24" id="headers">
                            <h2 className="text-xl font-bold text-slate-900">
                                Headers
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Selalu kirim header berikut. Upload gambar menu
                                memakai <code className="rounded bg-slate-100 px-1">multipart/form-data</code>.
                            </p>
                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2.5 font-semibold">
                                                Header
                                            </th>
                                            <th className="px-4 py-2.5 font-semibold">
                                                Nilai
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="px-4 py-2.5 font-mono text-xs">
                                                Accept
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-xs text-slate-700">
                                                application/json
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2.5 font-mono text-xs">
                                                Content-Type
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-xs text-slate-700">
                                                application/json
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2.5 font-mono text-xs">
                                                Authorization
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-xs text-slate-700">
                                                Bearer {'{token}'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {groups.map((group) => (
                            <section
                                className="scroll-mt-24 space-y-3"
                                id={group.id}
                                key={group.id}
                            >
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {group.title}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {group.description}
                                    </p>
                                </div>
                                <div className="space-y-2.5">
                                    {group.endpoints.map((endpoint) => (
                                        <EndpointCard
                                            baseUrl={baseUrl}
                                            endpoint={endpoint}
                                            key={endpoint.id}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}

                        <section className="scroll-mt-24" id="errors">
                            <h2 className="text-xl font-bold text-slate-900">
                                Error codes
                            </h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="font-mono text-sm font-bold text-amber-700">
                                        401
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        Unauthenticated
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Token hilang / invalid
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="font-mono text-sm font-bold text-rose-700">
                                        403
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        Forbidden
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Role tidak cocok
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="font-mono text-sm font-bold text-orange-700">
                                        422
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        Validation
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Field errors di errors.*
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <CodePanel
                                    code={JSON.stringify(
                                        {
                                            message:
                                                'The username field is required. (and 1 more error)',
                                            errors: {
                                                username: [
                                                    'The username field is required.',
                                                ],
                                            },
                                        },
                                        null,
                                        2,
                                    )}
                                    title="Contoh 422"
                                />
                            </div>
                        </section>

                        <section className="scroll-mt-24 pb-16" id="status">
                            <h2 className="text-xl font-bold text-slate-900">
                                Order status
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Dipakai di field <code className="rounded bg-slate-100 px-1">orderStatus</code> /
                                body update status kasir.
                            </p>
                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2.5 font-semibold">
                                                Nilai
                                            </th>
                                            <th className="px-4 py-2.5 font-semibold">
                                                Arti
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            [1, 'Received'],
                                            [2, 'Preparing'],
                                            [3, 'Ready'],
                                            [4, 'Completed'],
                                            [5, 'Cancelled (stok dikembalikan)'],
                                        ].map(([value, label]) => (
                                            <tr key={String(value)}>
                                                <td className="px-4 py-2.5 font-mono text-xs font-semibold">
                                                    {value}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-700">
                                                    {label}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-4 text-xs text-slate-500">
                                Spec markdown lengkap juga ada di{' '}
                                <code className="rounded bg-slate-100 px-1">
                                    docs/API.md
                                </code>{' '}
                                — siap dilempar ke project Flutter.
                            </p>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
}
