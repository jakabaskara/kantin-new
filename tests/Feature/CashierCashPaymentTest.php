<?php

use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Stock;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('cashier can view cash payment props for assigned outlet', function () {
    $outlet = Outlet::factory()->create(['name' => 'Kantin Kasir']);
    $cashier = User::factory()->cashier()->create(['outlet_id' => $outlet->id]);
    $menu = MenuItem::factory()->for($outlet)->create(['name' => 'Es Teh']);
    Stock::factory()->for($menu)->create(['quantity' => 7]);

    $this->actingAs($cashier)
        ->get(route('cashier.cash-payment.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cashier/cash-payment')
            ->where('canSubmitCashTransaction', true)
            ->where('outlet.name', 'Kantin Kasir')
            ->where('receipt', null)
            ->has('recentTransactions', 0)
            ->has('menus', 1)
            ->where('menus.0.name', 'Es Teh')
            ->where('menus.0.stockQuantity', 7)
        );
});

test('cashier can store cash transaction and decrement stock', function () {
    $outlet = Outlet::factory()->create();
    $cashier = User::factory()->cashier()->create(['outlet_id' => $outlet->id]);
    $menu = MenuItem::factory()->for($outlet)->create([
        'name' => 'Nasi Ayam',
        'price' => 12000,
    ]);
    Stock::factory()->for($menu)->create(['quantity' => 5]);

    $response = $this->actingAs($cashier)
        ->post(route('cashier.cash-payment.store'), [
            'cashReceivedAmount' => 30000,
            'items' => [
                [
                    'menuItemId' => $menu->id,
                    'quantity' => 2,
                    'unitPrice' => 1,
                ],
            ],
        ]);

    $transaction = Transaction::query()->firstOrFail();

    $response
        ->assertRedirect(route('cashier.cash-payment.index', ['receipt' => $transaction->id]))
        ->assertSessionHasNoErrors();

    expect((float) $transaction->total_amount)->toBe(24000.0)
        ->and((float) $transaction->cash_received_amount)->toBe(30000.0)
        ->and((float) $transaction->change_amount)->toBe(6000.0)
        ->and($transaction->customer_name)->toBe('Pelanggan walk-in')
        ->and($transaction->user_id)->toBe($cashier->id)
        ->and($transaction->outlet_id)->toBe($outlet->id)
        ->and($transaction->payment_method)->toBe(Transaction::PAYMENT_METHOD_COD)
        ->and($transaction->payment_status)->toBe(Transaction::PAYMENT_STATUS_PAID)
        ->and($transaction->order_status)->toBe(Transaction::ORDER_STATUS_RECEIVED);

    $item = TransactionItem::query()->firstOrFail();

    expect($item->menu_item_id)->toBe($menu->id)
        ->and($item->quantity)->toBe(2)
        ->and((float) $item->unit_price)->toBe(12000.0)
        ->and($menu->stock()->first()?->quantity)->toBe(3);
});

test('cashier cannot store transaction for another outlet menu', function () {
    $cashierOutlet = Outlet::factory()->create();
    $otherOutlet = Outlet::factory()->create();
    $cashier = User::factory()->cashier()->create(['outlet_id' => $cashierOutlet->id]);
    $menu = MenuItem::factory()->for($otherOutlet)->create();
    Stock::factory()->for($menu)->create(['quantity' => 5]);

    $this->actingAs($cashier)
        ->post(route('cashier.cash-payment.store'), [
            'customerName' => 'Sari',
            'cashReceivedAmount' => 50000,
            'items' => [
                [
                    'menuItemId' => $menu->id,
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertSessionHasErrors('items');

    expect(Transaction::query()->count())->toBe(0)
        ->and($menu->stock()->first()?->quantity)->toBe(5);
});

test('cashier cannot store transaction with insufficient stock', function () {
    $outlet = Outlet::factory()->create();
    $cashier = User::factory()->cashier()->create(['outlet_id' => $outlet->id]);
    $menu = MenuItem::factory()->for($outlet)->create();
    Stock::factory()->for($menu)->create(['quantity' => 1]);

    $this->actingAs($cashier)
        ->post(route('cashier.cash-payment.store'), [
            'customerName' => 'Rina',
            'cashReceivedAmount' => 50000,
            'items' => [
                [
                    'menuItemId' => $menu->id,
                    'quantity' => 2,
                ],
            ],
        ])
        ->assertSessionHasErrors('items');

    expect(Transaction::query()->count())->toBe(0)
        ->and($menu->stock()->first()?->quantity)->toBe(1);
});

test('cashier cannot store transaction when cash received is less than total', function () {
    $outlet = Outlet::factory()->create();
    $cashier = User::factory()->cashier()->create(['outlet_id' => $outlet->id]);
    $menu = MenuItem::factory()->for($outlet)->create(['price' => 12000]);
    Stock::factory()->for($menu)->create(['quantity' => 5]);

    $this->actingAs($cashier)
        ->post(route('cashier.cash-payment.store'), [
            'customerName' => 'Dian',
            'cashReceivedAmount' => 10000,
            'items' => [
                [
                    'menuItemId' => $menu->id,
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertSessionHasErrors('cashReceivedAmount');

    expect(Transaction::query()->count())->toBe(0)
        ->and($menu->stock()->first()?->quantity)->toBe(5);
});

test('cashier can reopen receipt for assigned outlet', function () {
    $outlet = Outlet::factory()->create(['name' => 'Kantin Kasir']);
    $cashier = User::factory()->cashier()->create(['outlet_id' => $outlet->id]);
    $transaction = Transaction::factory()->for($cashier, 'user')->for($outlet)->create([
        'customer_name' => 'Budi',
        'total_amount' => 24000,
        'cash_received_amount' => 30000,
        'change_amount' => 6000,
    ]);
    $menu = MenuItem::factory()->for($outlet)->create(['name' => 'Nasi Ayam']);
    TransactionItem::factory()->for($transaction)->for($menu, 'menuItem')->create([
        'quantity' => 2,
        'unit_price' => 12000,
    ]);

    $this->actingAs($cashier)
        ->get(route('cashier.cash-payment.index', ['receipt' => $transaction->id]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cashier/cash-payment')
            ->where('receipt.id', $transaction->id)
            ->where('receipt.cashReceivedAmount', 30000.0)
            ->where('receipt.changeAmount', 6000.0)
            ->where('receipt.items.0.menuName', 'Nasi Ayam')
            ->has('recentTransactions', 1)
        );
});
