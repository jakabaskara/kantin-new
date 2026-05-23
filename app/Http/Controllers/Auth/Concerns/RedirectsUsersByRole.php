<?php

namespace App\Http\Controllers\Auth\Concerns;

use App\Models\User;

trait RedirectsUsersByRole
{
    protected function redirectPathFor(?User $user): string
    {
        if (! $user) {
            return route('login');
        }

        if ($user->isAdmin()) {
            return route('admin.dashboard');
        }

        if ($user->isCashier()) {
            return route('cashier.orders.incoming');
        }

        return route('customer.menu.index');
    }
}
