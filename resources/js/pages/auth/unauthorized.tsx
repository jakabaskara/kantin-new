import { Head, Link } from '@inertiajs/react';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Unauthorized() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900">
            <Head title="Unauthorized" />

            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Akses ditolak</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Akun ini tidak memiliki akses ke halaman tersebut.
                    </p>
                    <Link
                        className={buttonVariants({
                            className: 'w-full',
                        })}
                        href="/"
                    >
                        Kembali
                    </Link>
                </CardContent>
            </Card>
        </main>
    );
}
