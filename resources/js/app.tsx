import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

import { registerInertiaToasts } from '@/lib/inertia-toast';
import { showFlashFromPage } from '@/lib/toast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

registerInertiaToasts();

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#4B5563',
    },
    setup({ el, App, props }) {
        if (!el) {
            return;
        }

        showFlashFromPage(props.initialPage);

        createRoot(el).render(
            <>
                <App {...props} />
                <Toaster
                    position="top-center"
                    toastOptions={{
                        className: 'text-sm font-medium',
                        duration: 4000,
                        style: {
                            borderRadius: '0.75rem',
                            maxWidth: '24rem',
                        },
                        success: {
                            style: {
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#065f46',
                            },
                        },
                        error: {
                            style: {
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#991b1b',
                            },
                        },
                        loading: {
                            style: {
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1e40af',
                            },
                        },
                    }}
                />
            </>,
        );
    },
});
