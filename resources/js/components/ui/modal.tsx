import { useEffect } from 'react';
import type * as React from 'react';

import { cn } from '@/lib/utils';

type ModalProps = React.PropsWithChildren<{
    description?: string;
    isOpen: boolean;
    onClose: () => void;
    title: string;
    widthClass?: string;
}>;

function Modal({
    children,
    description,
    isOpen,
    onClose,
    title,
    widthClass = 'max-w-lg',
}: ModalProps) {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', closeOnEscape);

        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center px-4 py-4 sm:items-center"
            role="dialog"
        >
            <button
                aria-label="Tutup modal"
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                onClick={onClose}
                type="button"
            />
            <div
                className={cn(
                    'relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl',
                    widthClass,
                )}
            >
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {title}
                        </h2>
                        {description ? (
                            <p className="mt-1 text-sm text-slate-500">
                                {description}
                            </p>
                        ) : null}
                    </div>
                    <button
                        aria-label="Tutup"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                        onClick={onClose}
                        type="button"
                    >
                        <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

export { Modal };
