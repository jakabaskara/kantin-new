<?php

use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Stock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('customer menu page receives menu and outlet props', function () {
    $customer = User::factory()->create();
    $outlet = Outlet::factory()->create([
        'name' => 'Kantin Utama',
        'location' => 'Gedung A',
    ]);
    $menu = MenuItem::factory()->for($outlet)->create([
        'name' => 'Nasi Ayam',
        'description' => 'Nasi dengan ayam bumbu.',
        'price' => 15000,
    ]);

    Stock::factory()->for($menu)->create([
        'quantity' => 12,
    ]);

    $this->actingAs($customer)
        ->get(route('customer.menu.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customer/menu/index')
            ->has('menus', 1)
            ->where('menus.0.name', 'Nasi Ayam')
            ->where('menus.0.outletName', 'Kantin Utama')
            ->where('menus.0.stockQuantity', 12)
            ->has('outlets', 1)
            ->where('outlets.0.name', 'Kantin Utama')
            ->where('filters.search', '')
            ->where('filters.outlet', null)
        );
});

test('customer menu page can filter by search and outlet', function () {
    $customer = User::factory()->create();
    $mainOutlet = Outlet::factory()->create(['name' => 'Kantin Utama']);
    $secondOutlet = Outlet::factory()->create(['name' => 'Kantin Kedua']);
    $matchedMenu = MenuItem::factory()->for($mainOutlet)->create([
        'name' => 'Soto Ayam',
    ]);
    $hiddenMenu = MenuItem::factory()->for($secondOutlet)->create([
        'name' => 'Bakso',
    ]);

    Stock::factory()->for($matchedMenu)->create(['quantity' => 5]);
    Stock::factory()->for($hiddenMenu)->create(['quantity' => 9]);

    $this->actingAs($customer)
        ->get(route('customer.menu.index', [
            'search' => 'soto',
            'outlet' => $mainOutlet->id,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customer/menu/index')
            ->has('menus', 1)
            ->where('menus.0.name', 'Soto Ayam')
            ->where('menus.0.outletId', $mainOutlet->id)
            ->where('filters.search', 'soto')
            ->where('filters.outlet', $mainOutlet->id)
        );
});
