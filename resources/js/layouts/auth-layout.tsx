import type { PropsWithChildren, ReactNode } from 'react';

type AuthLayoutProps = PropsWithChildren<{
    title?: string;
    description?: string;
    visual?: ReactNode;
}>;

export default function AuthLayout({
    children,
    title = 'Kantin Paramadina',
    description = 'Masuk untuk melanjutkan ke layanan kantin.',
    visual,
}: AuthLayoutProps) {
    return (
        <main className="grid min-h-dvh w-full overflow-x-hidden bg-background text-foreground lg:grid-cols-[1.05fr_0.95fr]">
            <section className="relative hidden overflow-hidden bg-slate-950 lg:block">
                {visual ?? (
                    <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-blue-950 to-slate-900" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 flex h-full flex-col justify-end p-10 text-white">
                    <p className="text-sm font-medium text-blue-100">
                        Kantin Paramadina
                    </p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight">
                        {title}
                    </h1>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-200">
                        {description}
                    </p>
                </div>
            </section>

            <section className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-6 sm:px-6 lg:bg-white">
                <div className="w-full max-w-md rounded-xl border border-slate-100 bg-white/90 p-5 shadow-xl backdrop-blur-sm sm:p-8 lg:bg-white">
                    <div className="mb-6 flex items-center gap-3 lg:hidden">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
                            KP
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                                Kantin Paramadina
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                Portal kantin
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </section>
        </main>
    );
}
