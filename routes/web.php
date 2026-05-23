<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\MenuItemController;
use App\Http\Controllers\Admin\OutletController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Cashier\CashPaymentController;
use App\Http\Controllers\Cashier\OrderController as CashierOrderController;
use App\Http\Controllers\Cashier\OrderStatusController;
use App\Http\Controllers\Customer\MenuController;
use App\Http\Controllers\Customer\OrderController as CustomerOrderController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $user = Auth::user();

    if (! $user) {
        return redirect()->route('login');
    }

    if ($user->isAdmin()) {
        return redirect()->route('admin.dashboard');
    }

    if ($user->isCashier()) {
        return redirect()->route('cashier.orders.incoming');
    }

    return redirect()->route('customer.menu.index');
})->name('home');

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');

    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])->name('register.store');
});

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::inertia('/unauthorized', 'auth/unauthorized')->name('unauthorized');

Route::middleware(['auth', 'role:Admin'])->prefix('admin')->group(function (): void {
    Route::get('/', DashboardController::class)->name('admin.dashboard');
    Route::get('/outlets', [OutletController::class, 'index'])->name('admin.outlets.index');
    Route::post('/outlets', [OutletController::class, 'store'])->name('admin.outlets.store');
    Route::patch('/outlets/{outlet}', [OutletController::class, 'update'])->name('admin.outlets.update');
    Route::get('/menu', [MenuItemController::class, 'index'])->name('admin.menu.index');
    Route::post('/menu', [MenuItemController::class, 'store'])->name('admin.menu.store');
    Route::patch('/menu/{menuItem}', [MenuItemController::class, 'update'])->name('admin.menu.update');
    Route::get('/stock', [StockController::class, 'index'])->name('admin.stock.index');
    Route::patch('/menu/{menuItem}/stock', [StockController::class, 'update'])->name('admin.menu.stock.update');
    Route::delete('/menu/{menuItem}', [MenuItemController::class, 'destroy'])->name('admin.menu.destroy');
    Route::get('/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::post('/users', [UserController::class, 'store'])->name('admin.users.store');
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
});

Route::middleware(['auth', 'role:Customer,Mahasiswa'])->prefix('app')->group(function (): void {
    Route::get('/', [MenuController::class, 'index'])->name('customer.menu.index');
    Route::get('/orders', [CustomerOrderController::class, 'index'])->name('customer.orders.index');
    Route::post('/orders', [CustomerOrderController::class, 'store'])->name('customer.orders.store');
});

Route::middleware(['auth', 'role:Cashier,Kasir'])->prefix('cashier')->group(function (): void {
    Route::get('/', [CashierOrderController::class, 'incoming'])->name('cashier.orders.incoming');
    Route::patch('/orders/{transaction}/status', [OrderStatusController::class, 'update'])->name('cashier.orders.status.update');
    Route::get('/cash-payment', [CashPaymentController::class, 'index'])->name('cashier.cash-payment.index');
    Route::post('/cash-payment', [CashPaymentController::class, 'store'])->name('cashier.cash-payment.store');
});
