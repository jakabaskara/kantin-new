import type { PropsWithChildren, ReactNode } from 'react';

import AppShell from '@/layouts/app-shell';
import type { NavigationItem } from '@/types';

const adminNavigation: NavigationItem[] = [
    { label: 'Dashboard', icon: 'dashboard', href: '/admin', match: '/admin' },
    {
        label: 'Kelola Menu',
        icon: 'menu',
        href: '/admin/menu',
        match: '/admin/menu',
    },
    {
        label: 'Kelola Outlet',
        icon: 'outlet',
        href: '/admin/outlets',
        match: '/admin/outlets',
    },
    {
        label: 'Kelola Stok',
        icon: 'stock',
        href: '/admin/stock',
        match: '/admin/stock',
    },
    {
        label: 'Transaksi',
        disabled: true,
        icon: 'transactions',
        href: '/admin/transactions',
        match: '/admin/transactions',
    },
    {
        label: 'Laporan',
        disabled: true,
        icon: 'reports',
        href: '/admin/reports',
        match: '/admin/reports',
    },
    {
        label: 'Kelola Akun',
        icon: 'users',
        href: '/admin/users',
        match: '/admin/users',
    },
    {
        label: 'Pengaturan',
        disabled: true,
        icon: 'settings',
        href: '/admin/settings',
        match: '/admin/settings',
    },
];

type AdminLayoutProps = PropsWithChildren<{
    title?: string;
    description?: string;
    headerAction?: ReactNode;
}>;

export default function AdminLayout({
    children,
    title = 'Dashboard',
    description,
    headerAction,
}: AdminLayoutProps) {
    return (
        <AppShell
            description={description}
            headerAction={headerAction}
            navigation={adminNavigation}
            sidebarLabel="Admin"
            title={title}
            variant="admin"
        >
            {children}
        </AppShell>
    );
}
