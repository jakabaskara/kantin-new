<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StockIndexRequest;
use App\Http\Requests\Admin\UpdateStockRequest;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OutletResource;
use App\Models\MenuItem;
use App\Models\Outlet;
use Illuminate\Http\JsonResponse;

class StockController extends Controller
{
    public function index(StockIndexRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $search = trim((string) ($filters['search'] ?? ''));
        $outletId = $filters['outlet'] ?? null;

        $menus = MenuItem::query()
            ->with([
                'outlet:id,name',
                'stock:menu_item_id,quantity',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $escapedSearch = addcslashes($search, '%_\\');

                $query->where(function ($query) use ($escapedSearch): void {
                    $query
                        ->where('name', 'like', "%{$escapedSearch}%")
                        ->orWhere('description', 'like', "%{$escapedSearch}%");
                });
            })
            ->when($outletId, fn ($query) => $query->where('outlet_id', $outletId))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $outlets = Outlet::query()
            ->orderBy('name')
            ->get(['id', 'name', 'location', 'qris_image_url']);

        return response()->json([
            'data' => [
                'menus' => MenuItemResource::collection($menus->items())->resolve(),
                'outlets' => OutletResource::collection($outlets)->resolve(),
                'filters' => [
                    'search' => $search,
                    'outlet' => $outletId ? (int) $outletId : null,
                ],
            ],
            'meta' => [
                'currentPage' => $menus->currentPage(),
                'lastPage' => $menus->lastPage(),
                'perPage' => $menus->perPage(),
                'total' => $menus->total(),
            ],
        ]);
    }

    public function update(UpdateStockRequest $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validated();

        $menuItem->stock()->updateOrCreate(
            ['menu_item_id' => $menuItem->id],
            ['quantity' => $validated['quantity']],
        );

        $menuItem->load(['outlet:id,name', 'stock:menu_item_id,quantity']);

        return response()->json([
            'message' => 'Stok berhasil diperbarui.',
            'data' => MenuItemResource::make($menuItem)->resolve(),
        ]);
    }
}
