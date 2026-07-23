<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreOutletRequest;
use App\Http\Requests\Admin\UpdateOutletRequest;
use App\Http\Resources\OutletResource;
use App\Models\Outlet;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class OutletController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Outlet::class);

        $outlets = Outlet::query()
            ->withCount('menuItems')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => OutletResource::collection($outlets)->resolve(),
        ]);
    }

    public function store(StoreOutletRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $outlet = Outlet::query()->create([
            'name' => $validated['name'],
            'location' => $validated['location'] ?? null,
            'qris_image_url' => $validated['qrisImageUrl'] ?? null,
        ]);

        $outlet->loadCount('menuItems');

        return response()->json([
            'message' => 'Outlet berhasil dibuat.',
            'data' => OutletResource::make($outlet)->resolve(),
        ], 201);
    }

    public function update(UpdateOutletRequest $request, Outlet $outlet): JsonResponse
    {
        $validated = $request->validated();

        $outlet->update([
            'name' => $validated['name'],
            'location' => $validated['location'] ?? null,
            'qris_image_url' => $validated['qrisImageUrl'] ?? null,
        ]);

        $outlet->loadCount('menuItems');

        return response()->json([
            'message' => 'Outlet berhasil diperbarui.',
            'data' => OutletResource::make($outlet)->resolve(),
        ]);
    }
}
