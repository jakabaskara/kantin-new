import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import {
    destroy as destroyMenu,
    index as adminMenuIndex,
    store as storeMenu,
    update as updateMenu,
} from '@/routes/admin/menu';
import type {
    CustomerMenuFilters,
    MenuItemSummary,
    OutletSummary,
} from '@/types';

type AdminMenuIndexProps = {
    menus: PaginatedMenus;
    outlets: OutletSummary[];
    filters: CustomerMenuFilters;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedMenus = {
    data: MenuItemSummary[];
    from: number | null;
    links: PaginationLink[];
    to: number | null;
    total: number;
};

type StoreMenuForm = {
    name: string;
    description: string;
    price: string;
    outletId: string;
    initialStockQuantity: string;
    imageFile: File | null;
};

type UpdateMenuForm = {
    name: string;
    description: string;
    price: string;
    stockQuantity: string;
    imageFile: File | null;
};

export default function AdminMenuIndex({
    menus,
    outlets,
    filters,
}: AdminMenuIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [outlet, setOutlet] = useState(
        filters.outlet ? String(filters.outlet) : '',
    );
    const [selectedMenu, setSelectedMenu] = useState<MenuItemSummary | null>(
        null,
    );
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const createForm = useForm<StoreMenuForm>({
        name: '',
        description: '',
        price: '',
        outletId: 'all',
        initialStockQuantity: '0',
        imageFile: null,
    });
    const editForm = useForm<UpdateMenuForm>({
        name: '',
        description: '',
        price: '',
        stockQuantity: '0',
        imageFile: null,
    });
    const totalStock = useMemo(
        () =>
            menus.data.reduce(
                (total, menu) => total + menu.stockQuantity,
                0,
            ),
        [menus.data],
    );

    function filter(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const query: Record<string, string> = {};
        const trimmedSearch = search.trim();

        if (trimmedSearch !== '') {
            query.search = trimmedSearch;
        }

        if (outlet !== '') {
            query.outlet = outlet;
        }

        router.get(adminMenuIndex.url(), query, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    function resetFilter() {
        setSearch('');
        setOutlet('');

        router.get(
            adminMenuIndex.url(),
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
            name: '',
            description: '',
            price: '',
            outletId: 'all',
            initialStockQuantity: '0',
            imageFile: null,
        });
        setCreateModalOpen(true);
    }

    function create(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        createForm.post(storeMenu.url(), {
            forceFormData: true,
            onSuccess: () => {
                createForm.reset();
                setCreateModalOpen(false);
            },
            preserveScroll: true,
        });
    }

    function openEditModal(menu: MenuItemSummary) {
        setSelectedMenu(menu);
        editForm.clearErrors();
        editForm.setData({
            name: menu.name,
            description: menu.description ?? '',
            price: String(menu.price),
            stockQuantity: String(menu.stockQuantity),
            imageFile: null,
        });
        setEditModalOpen(true);
    }

    function update(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedMenu) {
            return;
        }

        editForm.transform((data) => ({
            ...data,
            _method: 'patch',
        }));
        editForm.post(updateMenu.url(selectedMenu.id), {
            forceFormData: true,
            onSuccess: () => setEditModalOpen(false),
            preserveScroll: true,
        });
    }

    function remove(menu: MenuItemSummary) {
        if (!window.confirm(`Hapus menu ${menu.name}?`)) {
            return;
        }

        router.delete(destroyMenu.url(menu.id), {
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
            description="Kelola katalog menu, gambar upload, outlet, dan stok awal."
            title="Kelola Menu"
        >
            <Head title="Kelola Menu" />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryCard label="Total menu" value={menus.total} />
                <SummaryCard label="Stok halaman ini" value={totalStock} />
                <SummaryCard label="Outlet" value={outlets.length} />
            </section>

            <section className="space-y-4">
                <Card className="min-w-0">
                    <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Filter Menu</CardTitle>
                        <Button onClick={openCreateModal} type="button">
                            Tambah Menu
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end"
                            onSubmit={filter}
                        >
                            <div className="space-y-2">
                                <Label htmlFor="search">Cari menu</Label>
                                <Input
                                    id="search"
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Nama atau deskripsi"
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

                            <div className="grid grid-cols-2 gap-2 md:flex">
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
                        <CardTitle>Daftar Menu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[52rem] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                                        <th className="px-3 py-3 font-semibold">
                                            Menu
                                        </th>
                                        <th className="px-3 py-3 font-semibold">
                                            Outlet
                                        </th>
                                        <th className="px-3 py-3 font-semibold">
                                            Harga
                                        </th>
                                        <th className="px-3 py-3 font-semibold">
                                            Stok
                                        </th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menus.data.map((menu) => (
                                        <tr
                                            className="border-b border-slate-100 last:border-0"
                                            key={menu.id}
                                        >
                                            <td className="px-3 py-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    {menu.imageUrl ? (
                                                        <img
                                                            alt={menu.name}
                                                            className="h-12 w-12 rounded-md object-cover"
                                                            src={menu.imageUrl}
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-primary">
                                                            {menu.name
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-slate-900">
                                                            {menu.name}
                                                        </p>
                                                        <p className="truncate text-xs text-slate-500">
                                                            {menu.description ??
                                                                '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">
                                                {menu.outletName ?? '-'}
                                            </td>
                                            <td className="px-3 py-3 font-medium text-slate-900">
                                                {formatCurrency(menu.price)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <StockBadge
                                                    quantity={
                                                        menu.stockQuantity
                                                    }
                                                />
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        onClick={() =>
                                                            openEditModal(menu)
                                                        }
                                                        size="sm"
                                                        type="button"
                                                        variant="outline"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            remove(menu)
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

                        {menus.data.length === 0 ? (
                            <EmptyState message="Belum ada menu yang ditampilkan." />
                        ) : null}

                        <Pagination
                            from={menus.from}
                            links={menus.links}
                            onVisit={visitPagination}
                            to={menus.to}
                            total={menus.total}
                        />
                    </CardContent>
                </Card>
            </section>

            <Modal
                description="Pilih satu outlet atau semua outlet untuk membuat menu yang sama."
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Tambah Menu"
                widthClass="max-w-2xl"
            >
                <MenuForm
                    errors={createForm.errors}
                    formData={createForm.data}
                    isCreateForm
                    isProcessing={createForm.processing}
                    onFileChange={(file) =>
                        createForm.setData('imageFile', file)
                    }
                    onSubmit={create}
                    outlets={outlets}
                    setData={(key, value) =>
                        createForm.setData(
                            key as keyof StoreMenuForm,
                            value as never,
                        )
                    }
                    stockField="initialStockQuantity"
                    submitLabel="Tambah Menu"
                />
            </Modal>

            <Modal
                description="Upload gambar baru jika ingin mengganti gambar menu."
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Edit Menu"
                widthClass="max-w-2xl"
            >
                <MenuForm
                    currentImageUrl={selectedMenu?.imageUrl ?? null}
                    errors={editForm.errors}
                    formData={editForm.data}
                    isProcessing={editForm.processing}
                    onFileChange={(file) => editForm.setData('imageFile', file)}
                    onSubmit={update}
                    outlets={outlets}
                    setData={(key, value) =>
                        editForm.setData(
                            key as keyof UpdateMenuForm,
                            value as never,
                        )
                    }
                    stockField="stockQuantity"
                    submitLabel="Simpan Menu"
                />
            </Modal>
        </AdminLayout>
    );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
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

function MenuForm({
    currentImageUrl,
    errors,
    formData,
    isCreateForm = false,
    isProcessing,
    onFileChange,
    onSubmit,
    outlets,
    setData,
    stockField,
    submitLabel,
}: {
    currentImageUrl?: string | null;
    errors: Partial<Record<string, string>>;
    formData: StoreMenuForm | UpdateMenuForm;
    isCreateForm?: boolean;
    isProcessing: boolean;
    onFileChange: (file: File | null) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    outlets: OutletSummary[];
    setData: (key: string, value: string | File | null) => void;
    stockField: 'initialStockQuantity' | 'stockQuantity';
    submitLabel: string;
}) {
    const stockValue = isCreateForm
        ? (formData as StoreMenuForm).initialStockQuantity
        : (formData as UpdateMenuForm).stockQuantity;

    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
                <Label htmlFor="menu-name">Nama menu</Label>
                <Input
                    id="menu-name"
                    onChange={(event) => setData('name', event.target.value)}
                    value={formData.name}
                />
                {errors.name ? <FormError message={errors.name} /> : null}
            </div>

            {isCreateForm ? (
                <div className="space-y-2">
                    <Label htmlFor="menu-outlet">Outlet</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        id="menu-outlet"
                        onChange={(event) =>
                            setData('outletId', event.target.value)
                        }
                        value={(formData as StoreMenuForm).outletId}
                    >
                        <option value="all">Semua outlet</option>
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
            ) : null}

            <div className="space-y-2">
                <Label htmlFor="menu-description">Deskripsi</Label>
                <Textarea
                    id="menu-description"
                    onChange={(event) =>
                        setData('description', event.target.value)
                    }
                    value={formData.description}
                />
                {errors.description ? (
                    <FormError message={errors.description} />
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="menu-price">Harga</Label>
                    <Input
                        id="menu-price"
                        min="0"
                        onChange={(event) =>
                            setData('price', event.target.value)
                        }
                        type="number"
                        value={formData.price}
                    />
                    {errors.price ? (
                        <FormError message={errors.price} />
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="menu-stock">Stok</Label>
                    <Input
                        id="menu-stock"
                        min="0"
                        onChange={(event) =>
                            setData(stockField, event.target.value)
                        }
                        type="number"
                        value={stockValue}
                    />
                    {errors[stockField] ? (
                        <FormError message={errors[stockField]} />
                    ) : null}
                </div>
            </div>

            {currentImageUrl ? (
                <div className="space-y-2">
                    <Label>Gambar saat ini</Label>
                    <img
                        alt="Gambar menu saat ini"
                        className="h-24 w-24 rounded-lg object-cover"
                        src={currentImageUrl}
                    />
                </div>
            ) : null}

            <div className="space-y-2">
                <Label htmlFor="menu-imageFile">Upload gambar</Label>
                <Input
                    accept=".jpg,.jpeg,.png,.gif"
                    id="menu-imageFile"
                    onChange={(event) =>
                        onFileChange(event.target.files?.[0] ?? null)
                    }
                    type="file"
                />
                {errors.imageFile ? (
                    <FormError message={errors.imageFile} />
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

function StockBadge({ quantity }: { quantity: number }) {
    if (quantity === 0) {
        return (
            <Badge variant="warning">
                Kosong
            </Badge>
        );
    }

    return (
        <Badge variant="success">
            {quantity}
        </Badge>
    );
}

function Pagination({
    from,
    links,
    onVisit,
    to,
    total,
}: {
    from: number | null;
    links: PaginationLink[];
    onVisit: (url: string | null) => void;
    to: number | null;
    total: number;
}) {
    return (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
                Menampilkan {from ?? 0}-{to ?? 0} dari {total} menu
            </p>
            <div className="flex flex-wrap gap-2">
                {links.map((link, index) => (
                    <Button
                        disabled={!link.url || link.active}
                        key={`${link.label}-${index}`}
                        onClick={() => onVisit(link.url)}
                        size="sm"
                        type="button"
                        variant={link.active ? 'default' : 'outline'}
                    >
                        {cleanPaginationLabel(link.label)}
                    </Button>
                ))}
            </div>
        </div>
    );
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

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(value);
}

function cleanPaginationLabel(label: string) {
    return label.replace('&laquo;', '‹').replace('&raquo;', '›');
}
