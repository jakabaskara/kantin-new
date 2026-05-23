import type { PropsWithChildren, ReactNode } from 'react';

import AppShell from '@/layouts/app-shell';
import type { NavigationItem } from '@/types';

const customerNavigation: NavigationItem[] = [
    { label: 'Menu', shortLabel: 'Menu', icon: 'menu', href: '/app', match: '/app' },
    {
        label: 'Pesanan',
        shortLabel: 'Pesanan',
        icon: 'orders',
        href: '/app/orders',
        match: '/app/orders',
    },
    {
        label: 'Profil',
        disabled: true,
        shortLabel: 'Profil',
        icon: 'profile',
        href: '/app/profile',
        match: '/app/profile',
    },
];

type CustomerLayoutProps = PropsWithChildren<{
    title?: string;
    description?: string;
    headerAction?: ReactNode;
}>;

export default function CustomerLayout({
    children,
    title = 'Menu',
    description,
    headerAction,
}: CustomerLayoutProps) {
    return (
        <AppShell
            description={description}
            headerAction={headerAction}
            mobileNavigation="bottom"
            navigation={customerNavigation}
            sidebarLabel="Customer"
            title={title}
            variant="customer"
        >
            {children}
        </AppShell>
    );
}
