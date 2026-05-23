import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    username: string;
    fullName: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const form = useForm<RegisterForm>({
        username: '',
        fullName: '',
        password: '',
        password_confirmation: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post('/register');
    }

    return (
        <AuthLayout
            description="Buat akun untuk melanjutkan ke layanan kantin."
            title="Kantin Paramadina"
        >
            <Head title="Register" />

            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl font-bold tracking-tight">
                    Register
                </CardTitle>
                <CardDescription>
                    Buat akun customer untuk menggunakan layanan kantin.
                </CardDescription>
            </CardHeader>

            <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        autoComplete="username"
                        autoFocus
                        className="h-11 bg-slate-50"
                        id="username"
                        name="username"
                        onChange={(event) =>
                            form.setData('username', event.target.value)
                        }
                        value={form.data.username}
                    />
                    {form.errors.username ? (
                        <p className="text-sm font-medium text-destructive">
                            {form.errors.username}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fullName">Nama Lengkap</Label>
                    <Input
                        autoComplete="name"
                        className="h-11 bg-slate-50"
                        id="fullName"
                        name="fullName"
                        onChange={(event) =>
                            form.setData('fullName', event.target.value)
                        }
                        value={form.data.fullName}
                    />
                    {form.errors.fullName ? (
                        <p className="text-sm font-medium text-destructive">
                            {form.errors.fullName}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        autoComplete="new-password"
                        className="h-11 bg-slate-50"
                        id="password"
                        name="password"
                        onChange={(event) =>
                            form.setData('password', event.target.value)
                        }
                        type="password"
                        value={form.data.password}
                    />
                    {form.errors.password ? (
                        <p className="text-sm font-medium text-destructive">
                            {form.errors.password}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                        Konfirmasi Password
                    </Label>
                    <Input
                        autoComplete="new-password"
                        className="h-11 bg-slate-50"
                        id="password_confirmation"
                        name="password_confirmation"
                        onChange={(event) =>
                            form.setData(
                                'password_confirmation',
                                event.target.value,
                            )
                        }
                        type="password"
                        value={form.data.password_confirmation}
                    />
                </div>

                <Button
                    className="h-11 w-full"
                    disabled={form.processing}
                    type="submit"
                >
                    Daftar
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Sudah punya akun?{' '}
                <Link className="font-medium text-primary" href="/login">
                    Login
                </Link>
            </p>
        </AuthLayout>
    );
}
