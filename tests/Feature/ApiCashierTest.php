<?php

use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Stock;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('cashier can list incoming orders via api', function () {
    $outlet = Outlet::factory()->create();
    $cashier = User::factory()->cashier()->create(['outlet_id' => $outlet->id]);
    $customer = User::factory()->create();
    Transaction::factory()->for($customer, 'user')->for($outlet)->create([
        'order_status' => Transaction::ORDER_STATUS_RECEIVED,
    ]);

    $this->actingAs($cashier, 'sanctum')
        ->getJson('/api/cashier/orders')
        ->assertSuccessful()
        ->assertJsonPath('data.stats.received', 1)
        ->assertJsonCount(1, 'data.orders');
});

test('cashier can update order status via api', function () {
    $outlet = Outlet::factory()->create();
    $cashier = User::factory()->cashier()->create(['outlet_id' => $outlet->id]);
    $customer = User::factory()->create();
    $transaction = Transaction::factory()->for($customer, 'user')->for($outlet)->create([
        'order_status' => Transaction::ORDER_STATUS_RECEIVED,
    ]);
    $menu = MenuItem::factory()->for($outlet)->create();
    TransactionItem::factory()->for($transaction)->for($menu, 'menuItem')->create();

    $this->actingAs($cashier, 'sanctum')
        ->patchJson("/api/cashier/orders/{$transaction->id}/status", [
            'status' => Transaction::ORDER_STATUS_PREPARING,
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.orderStatus', Transaction::ORDER_STATUS_PREPARING);
});

test('cashier can create cash payment via api', function () {
    $outlet = Outlet::factory()->create();
    $cashier = User::factory()->cashier()->create(['outlet_id' => $outlet->id]);
    $menu = MenuItem::factory()->for($outlet)->create(['price' => 10000]);
    Stock::factory()->for($menu)->create(['quantity' => 5]);

    $this->actingAs($cashier, 'sanctum')
        ->postJson('/api/cashier/cash-payment', [
            'customerName' => 'Walk-in',
            'cashReceivedAmount' => 20000,
            'items' => [
                [
                    'menuItemId' => $menu->id,
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('data.totalAmount', 10000)
        ->assertJsonPath('data.changeAmount', 10000)
        ->assertJsonPath('data.paymentMethod', Transaction::PAYMENT_METHOD_COD);

    expect($menu->stock()->first()?->quantity)->toBe(4);
});
