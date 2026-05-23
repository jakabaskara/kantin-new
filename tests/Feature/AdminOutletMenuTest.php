<?php

use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Stock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin dashboard renders operational summary props', function () {
    $admin = User::factory()->admin()->create();
    $outlet = Outlet::factory()->create(['name' => 'Kantin Utama']);
    User::factory()->cashier()->create(['outlet_id' => $outlet->id]);
    $menu = MenuItem::factory()->for($outlet)->create(['name' => 'Nasi Ayam']);

    Stock::factory()->for($menu)->create(['quantity' => 3]);

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('stats.outlets', 1)
            ->where('stats.menus', 1)
            ->where('stats.stockItems', 1)
            ->where('stats.lowStockItems', 1)
            ->where('stats.users', 2)
            ->where('stats.cashiers', 1)
            ->has('lowStockMenus', 1)
            ->where('lowStockMenus.0.name', 'Nasi Ayam')
            ->where('lowStockMenus.0.stockQuantity', 3)
            ->has('recentOutlets', 1)
            ->where('recentOutlets.0.name', 'Kantin Utama')
        );
});

test('admin can view outlet management props', function () {
    $admin = User::factory()->admin()->create();
    $outlet = Outlet::factory()->create([
        'name' => 'Kantin Utama',
        'qris_image_url' => '/storage/qris/main.png',
    ]);
    MenuItem::factory()->for($outlet)->create();

    $this->actingAs($admin)
        ->get(route('admin.outlets.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/outlets/index')
            ->has('outlets', 1)
            ->where('outlets.0.name', 'Kantin Utama')
            ->where('outlets.0.menuItemsCount', 1)
        );
});

test('admin can update outlet qris url', function () {
    $admin = User::factory()->admin()->create();
    $outlet = Outlet::factory()->create(['name' => 'Kantin Utama']);

    $this->actingAs($admin)
        ->patch(route('admin.outlets.update', $outlet), [
            'name' => 'Kantin Baru',
            'qrisImageUrl' => '/storage/qris/new.png',
        ])
        ->assertRedirect(route('admin.outlets.index'));

    $this->assertDatabaseHas('outlets', [
        'id' => $outlet->id,
        'name' => 'Kantin Baru',
        'qris_image_url' => '/storage/qris/new.png',
    ]);
});

test('admin can create an outlet', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.outlets.store'), [
            'name' => 'Kantin Teknik',
            'location' => 'Gedung B',
            'qrisImageUrl' => '/storage/qris/teknik.png',
        ])
        ->assertRedirect(route('admin.outlets.index'));

    $this->assertDatabaseHas('outlets', [
        'name' => 'Kantin Teknik',
        'location' => 'Gedung B',
        'qris_image_url' => '/storage/qris/teknik.png',
    ]);
});

test('admin can create a menu item with stock and image upload', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $outlet = Outlet::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.menu.store'), [
            'name' => 'Nasi Ayam',
            'description' => 'Nasi dengan ayam.',
            'price' => 15000,
            'outletId' => $outlet->id,
            'initialStockQuantity' => 8,
            'imageFile' => UploadedFile::fake()->image('menu.jpg'),
        ])
        ->assertRedirect(route('admin.menu.index'));

    $menu = MenuItem::query()->where('name', 'Nasi Ayam')->firstOrFail();

    expect($menu->stock?->quantity)->toBe(8);
    expect($menu->image_url)->toStartWith('/storage/menu-images/');
});

test('admin can update menu item and stock', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $menu = MenuItem::factory()->create(['name' => 'Menu Lama']);
    Stock::factory()->for($menu)->create(['quantity' => 3]);

    $this->actingAs($admin)
        ->post(route('admin.menu.update', $menu), [
            '_method' => 'patch',
            'name' => 'Menu Baru',
            'description' => 'Deskripsi baru.',
            'price' => 20000,
            'stockQuantity' => 11,
            'imageFile' => UploadedFile::fake()->image('updated-menu.png'),
        ])
        ->assertRedirect(route('admin.menu.index'));

    $this->assertDatabaseHas('menu_items', [
        'id' => $menu->id,
        'name' => 'Menu Baru',
    ]);
    expect($menu->fresh()->image_url)->toStartWith('/storage/menu-images/');
    $this->assertDatabaseHas('stocks', [
        'menu_item_id' => $menu->id,
        'quantity' => 11,
    ]);
});

test('admin can delete menu item', function () {
    $admin = User::factory()->admin()->create();
    $menu = MenuItem::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.menu.destroy', $menu))
        ->assertRedirect(route('admin.menu.index'));

    $this->assertModelMissing($menu);
});

test('admin can create a menu item for all outlets', function () {
    $admin = User::factory()->admin()->create();
    $firstOutlet = Outlet::factory()->create();
    $secondOutlet = Outlet::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.menu.store'), [
            'name' => 'Air Mineral',
            'description' => 'Botol',
            'price' => 5000,
            'outletId' => 'all',
            'initialStockQuantity' => 4,
        ])
        ->assertRedirect(route('admin.menu.index'));

    $this->assertDatabaseHas('menu_items', [
        'name' => 'Air Mineral',
        'outlet_id' => $firstOutlet->id,
    ]);
    $this->assertDatabaseHas('menu_items', [
        'name' => 'Air Mineral',
        'outlet_id' => $secondOutlet->id,
    ]);
    expect(MenuItem::query()->where('name', 'Air Mineral')->count())->toBe(2);
});

test('admin can view and update stock management', function () {
    $admin = User::factory()->admin()->create();
    $outlet = Outlet::factory()->create();
    $menu = MenuItem::factory()->for($outlet)->create(['name' => 'Es Teh']);
    Stock::factory()->for($menu)->create(['quantity' => 2]);

    $this->actingAs($admin)
        ->get(route('admin.stock.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/stock/index')
            ->has('menus.data', 1)
            ->where('menus.data.0.name', 'Es Teh')
            ->where('menus.data.0.stockQuantity', 2)
        );

    $this->actingAs($admin)
        ->patch(route('admin.menu.stock.update', $menu), [
            'quantity' => 9,
        ])
        ->assertRedirect(route('admin.stock.index'));

    $this->assertDatabaseHas('stocks', [
        'menu_item_id' => $menu->id,
        'quantity' => 9,
    ]);
});

test('admin can manage user accounts with cashier outlet assignment', function () {
    $admin = User::factory()->admin()->create();
    $outlet = Outlet::factory()->create(['name' => 'Kantin Kasir']);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->has('users.data')
            ->has('outlets')
        );

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'username' => 'kasir_satu',
            'password' => 'password',
            'role' => 'Cashier',
            'fullName' => 'Kasir Satu',
            'outletId' => $outlet->id,
        ])
        ->assertRedirect(route('admin.users.index'));

    $cashier = User::query()->where('username', 'kasir_satu')->firstOrFail();

    expect($cashier->outlet_id)->toBe($outlet->id);

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $cashier), [
            'username' => 'user_satu',
            'password' => '',
            'role' => 'Customer',
            'fullName' => 'User Satu',
            'outletId' => $outlet->id,
        ])
        ->assertRedirect(route('admin.users.index'));

    expect($cashier->fresh()->outlet_id)->toBeNull();

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $cashier))
        ->assertRedirect(route('admin.users.index'));

    $this->assertModelMissing($cashier);
});
