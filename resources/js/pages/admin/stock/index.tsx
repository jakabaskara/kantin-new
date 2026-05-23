import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import AdminLayout from '@/layouts/admin-layout';
import { update as updateStock } from '@/routes/admin/menu/stock';
import { index as adminStockIndex } from '@/routes/admin/stock';
import type {
    CustomerMenuFilters,
    MenuItemSummary,
    OutletSummary,
} from '@/types';

type AdminStockIndexProps = {
    menus: PaginatedMenus;
    outlets: OutletSummary[];
    filters: CustomerMenuFilters;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedMenus = {
    data: MenuItemSummary[];
    from: number | null;
    links: PaginationLink[];
    to: number | null;
    total: number;
};

type StockForm = {
    quantity: string;
};

export default function AdminStockIndex({
    menus,
    outlets,
    filters,
}: AdminStockIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [outlet, setOutlet] = useState(
        filters.outlet ? String(filters.outlet) : '',
    );
    const [selectedMenu, setSelectedMenu] = useState<MenuItemSummary | null>(
        null,
    );
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const form = useForm<StockForm>({
        quantity: '0',
    });
    const stats = useMemo(() => {
        const emptyStock = menus.data.filter((menu) => menu.stockQuantity === 0)
            .length;
        const lowStock = menus.data.filter(
            (menu) => menu.stockQuantity > 0 && menu.stockQuantity <= 5,
        ).length;

        return { emptyStock, lowStock };
    }, [menus.data]);

    function filter(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const query: Record<string, string> = {};
        const trimmedSearch = search.trim();

        if (trimmedSearch !== '') {
            query.search = trimmedSearch;
        }

        if (outlet !== '') {
            query.outlet = outlet;
        }

        router.get(adminStockIndex.url(), query, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    function resetFilter() {
        setSearch('');
        setOutlet('');

        router.get(
            adminStockIndex.url(),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function openStockModal(menu: MenuItemSummary) {
        setSelectedMenu(menu);
        form.clearErrors();
        form.setData('quantity', String(menu.stockQuantity));
        setStockModalOpen(true);
    }

    function update(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedMenu) {
            return;
        }

        form.patch(updateStock.url(selectedMenu.id), {
            onSuccess: () => setStockModalOpen(false),
            preserveScroll: true,
        });
    }

    function visitPagination(url: string | null) {
        if (!url) {
            return;
        }

        router.get(url, {}, { preserveScroll: true, preserveState: true });
    }

    return (
        <AdminLayout
            description="Pantau dan ubah stok menu berdasarkan outlet."
            title="Kelola Stok"
        >
            <Head title="Kelola Stok" />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard
                    label="Total item menu"
                    value={menus.total}
                />
                <MetricCard
                    label="Stok rendah halaman ini"
                    value={stats.lowStock}
                />
                <MetricCard
                    label="Stok kosong halaman ini"
                    value={stats.emptyStock}
                />
            </section>

            <section className="space-y-4">
                <Card className="min-w-0">
                    <CardHeader>
                        <CardTitle>Filter Stok</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end"
                            onSubmit={filter}
                        >
                            <div className="space-y-2">
                                <Label htmlFor="search">Cari menu</Label>
                                <Input
                                    id="search"
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Nama atau deskripsi"
                                    value={search}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="outlet">Outlet</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    id="outlet"
                                    onChange={(event) =>
                                        setOutlet(event.target.value)
                                    }
                                    value={outlet}
                                >
                                    <option value="">Semua outlet</option>
                                    {outlets.map((outletItem) => (
                                        <option
                                            key={outletItem.id}
                                            value={outletItem.id}
                                        >
                                            {outletItem.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2 md:flex">
                                <Button type="submit">Terapkan</Button>
                                <Button
                                    onClick={resetFilter}
                                    type="button"
                                    variant="outline"
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="min-w-0">
                    <CardHeader>
                        <CardTitle>Daftar Stok</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {menus.data.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                                {menus.data.map((menu) => (
                                    <button
                                        className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50"
                                        key={menu.id}
                                        onClick={() => openStockModal(menu)}
                                        type="button"
                                    >
                                        <div className="flex items-start gap-3">
                                            {menu.imageUrl ? (
                                                <img
                                                    alt={menu.name}
                                                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                                                    src={menu.imageUrl}
                                                />
                                            ) : (
                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-primary">
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
                                                <div className="mt-3 flex items-center justify-between gap-3">
                                                    <span className="text-sm text-slate-500">
                                                        Sisa stok
                                                    </span>
                                                    <StockBadge
                                                        quantity={
                                                            menu.stockQuantity
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="Belum ada stok yang ditampilkan." />
                        )}

                        <Pagination
                            from={menus.from}
                            links={menus.links}
                            onVisit={visitPagination}
                            to={menus.to}
                            total={menus.total}
                        />
                    </CardContent>
                </Card>
            </section>

            <Modal
                isOpen={stockModalOpen}
                onClose={() => setStockModalOpen(false)}
                title="Update Stok"
            >
                {selectedMenu ? (
                    <form className="space-y-4" onSubmit={update}>
                        <div className="rounded-lg bg-blue-50 p-4">
                            <p className="font-semibold text-slate-900">
                                {selectedMenu.name}
                            </p>
                            <p className="text-sm text-slate-600">
                                {selectedMenu.outletName ?? '-'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quantity">Jumlah stok</Label>
                            <Input
                                id="quantity"
                                min="0"
                                onChange={(event) =>
                                    form.setData(
                                        'quantity',
                                        event.target.value,
                                    )
                                }
                                type="number"
                                value={form.data.quantity}
                            />
                            {form.errors.quantity ? (
                                <p className="text-sm font-medium text-destructive">
                                    {form.errors.quantity}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                            <Button disabled={form.processing} type="submit">
                                Simpan Stok
                            </Button>
                        </div>
                    </form>
                ) : null}
            </Modal>
        </AdminLayout>
    );
}

function MetricCard({ label, value }: { label: string; value: number }) {
    return (
        <Card className="min-w-0 border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

function StockBadge({ quantity }: { quantity: number }) {
    if (quantity === 0) {
        return (
            <Badge variant="warning">
                Kosong
            </Badge>
        );
    }

    if (quantity <= 5) {
        return (
            <Badge className="bg-orange-50 text-orange-800" variant="secondary">
                {quantity}
            </Badge>
        );
    }

    return (
        <Badge variant="success">
            {quantity}
        </Badge>
    );
}

function Pagination({
    from,
    links,
    onVisit,
    to,
    total,
}: {
    from: number | null;
    links: PaginationLink[];
    onVisit: (url: string | null) => void;
    to: number | null;
    total: number;
}) {
    return (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
                Menampilkan {from ?? 0}-{to ?? 0} dari {total} item stok
            </p>
            <div className="flex flex-wrap gap-2">
                {links.map((link, index) => (
                    <Button
                        disabled={!link.url || link.active}
                        key={`${link.label}-${index}`}
                        onClick={() => onVisit(link.url)}
                        size="sm"
                        type="button"
                        variant={link.active ? 'default' : 'outline'}
                    >
                        {cleanPaginationLabel(link.label)}
                    </Button>
                ))}
            </div>
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

function cleanPaginationLabel(label: string) {
    return label.replace('&laquo;', '‹').replace('&raquo;', '›');
}
