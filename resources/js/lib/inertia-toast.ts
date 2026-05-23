import { router } from '@inertiajs/react';

import { showFlashFromPage } from '@/lib/toast';

export function registerInertiaToasts(): void {
    router.on('success', (event) => {
        showFlashFromPage(event.detail.page);
    });
}
