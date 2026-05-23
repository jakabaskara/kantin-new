<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreOutletRequest;
use App\Http\Requests\Admin\UpdateOutletRequest;
use App\Http\Resources\OutletResource;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OutletController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', Outlet::class);

        $outlets = Outlet::query()
            ->withCount('menuItems')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/outlets/index', [
            'outlets' => OutletResource::collection($outlets)->resolve(),
        ]);
    }

    public function store(StoreOutletRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Outlet::query()->create([
            'name' => $validated['name'],
            'location' => $validated['location'] ?? null,
            'qris_image_url' => $validated['qrisImageUrl'] ?? null,
        ]);

        return redirect()->route('admin.outlets.index');
    }

    public function update(UpdateOutletRequest $request, Outlet $outlet): RedirectResponse
    {
        $validated = $request->validated();

        $outlet->update([
            'name' => $validated['name'],
            'location' => $validated['location'] ?? null,
            'qris_image_url' => $validated['qrisImageUrl'] ?? null,
        ]);

        return redirect()->route('admin.outlets.index');
    }
}
