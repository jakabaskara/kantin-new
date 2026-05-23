import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import CustomerLayout from '@/layouts/customer-layout';
import { index as customerMenuIndex } from '@/routes/customer/menu';
import { store as customerOrderStore } from '@/routes/customer/orders';
import type {
    CustomerMenuFilters,
    CustomerMenuItem,
    OutletSummary,
} from '@/types';

type CustomerMenuIndexProps = {
    menus: CustomerMenuItem[];
    outlets: OutletSummary[];
    filters: CustomerMenuFilters;
};

type CartItem = {
    menu: CustomerMenuItem;
    quantity: number;
};

type OrderForm = {
    items: {
        menuItemId: number;
        quantity: number;
    }[];
};

export default function CustomerMenuIndex({
    menus,
    outlets,
    filters,
}: CustomerMenuIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [outlet, setOutlet] = useState(
        filters.outlet ? String(filters.outlet) : '',
    );
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartModalOpen, setCartModalOpen] = useState(false);
    const form = useForm<OrderForm>({ items: [] });
    const cartItemCount = useMemo(
        () => cart.reduce((count, item) => count + item.quantity, 0),
        [cart],
    );
    const activeOutletName = useMemo(
        () =>
            outlets.find((outletItem) => String(outletItem.id) === outlet)
                ?.name ?? null,
        [outlet, outlets],
    );
    const cartOutletId = cart[0]?.menu.outletId ?? null;
    const cartOutletName = cart[0]?.menu.outletName ?? null;
    const total = useMemo(
        () =>
            cart.reduce(
                (currentTotal, item) =>
                    currentTotal + item.menu.price * item.quantity,
                0,
            ),
        [cart],
    );

    function submitFilter(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const query: Record<string, string> = {};
        const trimmedSearch = search.trim();

        if (trimmedSearch !== '') {
            query.search = trimmedSearch;
        }

        if (outlet !== '') {
            query.outlet = outlet;
        }

        router.get(customerMenuIndex.url(), query, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    function resetFilters() {
        setSearch('');
        setOutlet('');

        router.get(
            customerMenuIndex.url(),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function addMenu(menu: CustomerMenuItem) {
        if (menu.stockQuantity <= 0) {
            return;
        }

        setCart((items) => {
            if (items.length > 0 && items[0].menu.outletId !== menu.outletId) {
                return [{ menu, quantity: 1 }];
            }

            const existingItem = items.find(
                (item) => item.menu.id === menu.id,
            );

            if (!existingItem) {
                return [...items, { menu, quantity: 1 }];
            }

            return items.map((item) =>
                item.menu.id === menu.id
                    ? {
                        ...item,
                        quantity: Math.min(
                            item.quantity + 1,
                            item.menu.stockQuantity,
                        ),
                    }
                    : item,
            );
        });
    }

    function updateQuantity(menuId: number, quantity: number) {
        setCart((items) =>
            items
                .map((item) =>
                    item.menu.id === menuId
                        ? {
                            ...item,
                            quantity: Math.max(
                                0,
                                Math.min(quantity, item.menu.stockQuantity),
                            ),
                        }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    }

    function submitOrder(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.transform(() => ({
            items: cart.map((item) => ({
                menuItemId: item.menu.id,
                quantity: item.quantity,
            })),
        }));

        form.post(customerOrderStore.url(), {
            onSuccess: () => {
                setCart([]);
                setCartModalOpen(false);
                form.reset();
            },
            preserveScroll: true,
        });
    }

    return (
        <CustomerLayout
            description="Pilih menu kantin dan pantau pesananmu."
            title="Menu"
        >
            <Head title="Menu" />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryCard label="Menu tersedia" value={menus.length} />
                <SummaryCard label="Outlet" value={outlets.length} />
                <SummaryCard
                    label="Filter outlet"
                    value={activeOutletName ?? 'Semua'}
                />
            </section>

            <section className="space-y-4 max-lg:pb-12">
                <div className="min-w-0 space-y-4">
                    <Card className="min-w-0">
                        <CardHeader>
                            <CardTitle>Filter Menu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-end"
                                onSubmit={submitFilter}
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="search">Cari menu</Label>
                                    <Input
                                        id="search"
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Nama atau deskripsi menu"
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

                                <div className="grid grid-cols-2 gap-2 sm:flex">
                                    <Button
                                        className="w-full sm:w-auto"
                                        type="submit"
                                    >
                                        Terapkan
                                    </Button>
                                    <Button
                                        className="w-full sm:w-auto"
                                        onClick={resetFilters}
                                        type="button"
                                        variant="outline"
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {menus.length > 0 ? (
                        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                            {menus.map((menu) => (
                                <MenuCard
                                    cartOutletId={cartOutletId}
                                    key={menu.id}
                                    menu={menu}
                                    onAdd={addMenu}
                                />
                            ))}
                        </section>
                    ) : (
                        <Card className="min-w-0">
                            <CardContent className="p-6">
                                <EmptyState message="Belum ada menu yang ditampilkan. Coba ubah kata kunci atau filter outlet." />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>

            <button
                aria-label={
                    cartItemCount > 0
                        ? `Keranjang, ${cartItemCount} item`
                        : 'Keranjang'
                }
                className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:bottom-8 lg:right-8 lg:h-16 lg:w-16"
                onClick={() => setCartModalOpen(true)}
                type="button"
            >
                <CartIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                {cartItemCount > 0 ? (
                    <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                ) : null}
            </button>

            <Modal
                description="Periksa item dan konfirmasi pesanan sebelum checkout."
                isOpen={cartModalOpen}
                onClose={() => setCartModalOpen(false)}
                title="Keranjang"
                widthClass="max-w-lg"
            >
                <form className="space-y-4" onSubmit={submitOrder}>
                    {cart.length > 0 ? (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
                                {cartOutletName ?? 'Outlet'}
                            </div>
                            {cart.map((item) => (
                                <CartLine
                                    item={item}
                                    key={item.menu.id}
                                    onQuantityChange={updateQuantity}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="Pilih menu untuk mulai order." />
                    )}
                    {form.errors.items ? (
                        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {form.errors.items}
                        </p>
                    ) : null}

                    <div className="rounded-xl bg-slate-900 p-4 text-white">
                        <p className="text-sm text-white/70">Total</p>
                        <p className="mt-1 text-2xl font-bold">
                            {formatCurrency(total)}
                        </p>
                    </div>

                    <Button
                        className="h-12 w-full text-base"
                        disabled={cart.length === 0 || form.processing}
                        type="submit"
                    >
                        {form.processing
                            ? 'Mengirim pesanan...'
                            : 'Buat Pesanan'}
                    </Button>
                </form>
            </Modal>
        </CustomerLayout>
    );
}

function SummaryCard({
    label,
    value,
}: {
    label: string;
    value: number | string;
}) {
    return (
        <Card className="min-w-0">
            <CardContent className="p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 truncate text-2xl font-bold text-slate-900">
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

function MenuCard({
    cartOutletId,
    menu,
    onAdd,
}: {
    cartOutletId: number | null;
    menu: CustomerMenuItem;
    onAdd: (menu: CustomerMenuItem) => void;
}) {
    const hasStock = menu.stockQuantity > 0;
    const differentOutlet = cartOutletId !== null && cartOutletId !== menu.outletId;

    return (
        <Card className="min-w-0 overflow-hidden">
            {menu.imageUrl ? (
                <img
                    alt={menu.name}
                    className="aspect-[4/3] w-full object-cover"
                    src={menu.imageUrl}
                />
            ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-linear-to-br from-blue-50 to-slate-100 text-3xl font-bold text-primary">
                    {menu.name.slice(0, 2).toUpperCase()}
                </div>
            )}

            <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-900">
                            {menu.name}
                        </h2>
                        <p className="mt-1 truncate text-sm text-slate-500">
                            {menu.outletName ?? 'Outlet'}
                        </p>
                    </div>
                    <Badge variant={hasStock ? 'success' : 'destructive'}>
                        {hasStock ? 'Tersedia' : 'Habis'}
                    </Badge>
                </div>

                <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                    {menu.description ?? 'Tidak ada deskripsi menu.'}
                </p>

                <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="min-w-0">
                        <p className="text-xs text-slate-500">Harga</p>
                        <p className="truncate text-lg font-bold text-slate-900">
                            {formatCurrency(menu.price)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">Stok</p>
                        <p className="text-sm font-semibold text-slate-700">
                            {menu.stockQuantity}
                        </p>
                    </div>
                </div>

                <Button
                    className="w-full"
                    disabled={!hasStock}
                    onClick={() => onAdd(menu)}
                    type="button"
                    variant={differentOutlet ? 'outline' : 'default'}
                >
                    {differentOutlet ? 'Ganti outlet' : 'Tambah'}
                </Button>
            </CardContent>
        </Card>
    );
}

function CartLine({
    item,
    onQuantityChange,
}: {
    item: CartItem;
    onQuantityChange: (menuId: number, quantity: number) => void;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                        {item.menu.name}
                    </p>
                    <p className="text-sm text-slate-500">
                        {formatCurrency(item.menu.price)}
                    </p>
                </div>
                <Input
                    className="h-9 w-20"
                    max={item.menu.stockQuantity}
                    min="0"
                    onChange={(event) =>
                        onQuantityChange(
                            item.menu.id,
                            Number(event.target.value),
                        )
                    }
                    type="number"
                    value={item.quantity}
                />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-bold text-slate-900">
                    {formatCurrency(item.menu.price * item.quantity)}
                </span>
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            {message}
        </div>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(value);
}

function CartIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    );
}
