<?php

use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Stock;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('customer can list menu via api', function () {
    $customer = User::factory()->create();
    $outlet = Outlet::factory()->create();
    MenuItem::factory()->for($outlet)->create(['name' => 'Nasi Goreng']);

    $this->actingAs($customer, 'sanctum')
        ->getJson('/api/app/menu')
        ->assertSuccessful()
        ->assertJsonPath('data.menus.0.name', 'Nasi Goreng');
});

test('customer can create order via api and stock is decremented', function () {
    $customer = User::factory()->create([
        'full_name' => 'Customer API',
    ]);
    $outlet = Outlet::factory()->create();
    $menu = MenuItem::factory()->for($outlet)->create(['price' => 15000]);
    Stock::factory()->for($menu)->create(['quantity' => 6]);

    $this->actingAs($customer, 'sanctum')
        ->postJson('/api/app/orders', [
            'items' => [
                [
                    'menuItemId' => $menu->id,
                    'quantity' => 2,
                ],
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('data.totalAmount', 30000)
        ->assertJsonPath('data.paymentMethod', Transaction::PAYMENT_METHOD_BYPASS)
        ->assertJsonPath('data.orderStatus', Transaction::ORDER_STATUS_RECEIVED);

    expect($menu->stock()->first()?->quantity)->toBe(4);
});

test('customer cannot create order across multiple outlets via api', function () {
    $customer = User::factory()->create();
    $firstMenu = MenuItem::factory()->for(Outlet::factory())->create();
    $secondMenu = MenuItem::factory()->for(Outlet::factory())->create();
    Stock::factory()->for($firstMenu)->create(['quantity' => 5]);
    Stock::factory()->for($secondMenu)->create(['quantity' => 5]);

    $this->actingAs($customer, 'sanctum')
        ->postJson('/api/app/orders', [
            'items' => [
                ['menuItemId' => $firstMenu->id, 'quantity' => 1],
                ['menuItemId' => $secondMenu->id, 'quantity' => 1],
            ],
        ])
        ->assertUnprocessable();

    expect(Transaction::query()->count())->toBe(0);
});
