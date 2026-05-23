import { Head, Link, usePoll } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CustomerLayout from '@/layouts/customer-layout';
import { index as customerMenuIndex } from '@/routes/customer/menu';
import type { TransactionSummary } from '@/types';

type CustomerOrdersIndexProps = {
    orders: TransactionSummary[];
    createdOrderId: number | null;
};

const orderSteps = [
    { label: 'Diterima', status: 1 },
    { label: 'Dimasak', status: 2 },
    { label: 'Siap', status: 3 },
    { label: 'Selesai', status: 4 },
];

export default function CustomerOrdersIndex({
    createdOrderId,
    orders,
}: CustomerOrdersIndexProps) {
    usePoll(
        5000,
        { only: ['orders'] },
        { keepAlive: true },
    );

    const highlightedOrder = createdOrderId
        ? orders.find((order) => order.id === createdOrderId)
        : null;

    return (
        <CustomerLayout
            description="Pantau perjalanan pesanan dari outlet ke tanganmu."
            title="Pesanan"
        >
            <Head title="Pesanan Saya" />

            {highlightedOrder ? (
                <section className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
                    <div className="relative bg-linear-to-r from-emerald-500 via-blue-600 to-blue-700 p-6 text-white">
                        <div className="absolute right-6 top-6 h-16 w-16 animate-ping rounded-full bg-white/20" />
                        <p className="text-sm font-semibold text-white/75">
                            Pesanan terkirim
                        </p>
                        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                            Order #{highlightedOrder.id} masuk ke kasir.
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-white/80">
                            Pantau statusnya di sini. Halaman ini refresh
                            otomatis setiap beberapa detik.
                        </p>
                    </div>
                </section>
            ) : null}

            {orders.length > 0 ? (
                <section className="grid grid-cols-1 gap-4">
                    {orders.map((order) => (
                        <OrderCard
                            highlighted={order.id === createdOrderId}
                            key={order.id}
                            order={order}
                        />
                    ))}
                </section>
            ) : (
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="font-semibold text-slate-900">
                            Belum ada pesanan.
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Pilih menu dulu, lalu pesananmu akan muncul di sini.
                        </p>
                        <Link
                            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
                            href={customerMenuIndex.url()}
                        >
                            Lihat Menu
                        </Link>
                    </CardContent>
                </Card>
            )}
        </CustomerLayout>
    );
}

function OrderCard({
    highlighted,
    order,
}: {
    highlighted: boolean;
    order: TransactionSummary;
}) {
    const cancelled = order.orderStatus === 5;

    return (
        <Card
            className={
                highlighted
                    ? 'min-w-0 border-emerald-300 shadow-md shadow-emerald-100'
                    : 'min-w-0'
            }
        >
            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Order #{order.id}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                        {order.outletName ?? 'Outlet'} -{' '}
                        {formatDate(order.createdAt)}
                    </p>
                </div>
                <Badge variant={cancelled ? 'destructive' : 'secondary'}>
                    {getStatusLabel(order.orderStatus)}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                    {orderSteps.map((step) => {
                        const active = order.orderStatus >= step.status;

                        return (
                            <div className="min-w-0 text-center" key={step.status}>
                                <div
                                    className={
                                        active && !cancelled
                                            ? 'mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-lg shadow-blue-200'
                                            : 'mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-400'
                                    }
                                >
                                    {step.status}
                                </div>
                                <p className="mt-2 truncate text-xs font-semibold text-slate-600">
                                    {step.label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {cancelled ? (
                    <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                        Pesanan dibatalkan. Stok sudah dikembalikan oleh sistem.
                    </div>
                ) : null}

                <div className="grid gap-2">
                    {(order.items ?? []).map((item) => (
                        <div
                            className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                            key={item.id}
                        >
                            <span className="min-w-0 truncate font-medium text-slate-700">
                                {item.menuName ?? 'Menu'} x {item.quantity}
                            </span>
                            <span className="font-semibold text-slate-900">
                                {formatCurrency(item.subtotal)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm font-medium text-slate-500">
                        Total
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function getStatusLabel(status: number) {
    return (
        {
            1: 'Diterima',
            2: 'Sedang dimasak',
            3: 'Siap diambil',
            4: 'Selesai',
            5: 'Dibatalkan',
        }[status] ?? 'Tidak diketahui'
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(value);
}

function formatDate(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
