<?php

use App\Models\Outlet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can list and create outlets via api', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/admin/outlets')
        ->assertSuccessful()
        ->assertJsonStructure(['data']);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/admin/outlets', [
            'name' => 'Kantin API',
            'location' => 'Lt 1',
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Kantin API');

    $this->assertDatabaseHas('outlets', [
        'name' => 'Kantin API',
        'location' => 'Lt 1',
    ]);
});

test('admin can access dashboard via api', function () {
    $admin = User::factory()->admin()->create();
    Outlet::factory()->create();

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/admin')
        ->assertSuccessful()
        ->assertJsonStructure([
            'data' => [
                'stats' => ['outlets', 'menus', 'users'],
                'lowStockMenus',
                'recentOutlets',
            ],
        ]);
});

test('admin can create user via api', function () {
    $admin = User::factory()->admin()->create();
    $outlet = Outlet::factory()->create();

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/admin/users', [
            'username' => 'kasir_api',
            'fullName' => 'Kasir API',
            'password' => 'password',
            'role' => 'Cashier',
            'outletId' => $outlet->id,
        ])
        ->assertCreated()
        ->assertJsonPath('data.role', 'Cashier')
        ->assertJsonPath('data.outletId', $outlet->id);
});
