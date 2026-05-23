import type { PropsWithChildren, ReactNode } from 'react';

import AppShell from '@/layouts/app-shell';
import type { NavigationItem } from '@/types';

const cashierNavigation: NavigationItem[] = [
    {
        label: 'Pesanan Masuk',
        icon: 'orders',
        href: '/cashier',
        match: '/cashier',
    },
    {
        label: 'Riwayat Transaksi',
        disabled: true,
        icon: 'history',
        href: '/cashier/transactions',
        match: '/cashier/transactions',
    },
    {
        label: 'Pembayaran Tunai',
        icon: 'cash',
        href: '/cashier/cash-payment',
        match: '/cashier/cash-payment',
    },
];

type CashierLayoutProps = PropsWithChildren<{
    title?: string;
    description?: string;
    headerAction?: ReactNode;
}>;

export default function CashierLayout({
    children,
    title = 'Pesanan Masuk',
    description,
    headerAction,
}: CashierLayoutProps) {
    return (
        <AppShell
            description={description}
            headerAction={headerAction}
            navigation={cashierNavigation}
            sidebarLabel="Kasir"
            sidebarWidthClass="w-72"
            title={title}
            variant="cashier"
        >
            {children}
        </AppShell>
    );
}
