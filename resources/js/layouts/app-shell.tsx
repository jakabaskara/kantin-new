import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Auth, NavigationItem } from '@/types';

type AppShellProps = PropsWithChildren<{
    title: string;
    description?: string;
    navigation: NavigationItem[];
    sidebarLabel: string;
    sidebarWidthClass?: string;
    headerAction?: ReactNode;
    variant?: 'admin' | 'customer' | 'cashier';
    mobileNavigation?: 'drawer' | 'bottom';
}>;

export default function AppShell({
    children,
    title,
    description,
    navigation,
    sidebarLabel,
    sidebarWidthClass = 'w-64',
    headerAction,
    variant = 'admin',
    mobileNavigation = 'drawer',
}: AppShellProps) {
    const { props, url } = usePage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isCashier = variant === 'cashier';
    const authUser = props.auth?.user ?? null;

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [url]);

    return (
        <div
            className={cn(
                'min-h-dvh w-full bg-slate-50 text-slate-900',
                isCashier &&
                    'bg-linear-to-br from-slate-50 via-blue-50 to-slate-100',
            )}
        >
            {mobileMenuOpen ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        aria-label="Tutup navigasi"
                        className="absolute inset-0 bg-slate-950/45"
                        onClick={() => setMobileMenuOpen(false)}
                        type="button"
                    />
                    <div className="relative flex h-full w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-slate-200 bg-white shadow-2xl">
                        <ShellBrand label={sidebarLabel} />
                        <nav className="flex-1 overflow-y-auto p-3">
                            <NavigationList navigation={navigation} url={url} />
                        </nav>
                        <UserPanel user={authUser} />
                    </div>
                </div>
            ) : null}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white lg:flex lg:flex-col',
                    sidebarWidthClass,
                )}
            >
                <ShellBrand label={sidebarLabel} />

                <nav className="flex-1 overflow-y-auto p-3">
                    <NavigationList navigation={navigation} url={url} />
                </nav>

                <UserPanel user={authUser} />
            </aside>

            <div
                className={cn(
                    'min-h-dvh w-full min-w-0 lg:pl-64',
                    sidebarWidthClass === 'w-72' && 'lg:pl-72',
                )}
            >
                <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
                    <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                aria-label="Buka navigasi"
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                                onClick={() => setMobileMenuOpen(true)}
                                type="button"
                            >
                                <MenuIcon />
                            </button>
                            <div className="min-w-0">
                                <p className="text-xs font-medium uppercase text-slate-500 lg:hidden">
                                    {sidebarLabel}
                                </p>
                                <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                                    {title}
                                </h1>
                                {description ? (
                                    <p className="hidden truncate text-sm text-slate-500 sm:block">
                                        {description}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {headerAction}
                            <div className="hidden sm:block lg:hidden">
                                <Badge variant="secondary">
                                    {getUserRole(authUser) ?? sidebarLabel}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    {description ? (
                        <div className="border-t border-slate-100 px-4 py-2 sm:hidden">
                            <p className="line-clamp-2 text-sm text-slate-500">
                                {description}
                            </p>
                        </div>
                    ) : null}
                </header>

                <main
                    className={cn(
                        'min-w-0 px-4 py-4 sm:px-6 lg:px-8 lg:py-8',
                        isCashier && 'lg:py-6',
                        mobileNavigation === 'bottom' && 'pb-24 lg:pb-8',
                    )}
                >
                    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-5">
                        {children}
                    </div>
                </main>
            </div>

            {mobileNavigation === 'bottom' ? (
                <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgb(15_23_42/0.08)] backdrop-blur lg:hidden">
                    {navigation.slice(0, 3).map((item) => {
                        const active = isActiveNavigationItem(item, url);

                        return item.disabled ? (
                            <span
                                className="flex min-w-0 flex-col items-center gap-1 rounded-md px-2 py-2 text-center text-xs font-medium text-slate-400"
                                key={item.href}
                            >
                                <NavigationIcon name={item.icon} />
                                {item.shortLabel ?? item.label}
                            </span>
                        ) : (
                            <Link
                                className={cn(
                                    'flex min-w-0 flex-col items-center gap-1 rounded-md px-2 py-2 text-center text-xs font-semibold transition-colors',
                                    active
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-slate-500 hover:bg-slate-100',
                                )}
                                href={item.href}
                                key={item.href}
                            >
                                <NavigationIcon name={item.icon} />
                                <span className="block truncate">
                                    {item.shortLabel ?? item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            ) : null}
        </div>
    );
}

function ShellBrand({ label }: { label: string }) {
    return (
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white shadow-sm">
                KP
            </div>
            <div className="ml-3 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                    Kantin Paramadina
                </p>
                <p className="truncate text-xs text-slate-500">{label}</p>
            </div>
        </div>
    );
}

function NavigationList({
    navigation,
    url,
}: {
    navigation: NavigationItem[];
    url: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            {navigation.map((item) => {
                const active = isActiveNavigationItem(item, url);

                return item.disabled ? (
                    <span
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400"
                        key={item.href}
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                            <NavigationIcon name={item.icon} />
                        </span>
                        {item.label}
                    </span>
                ) : (
                    <Link
                        className={cn(
                            'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                            active
                                ? 'bg-primary text-white shadow-lg shadow-blue-200/70'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
                        )}
                        href={item.href}
                        key={item.href}
                    >
                        <span
                            className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
                                active
                                    ? 'bg-white/15 text-white'
                                    : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-primary',
                            )}
                        >
                            <NavigationIcon name={item.icon} />
                        </span>
                        <span className="block truncate">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}

function UserPanel({ user }: { user: Auth['user'] }) {
    return (
        <div className="border-t border-slate-200 p-3">
            <div className="mb-3 min-w-0 rounded-lg bg-slate-50 p-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                    {getUserDisplayName(user)}
                </p>
                <p className="truncate text-xs text-slate-500">
                    {getUserRole(user) ?? 'Pengguna'}
                </p>
            </div>
            <Link
                as="button"
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                href="/logout"
                method="post"
                type="button"
            >
                Keluar
            </Link>
        </div>
    );
}

function isActiveNavigationItem(item: NavigationItem, url: string) {
    const currentPath = url.split('?')[0];

    if (!item.match) {
        return currentPath === item.href;
    }

    if (item.match === item.href) {
        return currentPath === item.match;
    }

    return currentPath.startsWith(item.match);
}

function getUserDisplayName(user: Auth['user']) {
    if (!user) {
        return 'Pengguna';
    }

    if ('fullName' in user && user.fullName) {
        return user.fullName;
    }

    if ('username' in user && user.username) {
        return user.username;
    }

    if ('name' in user && user.name) {
        return user.name;
    }

    return 'Pengguna';
}

function getUserRole(user: Auth['user']) {
    if (!user) {
        return null;
    }

    if ('role' in user && user.role) {
        return user.role;
    }

    return null;
}

function MenuIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
    );
}

function NavigationIcon({ name }: { name?: string }) {
    const commonProps = {
        'aria-hidden': true,
        className: 'h-4 w-4',
        fill: 'none',
        stroke: 'currentColor',
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        strokeWidth: 2,
        viewBox: '0 0 24 24',
    };

    const paths: Record<string, ReactNode> = {
        cash: (
            <>
                <path d="M4 7h16v10H4z" />
                <path d="M8 12h.01M16 12h.01M12 9.5a2.5 2.5 0 0 1 0 5" />
            </>
        ),
        dashboard: (
            <>
                <path d="M4 13h6V4H4zM14 20h6V4h-6zM4 20h6v-3H4z" />
            </>
        ),
        history: (
            <>
                <path d="M4 12a8 8 0 1 0 2.35-5.65L4 8.7" />
                <path d="M4 4v4h4M12 8v5l3 2" />
            </>
        ),
        menu: (
            <>
                <path d="M4 6h16M4 12h16M4 18h10" />
            </>
        ),
        orders: (
            <>
                <path d="M7 4h10l1 17H6z" />
                <path d="M9 8a3 3 0 0 0 6 0" />
            </>
        ),
        outlet: (
            <>
                <path d="M4 10h16l-1-5H5z" />
                <path d="M6 10v10h12V10M9 20v-6h6v6" />
            </>
        ),
        profile: (
            <>
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
                <path d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),
        reports: (
            <>
                <path d="M5 20V4h14v16z" />
                <path d="M8 16v-4M12 16V8M16 16v-6" />
            </>
        ),
        settings: (
            <>
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8" />
                <path d="M4 12h2M18 12h2M12 4v2M12 18v2M6.6 6.6 8 8M16 16l1.4 1.4M17.4 6.6 16 8M8 16l-1.4 1.4" />
            </>
        ),
        stock: (
            <>
                <path d="M4 7l8-4 8 4-8 4z" />
                <path d="M4 7v10l8 4 8-4V7" />
                <path d="M12 11v10" />
            </>
        ),
        transactions: (
            <>
                <path d="M6 7h12M6 12h12M6 17h8" />
                <path d="M4 4h16v16H4z" />
            </>
        ),
        users: (
            <>
                <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                <path d="M2 20a7 7 0 0 1 14 0M17 8a3 3 0 0 1 0 6M22 20a5 5 0 0 0-5-5" />
            </>
        ),
    };

    return <svg {...commonProps}>{paths[name ?? 'menu'] ?? paths.menu}</svg>;
}
