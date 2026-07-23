<?php

use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\MenuItemController;
use App\Http\Controllers\Api\Admin\OutletController;
use App\Http\Controllers\Api\Admin\StockController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\Auth\MeController;
use App\Http\Controllers\Api\Auth\RegisteredUserController;
use App\Http\Controllers\Api\Cashier\CashPaymentController;
use App\Http\Controllers\Api\Cashier\OrderController as CashierOrderController;
use App\Http\Controllers\Api\Cashier\OrderStatusController;
use App\Http\Controllers\Api\Customer\MenuController;
use App\Http\Controllers\Api\Customer\OrderController as CustomerOrderController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('api.login');
Route::post('/register', [RegisteredUserController::class, 'store'])->name('api.register');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('api.logout');
    Route::get('/me', MeController::class)->name('api.me');

    Route::middleware('role:Admin')->prefix('admin')->group(function (): void {
        Route::get('/', DashboardController::class)->name('api.admin.dashboard');
        Route::get('/outlets', [OutletController::class, 'index'])->name('api.admin.outlets.index');
        Route::post('/outlets', [OutletController::class, 'store'])->name('api.admin.outlets.store');
        Route::patch('/outlets/{outlet}', [OutletController::class, 'update'])->name('api.admin.outlets.update');
        Route::get('/menu', [MenuItemController::class, 'index'])->name('api.admin.menu.index');
        Route::post('/menu', [MenuItemController::class, 'store'])->name('api.admin.menu.store');
        Route::patch('/menu/{menuItem}', [MenuItemController::class, 'update'])->name('api.admin.menu.update');
        Route::delete('/menu/{menuItem}', [MenuItemController::class, 'destroy'])->name('api.admin.menu.destroy');
        Route::get('/stock', [StockController::class, 'index'])->name('api.admin.stock.index');
        Route::patch('/menu/{menuItem}/stock', [StockController::class, 'update'])->name('api.admin.menu.stock.update');
        Route::get('/users', [UserController::class, 'index'])->name('api.admin.users.index');
        Route::post('/users', [UserController::class, 'store'])->name('api.admin.users.store');
        Route::patch('/users/{user}', [UserController::class, 'update'])->name('api.admin.users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('api.admin.users.destroy');
    });

    Route::middleware('role:Customer,Mahasiswa')->prefix('app')->group(function (): void {
        Route::get('/menu', [MenuController::class, 'index'])->name('api.customer.menu.index');
        Route::get('/orders', [CustomerOrderController::class, 'index'])->name('api.customer.orders.index');
        Route::post('/orders', [CustomerOrderController::class, 'store'])->name('api.customer.orders.store');
    });

    Route::middleware('role:Cashier,Kasir')->prefix('cashier')->group(function (): void {
        Route::get('/orders', [CashierOrderController::class, 'incoming'])->name('api.cashier.orders.incoming');
        Route::patch('/orders/{transaction}/status', [OrderStatusController::class, 'update'])->name('api.cashier.orders.status.update');
        Route::get('/cash-payment', [CashPaymentController::class, 'index'])->name('api.cashier.cash-payment.index');
        Route::post('/cash-payment', [CashPaymentController::class, 'store'])->name('api.cashier.cash-payment.store');
    });
});
