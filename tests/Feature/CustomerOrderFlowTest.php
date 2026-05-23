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

test('customer can create bypass order and stock is decremented', function () {
    $customer = User::factory()->create([
        'full_name' => 'Customer Satu',
        'username' => 'customer_satu',
    ]);
    $outlet = Outlet::factory()->create();
    $menu = MenuItem::factory()->for($outlet)->create(['price' => 15000]);
    Stock::factory()->for($menu)->create(['quantity' => 6]);

    $response = $this->actingAs($customer)
        ->post(route('customer.orders.store'), [
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
        ->assertRedirect(route('customer.orders.index', ['created' => $transaction->id]))
        ->assertSessionHasNoErrors();

    expect((float) $transaction->total_amount)->toBe(30000.0)
        ->and($transaction->customer_name)->toBe('Customer Satu')
        ->and($transaction->payment_method)->toBe(Transaction::PAYMENT_METHOD_BYPASS)
        ->and($transaction->payment_status)->toBe(Transaction::PAYMENT_STATUS_PAID)
        ->and($transaction->order_status)->toBe(Transaction::ORDER_STATUS_RECEIVED)
        ->and($menu->stock()->first()?->quantity)->toBe(4);

    expect(TransactionItem::query()->first()?->unit_price)->toEqual('15000.00');
});

test('customer cannot create one order across multiple outlets', function () {
    $customer = User::factory()->create();
    $firstMenu = MenuItem::factory()->for(Outlet::factory())->create();
    $secondMenu = MenuItem::factory()->for(Outlet::factory())->create();
    Stock::factory()->for($firstMenu)->create(['quantity' => 5]);
    Stock::factory()->for($secondMenu)->create(['quantity' => 5]);

    $this->actingAs($customer)
        ->post(route('customer.orders.store'), [
            'items' => [
                ['menuItemId' => $firstMenu->id, 'quantity' => 1],
                ['menuItemId' => $secondMenu->id, 'quantity' => 1],
            ],
        ])
        ->assertSessionHasErrors('items');

    expect(Transaction::query()->count())->toBe(0);
});

test('cashier sees customer order and can update status', function () {
    $outlet = Outlet::factory()->create(['name' => 'Kantin A']);
    $cashier = User::factory()->cashier()->create(['outlet_id' => $outlet->id]);
    $customer = User::factory()->create(['full_name' => 'Customer A']);
    $transaction = Transaction::factory()->for($customer, 'user')->for($outlet)->create([
        'customer_name' => 'Customer A',
        'payment_method' => Transaction::PAYMENT_METHOD_BYPASS,
        'order_status' => Transaction::ORDER_STATUS_RECEIVED,
    ]);
    $menu = MenuItem::factory()->for($outlet)->create(['name' => 'Es Teh']);
    TransactionItem::factory()->for($transaction)->for($menu, 'menuItem')->create();

    $this->actingAs($cashier)
        ->get(route('cashier.orders.incoming'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cashier/orders/incoming')
            ->where('outlet.name', 'Kantin A')
            ->where('stats.received', 1)
            ->where('orders.0.customerDisplayName', 'Customer A')
            ->where('orders.0.items.0.menuName', 'Es Teh')
        );

    $this->actingAs($cashier)
        ->patch(route('cashier.orders.status.update', $transaction), [
            'status' => Transaction::ORDER_STATUS_PREPARING,
        ])
        ->assertRedirect();

    expect($transaction->fresh()->order_status)->toBe(Transaction::ORDER_STATUS_PREPARING);
});

test('customer can track own order progress', function () {
    $customer = User::factory()->create();
    $otherCustomer = User::factory()->create();
    $ownOrder = Transaction::factory()->for($customer, 'user')->create([
        'order_status' => Transaction::ORDER_STATUS_READY,
    ]);
    Transaction::factory()->for($otherCustomer, 'user')->create();

    $this->actingAs($customer)
        ->get(route('customer.orders.index', ['created' => $ownOrder->id]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customer/orders/index')
            ->where('createdOrderId', $ownOrder->id)
            ->has('orders', 1)
            ->where('orders.0.id', $ownOrder->id)
            ->where('orders.0.orderStatus', Transaction::ORDER_STATUS_READY)
        );
});
