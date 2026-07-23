<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class RegisteredUserController extends Controller
{
    public function store(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::query()->create([
            'username' => $validated['username'],
            'full_name' => $validated['fullName'] ?? null,
            'name' => $validated['fullName'] ?? $validated['username'],
            'password' => Hash::make($validated['password']),
            'role' => 'Customer',
        ]);

        return response()->json([
            'message' => 'Registrasi berhasil. Silakan login.',
            'user' => UserResource::make($user)->resolve(),
        ], 201);
    }
}
