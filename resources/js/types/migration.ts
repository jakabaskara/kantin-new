export type UserRole = 'Admin' | 'Cashier' | 'Kasir' | 'Customer' | 'Mahasiswa';

export type MigratedUser = {
    id: number;
    username: string;
    fullName: string | null;
    role: UserRole | string;
    outletId: number | null;
};

export type NavigationItem = {
    label: string;
    shortLabel?: string;
    icon?: string;
    href: string;
    match?: string;
    disabled?: boolean;
};
