<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;

uses(RefreshDatabase::class);

test('api login returns sanctum token and user', function () {
    User::factory()->create([
        'username' => 'customer_api',
        'password' => 'password',
        'full_name' => 'Customer API',
    ]);

    $this->postJson('/api/login', [
        'username' => 'customer_api',
        'password' => 'password',
    ])
        ->assertSuccessful()
        ->assertJsonPath('tokenType', 'Bearer')
        ->assertJsonPath('user.username', 'customer_api')
        ->assertJsonPath('user.role', 'Customer')
        ->assertJsonStructure(['token', 'user' => ['id', 'username', 'role']]);
});

test('api login rejects invalid credentials', function () {
    User::factory()->create([
        'username' => 'customer_api',
        'password' => 'password',
    ]);

    $this->postJson('/api/login', [
        'username' => 'customer_api',
        'password' => 'wrong',
    ])->assertUnprocessable();
});

test('api register creates customer account', function () {
    $this->postJson('/api/register', [
        'username' => 'new_customer',
        'fullName' => 'New Customer',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])
        ->assertCreated()
        ->assertJsonPath('user.role', 'Customer');

    $this->assertDatabaseHas('users', [
        'username' => 'new_customer',
        'role' => 'Customer',
    ]);
});

test('api me requires authentication', function () {
    $this->getJson('/api/me')->assertUnauthorized();
});

test('api me returns authenticated user', function () {
    $user = User::factory()->create(['username' => 'me_user']);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/me')
        ->assertSuccessful()
        ->assertJsonPath('data.username', 'me_user');
});

test('api logout revokes current token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('flutter')->plainTextToken;

    $this->withToken($token)
        ->postJson('/api/logout')
        ->assertSuccessful();

    expect(PersonalAccessToken::query()->count())->toBe(0);
});

test('api role middleware returns forbidden json for wrong role', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/admin')
        ->assertForbidden()
        ->assertJsonPath('message', 'Forbidden.');
});
