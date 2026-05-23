import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { index as adminMenuIndex } from '@/routes/admin/menu';
import { index as adminOutletsIndex } from '@/routes/admin/outlets';
import { index as adminStockIndex } from '@/routes/admin/stock';
import { index as adminUsersIndex } from '@/routes/admin/users';
import type { MenuItemSummary, OutletSummary } from '@/types';

type DashboardStats = {
    outlets: number;
    menus: number;
    stockItems: number;
    lowStockItems: number;
    users: number;
    cashiers: number;
};

type AdminDashboardProps = {
    stats: DashboardStats;
    lowStockMenus: MenuItemSummary[];
    recentOutlets: OutletSummary[];
};

export default function AdminDashboard({
    lowStockMenus,
    recentOutlets,
    stats,
}: AdminDashboardProps) {
    return (
        <AdminLayout
            description="Ringkasan operasional kantin untuk admin."
            title="Dashboard"
        >
            <Head title="Dashboard Admin" />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon="outlet"
                    label="Outlet aktif"
                    tone="blue"
                    value={stats.outlets}
                />
                <StatCard
                    icon="menu"
                    label="Menu terdaftar"
                    tone="emerald"
                    value={stats.menus}
                />
                <StatCard
                    icon="stock"
                    label="Item stok"
                    tone="slate"
                    value={stats.stockItems}
                />
                <StatCard
                    icon="warning"
                    label="Stok rendah"
                    tone="amber"
                    value={stats.lowStockItems}
                />
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.75fr]">
                <Card className="min-w-0">
                    <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Stok Perlu Perhatian</CardTitle>
                        <Link
                            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-blue-100"
                            href={adminStockIndex.url()}
                        >
                            Buka Stok
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {lowStockMenus.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {lowStockMenus.map((menu) => (
                                    <div
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                        key={menu.id}
                                    >
                                        <div className="flex items-start gap-3">
                                            {menu.imageUrl ? (
                                                <img
                                                    alt={menu.name}
                                                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                                    src={menu.imageUrl}
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-primary">
                                                    {menu.name
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-slate-900">
                                                    {menu.name}
                                                </p>
                                                <p className="truncate text-sm text-slate-500">
                                                    {menu.outletName ?? '-'}
                                                </p>
                                            </div>
                                            <Badge
                                                className="bg-orange-50 text-orange-800"
                                                variant="secondary"
                                            >
                                                {menu.stockQuantity}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="Belum ada stok rendah yang ditampilkan." />
                        )}
                    </CardContent>
                </Card>

                <Card className="min-w-0">
                    <CardHeader>
                        <CardTitle>Akses Cepat</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <QuickLink
                            href={adminMenuIndex.url()}
                            icon="menu"
                            label="Kelola Menu"
                            meta={`${stats.menus} menu`}
                        />
                        <QuickLink
                            href={adminOutletsIndex.url()}
                            icon="outlet"
                            label="Kelola Outlet"
                            meta={`${stats.outlets} outlet`}
                        />
                        <QuickLink
                            href={adminStockIndex.url()}
                            icon="stock"
                            label="Kelola Stok"
                            meta={`${stats.lowStockItems} rendah`}
                        />
                        <QuickLink
                            href={adminUsersIndex.url()}
                            icon="users"
                            label="Kelola Akun"
                            meta={`${stats.users} akun`}
                        />
                    </CardContent>
                </Card>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="min-w-0">
                    <CardHeader>
                        <CardTitle>Outlet Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentOutlets.length > 0 ? (
                            <div className="grid gap-3">
                                {recentOutlets.map((outlet) => (
                                    <div
                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                                        key={outlet.id}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-slate-900">
                                                {outlet.name}
                                            </p>
                                            <p className="truncate text-sm text-slate-500">
                                                {outlet.location ?? '-'}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">
                                            {outlet.menuItemsCount ?? 0} menu
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="Belum ada outlet." />
                        )}
                    </CardContent>
                </Card>

                <Card className="min-w-0 border-blue-200 bg-blue-50/60">
                    <CardHeader>
                        <CardTitle>Prioritas Operasional</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm text-slate-600">
                        <PriorityItem
                            label="Lengkapi menu"
                            value={`${stats.menus} item terdaftar`}
                        />
                        <PriorityItem
                            label="Pantau stok rendah"
                            value={`${stats.lowStockItems} item perlu dicek`}
                        />
                        <PriorityItem
                            label="Siapkan akun kasir"
                            value={`${stats.cashiers} akun kasir aktif`}
                        />
                    </CardContent>
                </Card>
            </section>
        </AdminLayout>
    );
}

function InlineMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase text-slate-500">
                {label}
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

function StatCard({
    icon,
    label,
    tone,
    value,
}: {
    icon: string;
    label: string;
    tone: 'blue' | 'emerald' | 'slate' | 'amber';
    value: number;
}) {
    const toneClass = {
        amber: 'border-l-amber-500 bg-amber-50 text-amber-700',
        blue: 'border-l-blue-600 bg-blue-50 text-blue-700',
        emerald: 'border-l-emerald-500 bg-emerald-50 text-emerald-700',
        slate: 'border-l-slate-500 bg-slate-100 text-slate-700',
    }[tone];

    return (
        <Card className={`min-w-0 border-l-4 ${toneClass}`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600">
                        {label}
                    </p>
                    <Icon name={icon} />
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

function QuickLink({
    href,
    icon,
    label,
    meta,
}: {
    href: string;
    icon: string;
    label: string;
    meta: string;
}) {
    return (
        <Link
            className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-blue-200 hover:bg-slate-50"
            href={href}
        >
            <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary transition group-hover:bg-primary group-hover:text-white">
                    <Icon name={icon} />
                </span>
                <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900">
                        {label}
                    </span>
                    <span className="text-xs text-slate-500">{meta}</span>
                </span>
            </span>
            <span className="text-slate-400 transition group-hover:text-primary">
                {'>'}
            </span>
        </Link>
    );
}

function PriorityItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-white/75 px-4 py-3">
            <span className="font-medium text-slate-700">{label}</span>
            <span className="text-right text-xs font-semibold text-primary">
                {value}
            </span>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {message}
        </div>
    );
}

function Icon({ name }: { name: string }) {
    const paths: Record<string, ReactNode> = {
        menu: <path d="M4 6h16M4 12h16M4 18h10" />,
        outlet: (
            <>
                <path d="M4 10h16l-1-5H5z" />
                <path d="M6 10v10h12V10M9 20v-6h6v6" />
            </>
        ),
        stock: (
            <>
                <path d="M4 7l8-4 8 4-8 4z" />
                <path d="M4 7v10l8 4 8-4V7" />
                <path d="M12 11v10" />
            </>
        ),
        users: (
            <>
                <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                <path d="M2 20a7 7 0 0 1 14 0M17 8a3 3 0 0 1 0 6M22 20a5 5 0 0 0-5-5" />
            </>
        ),
        warning: (
            <>
                <path d="M12 3l9 16H3z" />
                <path d="M12 9v4M12 17h.01" />
            </>
        ),
    };

    return (
        <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            {paths[name] ?? paths.menu}
        </svg>
    );
}
