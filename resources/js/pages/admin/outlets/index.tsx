import { Head, useForm } from '@inertiajs/react';
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
    store as storeOutlet,
    update as updateOutlet,
} from '@/routes/admin/outlets';
import type { OutletSummary } from '@/types';

type AdminOutletsIndexProps = {
    outlets: OutletSummary[];
};

type OutletForm = {
    name: string;
    location: string;
    qrisImageUrl: string;
};

export default function AdminOutletsIndex({ outlets }: AdminOutletsIndexProps) {
    const [selectedOutlet, setSelectedOutlet] = useState<OutletSummary | null>(
        null,
    );
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const createForm = useForm<OutletForm>({
        name: '',
        location: '',
        qrisImageUrl: '',
    });
    const editForm = useForm<OutletForm>({
        name: '',
        location: '',
        qrisImageUrl: '',
    });
    const qrisReadyCount = useMemo(
        () => outlets.filter((outlet) => outlet.qrisImageUrl).length,
        [outlets],
    );

    function openCreateModal() {
        createForm.clearErrors();
        createForm.reset();
        setCreateModalOpen(true);
    }

    function openEditModal(outlet: OutletSummary) {
        setSelectedOutlet(outlet);
        editForm.clearErrors();
        editForm.setData({
            name: outlet.name,
            location: outlet.location ?? '',
            qrisImageUrl: outlet.qrisImageUrl ?? '',
        });
        setEditModalOpen(true);
    }

    function create(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        createForm.post(storeOutlet.url(), {
            onSuccess: () => {
                createForm.reset();
                setCreateModalOpen(false);
            },
            preserveScroll: true,
        });
    }

    function update(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedOutlet) {
            return;
        }

        editForm.patch(updateOutlet.url(selectedOutlet.id), {
            onSuccess: () => setEditModalOpen(false),
            preserveScroll: true,
        });
    }

    return (
        <AdminLayout
            description="Kelola outlet, lokasi, dan URL QRIS per kantin."
            title="Kelola Outlet"
        >
            <Head title="Kelola Outlet" />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard label="Total outlet" value={outlets.length} />
                <MetricCard label="QRIS siap" value={qrisReadyCount} />
                <MetricCard
                    label="Total menu"
                    value={outlets.reduce(
                        (total, outlet) => total + (outlet.menuItemsCount ?? 0),
                        0,
                    )}
                />
            </section>

            <Card className="min-w-0">
                <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>Daftar Outlet</CardTitle>
                    <Button onClick={openCreateModal} type="button">
                        Tambah Outlet
                    </Button>
                </CardHeader>
                <CardContent>
                    {outlets.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {outlets.map((outlet) => (
                                <button
                                    className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50"
                                    key={outlet.id}
                                    onClick={() => openEditModal(outlet)}
                                    type="button"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-base font-semibold text-slate-900">
                                                {outlet.name}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                                {outlet.location ??
                                                    'Lokasi belum diisi'}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                outlet.qrisImageUrl
                                                    ? 'success'
                                                    : 'secondary'
                                            }
                                        >
                                            {outlet.qrisImageUrl
                                                ? 'QRIS'
                                                : 'Belum'}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                                        <span className="text-slate-500">
                                            Menu aktif
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {outlet.menuItemsCount ?? 0}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="Belum ada outlet yang ditampilkan." />
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Tambah Outlet"
            >
                <OutletForm
                    errors={createForm.errors}
                    formData={createForm.data}
                    isProcessing={createForm.processing}
                    onSubmit={create}
                    setData={(key, value) => createForm.setData(key, value)}
                    submitLabel="Tambah Outlet"
                />
            </Modal>

            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Edit Outlet"
            >
                <OutletForm
                    errors={editForm.errors}
                    formData={editForm.data}
                    isProcessing={editForm.processing}
                    onSubmit={update}
                    setData={(key, value) => editForm.setData(key, value)}
                    submitLabel="Simpan Outlet"
                />
            </Modal>
        </AdminLayout>
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

function OutletForm({
    errors,
    formData,
    isProcessing,
    onSubmit,
    setData,
    submitLabel,
}: {
    errors: Partial<Record<keyof OutletForm, string>>;
    formData: OutletForm;
    isProcessing: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setData: (key: keyof OutletForm, value: string) => void;
    submitLabel: string;
}) {
    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            <FieldErrorInput
                error={errors.name}
                id="outlet-name"
                label="Nama outlet"
                onChange={(value) => setData('name', value)}
                value={formData.name}
            />

            <FieldErrorInput
                error={errors.location}
                id="outlet-location"
                label="Lokasi"
                onChange={(value) => setData('location', value)}
                value={formData.location}
            />

            <FieldErrorInput
                error={errors.qrisImageUrl}
                id="outlet-qrisImageUrl"
                label="URL QRIS"
                onChange={(value) => setData('qrisImageUrl', value)}
                placeholder="/storage/qris/outlet.png"
                value={formData.qrisImageUrl}
            />

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button disabled={isProcessing} type="submit">
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

function FieldErrorInput({
    error,
    id,
    label,
    onChange,
    placeholder,
    value,
}: {
    error?: string;
    id: string;
    label: string;
    onChange: (value: string) => void;
    placeholder?: string;
    value: string;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                value={value}
            />
            {error ? (
                <p className="text-sm font-medium text-destructive">{error}</p>
            ) : null}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {message}
        </div>
    );
}
