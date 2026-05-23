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
import {
    destroy as destroyUser,
    index as adminUsersIndex,
    store as storeUser,
    update as updateUser,
} from '@/routes/admin/users';
import type { OutletSummary } from '@/types';

type AdminUser = {
    id: number;
    username: string;
    fullName: string | null;
    role: string;
    outletId: number | null;
    outletName: string | null;
    createdAt: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedUsers = {
    data: AdminUser[];
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    per_page: number;
    to: number | null;
    total: number;
};

type UserFilters = {
    search: string;
    role: string | null;
    outlet: number | null;
};

type UserForm = {
    username: string;
    password: string;
    role: string;
    fullName: string;
    outletId: string;
};

type AdminUsersIndexProps = {
    users: PaginatedUsers;
    outlets: OutletSummary[];
    filters: UserFilters;
    roles: string[];
};

export default function AdminUsersIndex({
    filters,
    outlets,
    roles,
    users,
}: AdminUsersIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [role, setRole] = useState(filters.role ?? '');
    const [outlet, setOutlet] = useState(
        filters.outlet ? String(filters.outlet) : '',
    );
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const createForm = useForm<UserForm>({
        username: '',
        password: '',
        role: 'Customer',
        fullName: '',
        outletId: '',
    });
    const editForm = useForm<UserForm>({
        username: '',
        password: '',
        role: 'Customer',
        fullName: '',
        outletId: '',
    });
    const stats = useMemo(() => {
        const cashierCount = users.data.filter((user) =>
            roleRequiresOutlet(user.role),
        ).length;
        const adminCount = users.data.filter((user) => user.role === 'Admin')
            .length;

        return { adminCount, cashierCount };
    }, [users.data]);

    function filter(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const query: Record<string, string> = {};
        const trimmedSearch = search.trim();

        if (trimmedSearch !== '') {
            query.search = trimmedSearch;
        }

        if (role !== '') {
            query.role = role;
        }

        if (outlet !== '') {
            query.outlet = outlet;
        }

        router.get(adminUsersIndex.url(), query, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    function resetFilter() {
        setSearch('');
        setRole('');
        setOutlet('');

        router.get(
            adminUsersIndex.url(),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function openCreateModal() {
        createForm.clearErrors();
        createForm.setData({
            username: '',
            password: '',
            role: 'Customer',
            fullName: '',
            outletId: '',
        });
        setCreateModalOpen(true);
    }

    function create(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        createForm.post(storeUser.url(), {
            onSuccess: () => {
                createForm.reset();
                setCreateModalOpen(false);
            },
            preserveScroll: true,
        });
    }

    function openEditModal(user: AdminUser) {
        setSelectedUser(user);
        editForm.clearErrors();
        editForm.setData({
            username: user.username,
            password: '',
            role: normalizeRole(user.role),
            fullName: user.fullName ?? '',
            outletId: user.outletId ? String(user.outletId) : '',
        });
        setEditModalOpen(true);
    }

    function update(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedUser) {
            return;
        }

        editForm.patch(updateUser.url(selectedUser.id), {
            onSuccess: () => setEditModalOpen(false),
            preserveScroll: true,
        });
    }

    function remove(user: AdminUser) {
        if (!window.confirm(`Hapus akun ${user.username}?`)) {
            return;
        }

        router.delete(destroyUser.url(user.id), {
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
            description="Kelola akun admin, kasir, dan pelanggan."
            title="Kelola Akun"
        >
            <Head title="Kelola Akun" />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard label="Total akun" value={users.total} />
                <MetricCard label="Admin di halaman ini" value={stats.adminCount} />
                <MetricCard
                    label="Kasir di halaman ini"
                    value={stats.cashierCount}
                />
            </section>

            <section className="space-y-4">
                <Card className="min-w-0">
                    <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Filter Akun</CardTitle>
                        <Button onClick={openCreateModal} type="button">
                            Tambah Akun
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_14rem_auto] lg:items-end"
                            onSubmit={filter}
                        >
                            <div className="space-y-2">
                                <Label htmlFor="search">Cari akun</Label>
                                <Input
                                    id="search"
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Username atau nama"
                                    value={search}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    id="role"
                                    onChange={(event) =>
                                        setRole(event.target.value)
                                    }
                                    value={role}
                                >
                                    <option value="">Semua role</option>
                                    {roles.map((roleItem) => (
                                        <option key={roleItem} value={roleItem}>
                                            {roleItem}
                                        </option>
                                    ))}
                                </select>
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

                            <div className="grid grid-cols-2 gap-2 lg:flex">
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
                        <CardTitle>Daftar Akun</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[48rem] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                                        <th className="px-3 py-3 font-semibold">
                                            Akun
                                        </th>
                                        <th className="px-3 py-3 font-semibold">
                                            Role
                                        </th>
                                        <th className="px-3 py-3 font-semibold">
                                            Outlet
                                        </th>
                                        <th className="px-3 py-3 font-semibold">
                                            Dibuat
                                        </th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr
                                            className="border-b border-slate-100 last:border-0"
                                            key={user.id}
                                        >
                                            <td className="px-3 py-3">
                                                <p className="font-medium text-slate-900">
                                                    {user.username}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {user.fullName ?? '-'}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <RoleBadge role={user.role} />
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">
                                                {user.outletName ?? '-'}
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        onClick={() =>
                                                            openEditModal(user)
                                                        }
                                                        size="sm"
                                                        type="button"
                                                        variant="outline"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            remove(user)
                                                        }
                                                        size="sm"
                                                        type="button"
                                                        variant="destructive"
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {users.data.length === 0 ? (
                            <EmptyState message="Belum ada akun yang cocok dengan filter." />
                        ) : null}

                        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Menampilkan {users.from ?? 0}-{users.to ?? 0}{' '}
                                dari {users.total} akun
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {users.links.map((link, index) => (
                                    <Button
                                        disabled={!link.url || link.active}
                                        key={`${link.label}-${index}`}
                                        onClick={() =>
                                            visitPagination(link.url)
                                        }
                                        size="sm"
                                        type="button"
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                    >
                                        {cleanPaginationLabel(link.label)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <Modal
                description="Role kasir wajib memilih outlet agar aksesnya terscope dengan aman."
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Tambah Akun"
            >
                <UserForm
                    errors={createForm.errors}
                    formData={createForm.data}
                    isProcessing={createForm.processing}
                    isUpdate={false}
                    onSubmit={create}
                    outlets={outlets}
                    roles={roles}
                    setData={(key, value) => createForm.setData(key, value)}
                    submitLabel="Tambah Akun"
                />
            </Modal>

            <Modal
                description="Kosongkan password jika tidak ingin mengganti password."
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Edit Akun"
            >
                <UserForm
                    errors={editForm.errors}
                    formData={editForm.data}
                    isProcessing={editForm.processing}
                    isUpdate
                    onSubmit={update}
                    outlets={outlets}
                    roles={roles}
                    setData={(key, value) => editForm.setData(key, value)}
                    submitLabel="Simpan Akun"
                />
            </Modal>
        </AdminLayout>
    );
}

function UserForm({
    errors,
    formData,
    isProcessing,
    isUpdate,
    onSubmit,
    outlets,
    roles,
    setData,
    submitLabel,
}: {
    errors: Partial<Record<keyof UserForm, string>>;
    formData: UserForm;
    isProcessing: boolean;
    isUpdate: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    outlets: OutletSummary[];
    roles: string[];
    setData: (key: keyof UserForm, value: string) => void;
    submitLabel: string;
}) {
    const needsOutlet = roleRequiresOutlet(formData.role);

    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    onChange={(event) => setData('username', event.target.value)}
                    value={formData.username}
                />
                {errors.username ? (
                    <FormError message={errors.username} />
                ) : null}
            </div>

            <div className="space-y-2">
                <Label htmlFor="fullName">Nama lengkap</Label>
                <Input
                    id="fullName"
                    onChange={(event) => setData('fullName', event.target.value)}
                    value={formData.fullName}
                />
                {errors.fullName ? (
                    <FormError message={errors.fullName} />
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        id="role"
                        onChange={(event) => {
                            const nextRole = event.target.value;

                            setData('role', nextRole);

                            if (!roleRequiresOutlet(nextRole)) {
                                setData('outletId', '');
                            }
                        }}
                        value={formData.role}
                    >
                        {roles.map((roleItem) => (
                            <option key={roleItem} value={roleItem}>
                                {roleItem}
                            </option>
                        ))}
                    </select>
                    {errors.role ? <FormError message={errors.role} /> : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="outletId">Outlet kasir</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        disabled={!needsOutlet}
                        id="outletId"
                        onChange={(event) =>
                            setData('outletId', event.target.value)
                        }
                        value={formData.outletId}
                    >
                        <option value="">Pilih outlet</option>
                        {outlets.map((outlet) => (
                            <option key={outlet.id} value={outlet.id}>
                                {outlet.name}
                            </option>
                        ))}
                    </select>
                    {errors.outletId ? (
                        <FormError message={errors.outletId} />
                    ) : null}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">
                    {isUpdate ? 'Password baru' : 'Password'}
                </Label>
                <Input
                    id="password"
                    onChange={(event) => setData('password', event.target.value)}
                    type="password"
                    value={formData.password}
                />
                {errors.password ? (
                    <FormError message={errors.password} />
                ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button disabled={isProcessing} type="submit">
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

function MetricCard({ label, value }: { label: string; value: number }) {
    return (
        <Card className="min-w-0 border-l-4 border-l-primary">
            <CardContent className="p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

function RoleBadge({ role }: { role: string }) {
    const label = normalizeRole(role);

    if (label === 'Admin') {
        return <Badge>{label}</Badge>;
    }

    if (roleRequiresOutlet(role)) {
        return (
            <Badge className="bg-blue-50 text-blue-800" variant="secondary">
                {label}
            </Badge>
        );
    }

    return <Badge variant="secondary">{label}</Badge>;
}

function FormError({ message }: { message: string }) {
    return <p className="text-sm font-medium text-destructive">{message}</p>;
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {message}
        </div>
    );
}

function normalizeRole(role: string) {
    if (role === 'Kasir') {
        return 'Cashier';
    }

    if (role === 'Mahasiswa') {
        return 'Customer';
    }

    return role;
}

function roleRequiresOutlet(role: string) {
    return ['Cashier', 'Kasir'].includes(role);
}

function cleanPaginationLabel(label: string) {
    return label.replace('&laquo;', '‹').replace('&raquo;', '›');
}

function formatDate(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}
