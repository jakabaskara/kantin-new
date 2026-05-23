import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CashierLayout from '@/layouts/cashier-layout';
import {
    dismissTransactionToast,
    showFormError,
    showTransactionLoading,
} from '@/lib/toast';
import {
    index as indexCashPayment,
    store as storeCashPayment,
} from '@/routes/cashier/cash-payment';
import type {
    MenuItemSummary,
    OutletSummary,
    TransactionSummary,
} from '@/types';

type CashPaymentProps = {
    menus: MenuItemSummary[];
    outlet: OutletSummary | null;
    canSubmitCashTransaction: boolean;
    receipt: TransactionSummary | null;
    recentTransactions: TransactionSummary[];
};

type CartItem = {
    menu: MenuItemSummary;
    quantity: number;
};

type CashTransactionForm = {
    cashReceivedAmount: string | number;
    items: {
        menuItemId: number;
        quantity: number;
    }[];
};

export default function CashPayment({
    canSubmitCashTransaction,
    menus,
    outlet,
    receipt,
    recentTransactions,
}: CashPaymentProps) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const form = useForm<CashTransactionForm>({
        cashReceivedAmount: '',
        items: [],
    });
    const filteredMenus = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (keyword === '') {
            return menus;
        }

        return menus.filter((menu) =>
            [menu.name, menu.description ?? '', menu.outletName ?? '']
                .join(' ')
                .toLowerCase()
                .includes(keyword),
        );
    }, [menus, search]);
    const total = useMemo(
        () =>
            cart.reduce(
                (currentTotal, item) =>
                    currentTotal + item.menu.price * item.quantity,
                0,
            ),
        [cart],
    );
    const cashReceivedAmount = parseCurrencyInput(
        String(form.data.cashReceivedAmount),
    );
    const changeAmount = Math.max(cashReceivedAmount - total, 0);
    const missingAmount = Math.max(total - cashReceivedAmount, 0);
    const quickAmounts = useMemo(() => buildQuickAmounts(total), [total]);

    function addMenu(menu: MenuItemSummary) {
        if (menu.stockQuantity <= 0) {
            return;
        }

        setCart((items) => {
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

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            cashReceivedAmount,
            items: cart.map((item) => ({
                menuItemId: item.menu.id,
                quantity: item.quantity,
            })),
        }));

        const toastId = 'cashier-cash-payment';

        showTransactionLoading(toastId, 'Menyimpan transaksi tunai...');

        form.post(storeCashPayment.url(), {
            onError: (errors) => {
                dismissTransactionToast(toastId);
                showFormError(errors, 'Transaksi tunai gagal disimpan.');
            },
            onFinish: () => {
                dismissTransactionToast(toastId);
            },
            onSuccess: () => {
                setCart([]);
                form.reset();
            },
            preserveScroll: true,
        });
    }

    const submitDisabled =
        !canSubmitCashTransaction ||
        cart.length === 0 ||
        form.processing ||
        total <= 0 ||
        missingAmount > 0;

    return (
        <CashierLayout
            description="Input transaksi tunai manual untuk outlet kasir."
            title="Pembayaran Tunai"
        >
            <Head title="Pembayaran Tunai">
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        .receipt-print-root, .receipt-print-root * { visibility: visible; }
                        .receipt-print-root { position: absolute; inset: 0; width: 100%; }
                    }
                `}</style>
            </Head>

            <div className="space-y-4 print:hidden">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-linear-to-r bg-primary p-5 text-white sm:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-sm font-semibold text-white/75">
                                    Kasir Tunai
                                </p>
                                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                                    {outlet?.name ?? 'Outlet belum terhubung'}
                                </h2>
                                <p className="mt-2 text-sm text-white/80">
                                    {outlet?.location ??
                                        'Hubungkan akun kasir ke outlet sebelum transaksi disimpan.'}
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/15 p-2 text-center backdrop-blur">
                                <InlineMetric label="Item" value={cart.length} />
                                <InlineMetric
                                    label="Total"
                                    value={formatCompactCurrency(total)}
                                />
                                <InlineMetric
                                    label="Kembali"
                                    value={formatCompactCurrency(changeAmount)}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_27rem]">
                    <div className="min-w-0 space-y-4">
                        <Card className="min-w-0">
                            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle>Pilih Menu</CardTitle>
                                <Input
                                    className="h-10 sm:max-w-xs"
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Cari menu..."
                                    value={search}
                                />
                            </CardHeader>
                            <CardContent>
                                {filteredMenus.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                                        {filteredMenus.map((menu) => (
                                            <button
                                                className="group min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                                disabled={
                                                    menu.stockQuantity <= 0
                                                }
                                                key={menu.id}
                                                onClick={() => addMenu(menu)}
                                                type="button"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {menu.imageUrl ? (
                                                        <img
                                                            alt={menu.name}
                                                            className="h-16 w-16 shrink-0 rounded-lg object-cover"
                                                            src={menu.imageUrl}
                                                        />
                                                    ) : (
                                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-primary">
                                                            {menu.name
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-semibold text-slate-900">
                                                            {menu.name}
                                                        </p>
                                                        <p className="mt-1 text-sm font-semibold text-primary">
                                                            {formatCurrency(
                                                                menu.price,
                                                            )}
                                                        </p>
                                                        <div className="mt-3 flex items-center justify-between gap-2">
                                                            <Badge
                                                                variant={
                                                                    menu.stockQuantity >
                                                                        0
                                                                        ? 'success'
                                                                        : 'warning'
                                                                }
                                                            >
                                                                Stok{' '}
                                                                {
                                                                    menu.stockQuantity
                                                                }
                                                            </Badge>
                                                            <span className="text-xs font-semibold text-slate-400 group-hover:text-primary">
                                                                Tambah
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState message="Menu tidak ditemukan." />
                                )}
                            </CardContent>
                        </Card>

                        {receipt ? (
                            <ReceiptPanel
                                receipt={receipt}
                                onPrint={() => window.print()}
                            />
                        ) : null}

                        <RecentTransactions transactions={recentTransactions} />
                    </div>

                    <Card className="min-w-0 xl:sticky xl:top-4 xl:self-start">
                        <CardHeader>
                            <CardTitle>Keranjang & Pembayaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={submit}>
                                {cart.length > 0 ? (
                                    <div className="space-y-3">
                                        {cart.map((item) => (
                                            <CartLine
                                                item={item}
                                                key={item.menu.id}
                                                onQuantityChange={
                                                    updateQuantity
                                                }
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState message="Pilih menu untuk mulai transaksi." />
                                )}
                                <FieldError message={form.errors.items} />

                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <PaymentRow
                                        label="Total"
                                        value={formatCurrency(total)}
                                    />
                                    <div className="space-y-2">
                                        <Label htmlFor="cashReceivedAmount">
                                            Nominal bayar
                                        </Label>
                                        <Input
                                            id="cashReceivedAmount"
                                            inputMode="numeric"
                                            onChange={(event) =>
                                                form.setData(
                                                    'cashReceivedAmount',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Masukkan nominal"
                                            value={form.data.cashReceivedAmount}
                                        />
                                        <FieldError
                                            message={
                                                form.errors.cashReceivedAmount
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                                        {quickAmounts.map((amount) => (
                                            <Button
                                                key={amount}
                                                onClick={() =>
                                                    form.setData(
                                                        'cashReceivedAmount',
                                                        String(amount),
                                                    )
                                                }
                                                type="button"
                                                variant="outline"
                                            >
                                                {formatCompactCurrency(amount)}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="rounded-xl bg-slate-900 p-4 text-white">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm text-white/70">
                                                Kembalian
                                            </span>
                                            <span className="text-2xl font-bold">
                                                {formatCurrency(changeAmount)}
                                            </span>
                                        </div>
                                        {missingAmount > 0 ? (
                                            <p className="mt-2 text-sm text-orange-200">
                                                Kurang{' '}
                                                {formatCurrency(missingAmount)}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                <Button
                                    className="h-12 w-full text-base"
                                    disabled={submitDisabled}
                                    type="submit"
                                >
                                    {form.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan & Siapkan Struk'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </section>
            </div>

            {receipt ? (
                <div className="receipt-print-root hidden print:block">
                    <ReceiptPaper receipt={receipt} />
                </div>
            ) : null}
        </CashierLayout>
    );
}

function InlineMetric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="min-w-0 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-white/65">{label}</p>
            <p className="truncate text-sm font-bold text-white">{value}</p>
        </div>
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
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        onClick={() =>
                            onQuantityChange(item.menu.id, item.quantity - 1)
                        }
                        size="icon"
                        type="button"
                        variant="outline"
                    >
                        -
                    </Button>
                    <Input
                        className="h-9 w-16 text-center"
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
                    <Button
                        onClick={() =>
                            onQuantityChange(item.menu.id, item.quantity + 1)
                        }
                        size="icon"
                        type="button"
                        variant="outline"
                    >
                        +
                    </Button>
                </div>
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

function PaymentRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500">{label}</span>
            <span className="text-lg font-bold text-slate-900">{value}</span>
        </div>
    );
}

function ReceiptPanel({
    onPrint,
    receipt,
}: {
    onPrint: () => void;
    receipt: TransactionSummary;
}) {
    return (
        <Card className="min-w-0 border-emerald-200 bg-emerald-50/50">
            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Struk Siap Dicetak</CardTitle>
                <Button onClick={onPrint} type="button">
                    Cetak Struk
                </Button>
            </CardHeader>
            <CardContent>
                <ReceiptPaper receipt={receipt} />
            </CardContent>
        </Card>
    );
}

function ReceiptPaper({ receipt }: { receipt: TransactionSummary }) {
    return (
        <div className="mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-5 font-mono text-sm text-slate-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <div className="text-center">
                <p className="text-base font-bold">Kantin Paramadina</p>
                <p>{receipt.outletName ?? 'Outlet'}</p>
                <p>{formatReceiptDate(receipt.createdAt)}</p>
                <p>No. #{receipt.id}</p>
            </div>
            <div className="my-4 border-t border-dashed border-slate-300" />
            <div className="space-y-2">
                {(receipt.items ?? []).map((item) => (
                    <div key={item.id}>
                        <div className="flex justify-between gap-3">
                            <span>{item.menuName ?? 'Menu'}</span>
                            <span>{formatCurrency(item.subtotal)}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                    </div>
                ))}
            </div>
            <div className="my-4 border-t border-dashed border-slate-300" />
            <ReceiptTotalRow
                label="Total"
                value={formatCurrency(receipt.totalAmount)}
            />
            <ReceiptTotalRow
                label="Tunai"
                value={formatCurrency(receipt.cashReceivedAmount ?? 0)}
            />
            <ReceiptTotalRow
                label="Kembali"
                value={formatCurrency(receipt.changeAmount ?? 0)}
            />
            <div className="mt-5 text-center text-xs text-slate-500">
                Terima kasih
            </div>
        </div>
    );
}

function ReceiptTotalRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-3 font-bold">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

function RecentTransactions({
    transactions,
}: {
    transactions: TransactionSummary[];
}) {
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>Transaksi Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
                {transactions.length > 0 ? (
                    <div className="grid gap-2">
                        {transactions.map((transaction) => (
                            <Link
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-blue-200 hover:bg-slate-50"
                                href={indexCashPayment.url({
                                    query: { receipt: transaction.id },
                                })}
                                key={transaction.id}
                                preserveScroll
                            >
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold text-slate-900">
                                        #{transaction.id} -{' '}
                                        {transaction.customerName}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {formatReceiptDate(
                                            transaction.createdAt,
                                        )}
                                    </span>
                                </span>
                                <span className="shrink-0 font-bold text-primary">
                                    {formatCurrency(transaction.totalAmount)}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <EmptyState message="Belum ada transaksi tunai." />
                )}
            </CardContent>
        </Card>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-sm text-destructive">{message}</p>;
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {message}
        </div>
    );
}

function buildQuickAmounts(total: number) {
    if (total <= 0) {
        return [10000, 20000, 50000, 100000];
    }

    const rounded = Math.ceil(total / 5000) * 5000;

    return Array.from(
        new Set([total, rounded, rounded + 5000, rounded + 10000]),
    ).slice(0, 4);
}

function parseCurrencyInput(value: string) {
    const normalized = value.replace(/[^\d]/g, '');

    return normalized === '' ? 0 : Number(normalized);
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(value);
}

function formatCompactCurrency(value: number) {
    if (value >= 1000000) {
        return `${Math.round(value / 1000000)}jt`;
    }

    if (value >= 1000) {
        return `${Math.round(value / 1000)}rb`;
    }

    return String(value);
}

function formatReceiptDate(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
