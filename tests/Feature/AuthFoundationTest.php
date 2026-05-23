<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('login page is rendered', function () {
    $this->get('/login')->assertSuccessful();
});

test('registration creates a customer account and redirects to login', function () {
    $this->post('/register', [
        'username' => 'customer_one',
        'fullName' => 'Customer One',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('login'));

    $this->assertDatabaseHas('users', [
        'username' => 'customer_one',
        'full_name' => 'Customer One',
        'role' => 'Customer',
    ]);
});

test('admin users are redirected to the admin shell after login', function () {
    User::factory()->admin()->create([
        'username' => 'admin_one',
        'password' => 'password',
    ]);

    $this->post('/login', [
        'username' => 'admin_one',
        'password' => 'password',
    ])->assertRedirect(route('admin.dashboard'));
});

test('cashier users are redirected to the cashier shell after login', function () {
    User::factory()->cashier()->create([
        'username' => 'cashier_one',
        'password' => 'password',
    ]);

    $this->post('/login', [
        'username' => 'cashier_one',
        'password' => 'password',
    ])->assertRedirect(route('cashier.orders.incoming'));
});

test('customer users are redirected to the customer shell after login', function () {
    User::factory()->create([
        'username' => 'customer_two',
        'password' => 'password',
    ]);

    $this->post('/login', [
        'username' => 'customer_two',
        'password' => 'password',
    ])->assertRedirect(route('customer.menu.index'));
});

test('role middleware redirects unauthorized users to unauthorized page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/admin')
        ->assertRedirect(route('unauthorized'));
});
