import type { Page } from '@inertiajs/core';
import toast from 'react-hot-toast';

export type FlashMessages = {
    success?: string | null;
    error?: string | null;
};

export function showFlashToasts(flash?: FlashMessages | null): void {
    if (!flash) {
        return;
    }

    if (flash.success) {
        toast.success(flash.success);
    }

    if (flash.error) {
        toast.error(flash.error);
    }
}

export function showFlashFromPage(page: Page): void {
    showFlashToasts((page.props as { flash?: FlashMessages }).flash);
}

export function showFormError(
    errors: Record<string, string | string[] | undefined>,
    fallback = 'Terjadi kesalahan. Periksa input Anda.',
): void {
    const firstError = Object.values(errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .find((value): value is string => typeof value === 'string' && value !== '');

    toast.error(firstError ?? fallback);
}

export function showTransactionLoading(
    id: string,
    message = 'Memproses transaksi...',
): void {
    toast.loading(message, { id });
}

export function dismissTransactionToast(id: string): void {
    toast.dismiss(id);
}
