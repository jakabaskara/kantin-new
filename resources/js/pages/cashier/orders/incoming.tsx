import { Head, useForm, usePoll } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CashierLayout from '@/layouts/cashier-layout';
import {
    dismissTransactionToast,
    showFormError,
    showTransactionLoading,
} from '@/lib/toast';
import { update as updateOrderStatus } from '@/routes/cashier/orders/status';
import type { OutletSummary, TransactionSummary } from '@/types';

type CashierOrdersIncomingProps = {
    orders: TransactionSummary[];
    outlet: OutletSummary | null;
    stats: {
        received: number;
        preparing: number;
        ready: number;
    };
};

export default function CashierOrdersIncoming({
    orders,
    outlet,
    stats,
}: CashierOrdersIncomingProps) {
    usePoll(
        4000,
        { only: ['orders', 'stats'] },
        { keepAlive: true },
    );

    return (
        <CashierLayout
            description="Pantau pesanan aktif dan update statusnya."
            title="Pesanan Masuk"
        >
            <Head title="Pesanan Masuk" />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryCard label="Baru" tone="blue" value={stats.received} />
                <SummaryCard
                    label="Diproses"
                    tone="yellow"
                    value={stats.preparing}
                />
                <SummaryCard label="Siap" tone="green" value={stats.ready} />
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_20rem]">
                <Card className="min-w-0">
                    <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Antrian Pesanan</CardTitle>
                        <Badge variant="secondary">Auto refresh</Badge>
                    </CardHeader>
                    <CardContent>
                        {orders.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {orders.map((order) => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                                Belum ada pesanan masuk.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="min-w-0 xl:sticky xl:top-4 xl:self-start">
                    <CardHeader>
                        <CardTitle>Outlet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                            <p className="font-semibold">
                                {outlet?.name ?? 'Outlet belum terhubung'}
                            </p>
                            <p className="mt-1 text-blue-700/80">
                                {outlet?.location ??
                                    'Hubungkan akun kasir ke outlet agar pesanan muncul.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </CashierLayout>
    );
}

function SummaryCard({
    label,
    tone,
    value,
}: {
    label: string;
    tone: 'blue' | 'yellow' | 'green';
    value: number;
}) {
    const toneClass = {
        blue: 'border-l-blue-600 bg-blue-50 text-blue-700',
        green: 'border-l-emerald-500 bg-emerald-50 text-emerald-700',
        yellow: 'border-l-yellow-500 bg-yellow-50 text-yellow-700',
    }[tone];

    return (
        <Card className={`min-w-0 border-l-4 ${toneClass}`}>
            <CardContent className="p-4">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-2xl font-bold text-slate-900">
                        {value}
                    </p>
                    <Badge variant="secondary">Pesanan</Badge>
                </div>
            </CardContent>
        </Card>
    );
}

function OrderCard({ order }: { order: TransactionSummary }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">
                            Order #{order.id}
                        </h2>
                        <Badge variant="secondary">
                            {getStatusLabel(order.orderStatus)}
                        </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        {order.customerDisplayName ?? order.customerName} -{' '}
                        {formatDate(order.createdAt)}
                    </p>
                </div>
                <p className="text-lg font-bold text-primary">
                    {formatCurrency(order.totalAmount)}
                </p>
            </div>

            <div className="mt-4 grid gap-2">
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

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {getNextActions(order.orderStatus).map((action) => (
                    <StatusButton
                        key={action.status}
                        label={action.label}
                        status={action.status}
                        transactionId={order.id}
                        variant={action.variant}
                    />
                ))}
            </div>
        </div>
    );
}

function StatusButton({
    label,
    status,
    transactionId,
    variant,
}: {
    label: string;
    status: number;
    transactionId: number;
    variant: 'default' | 'outline' | 'destructive';
}) {
    const form = useForm({ status });
    const toastId = `cashier-order-status-${transactionId}-${status}`;

    function updateStatus() {
        showTransactionLoading(toastId, 'Memperbarui status pesanan...');

        form.patch(updateOrderStatus.url(transactionId), {
            onError: (errors) => {
                dismissTransactionToast(toastId);
                showFormError(errors, 'Status pesanan gagal diperbarui.');
            },
            onFinish: () => {
                dismissTransactionToast(toastId);
            },
            preserveScroll: true,
        });
    }

    return (
        <Button
            disabled={form.processing}
            onClick={updateStatus}
            type="button"
            variant={variant}
        >
            {form.processing ? 'Menyimpan...' : label}
        </Button>
    );
}

function getNextActions(status: number) {
    if (status === 1) {
        return [
            { label: 'Mulai masak', status: 2, variant: 'default' as const },
            { label: 'Batalkan', status: 5, variant: 'outline' as const },
        ];
    }

    if (status === 2) {
        return [
            { label: 'Siap diambil', status: 3, variant: 'default' as const },
            { label: 'Batalkan', status: 5, variant: 'outline' as const },
        ];
    }

    if (status === 3) {
        return [
            { label: 'Selesaikan', status: 4, variant: 'default' as const },
        ];
    }

    return [];
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
