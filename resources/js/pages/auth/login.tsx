import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    username: string;
    password: string;
    remember: boolean;
};

export default function Login() {
    const form = useForm<LoginForm>({
        username: '',
        password: '',
        remember: false,
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post('/login');
    }

    const loginVisual = (
        <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            src="/assets/img/Gemini_Generated_Image_egtq19egtq19egtq.png"
        />
    );

    return (
        <AuthLayout
            description=""
            title="Kantin Paramadina"
            visual={loginVisual}
        >
            <Head title="Login" />

            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl font-bold tracking-tight">
                    Login
                </CardTitle>
                <CardDescription>
                    Gunakan username dan password akun kantin.
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
                    <Label htmlFor="password">Password</Label>
                    <Input
                        autoComplete="current-password"
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

                <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                        checked={form.data.remember}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        onChange={(event) =>
                            form.setData('remember', event.target.checked)
                        }
                        type="checkbox"
                    />
                    Ingat saya
                </label>

                <Button
                    className="h-11 w-full"
                    disabled={form.processing}
                    type="submit"
                >
                    Masuk
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Belum punya akun?{' '}
                <Link className="font-medium text-primary" href="/register">
                    Daftar
                </Link>
            </p>
        </AuthLayout>
    );
}
