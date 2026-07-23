<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MenuIndexRequest;
use App\Http\Requests\Admin\StoreMenuItemRequest;
use App\Http\Requests\Admin\UpdateMenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OutletResource;
use App\Models\MenuItem;
use App\Models\Outlet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class MenuItemController extends Controller
{
    public function index(MenuIndexRequest $request): JsonResponse
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

    public function store(StoreMenuItemRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $imageUrl = $this->resolveImageUrl($request->file('imageFile'));

        $created = DB::transaction(function () use ($imageUrl, $validated) {
            $outletIds = $validated['outletId'] === 'all'
                ? Outlet::query()->orderBy('name')->pluck('id')
                : collect([(int) $validated['outletId']]);

            return $outletIds->map(function (int $outletId) use ($imageUrl, $validated): MenuItem {
                $menuItem = MenuItem::query()->create([
                    'outlet_id' => $outletId,
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'price' => $validated['price'],
                    'image_url' => $imageUrl,
                ]);

                $menuItem->stock()->create([
                    'quantity' => $validated['initialStockQuantity'] ?? 0,
                ]);

                return $menuItem->load(['outlet:id,name', 'stock:menu_item_id,quantity']);
            });
        });

        return response()->json([
            'message' => 'Menu berhasil dibuat.',
            'data' => MenuItemResource::collection($created)->resolve(),
        ], 201);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validated();
        $oldImageUrl = $menuItem->image_url;
        $newImageUrl = $this->resolveImageUrl(
            $request->file('imageFile'),
            $menuItem->image_url,
        );

        DB::transaction(function () use ($menuItem, $newImageUrl, $validated): void {
            $menuItem->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'price' => $validated['price'],
                'image_url' => $newImageUrl,
            ]);

            if (array_key_exists('stockQuantity', $validated)) {
                $menuItem->stock()->updateOrCreate(
                    ['menu_item_id' => $menuItem->id],
                    ['quantity' => $validated['stockQuantity'] ?? 0],
                );
            }
        });

        if ($request->hasFile('imageFile')) {
            $this->deleteStoredImage($oldImageUrl);
        }

        $menuItem->load(['outlet:id,name', 'stock:menu_item_id,quantity']);

        return response()->json([
            'message' => 'Menu berhasil diperbarui.',
            'data' => MenuItemResource::make($menuItem)->resolve(),
        ]);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        Gate::authorize('delete', $menuItem);

        $imageUrl = $menuItem->image_url;

        $menuItem->delete();
        $this->deleteStoredImage($imageUrl);

        return response()->json([
            'message' => 'Menu berhasil dihapus.',
        ]);
    }

    private function resolveImageUrl(?UploadedFile $imageFile, ?string $imageUrl = null): ?string
    {
        if (! $imageFile) {
            return $imageUrl;
        }

        $path = $imageFile->store('menu-images', 'public');

        return "/storage/{$path}";
    }

    private function deleteStoredImage(?string $imageUrl): void
    {
        if (! $imageUrl || ! str_starts_with($imageUrl, '/storage/')) {
            return;
        }

        if (MenuItem::query()->where('image_url', $imageUrl)->exists()) {
            return;
        }

        Storage::disk('public')->delete(substr($imageUrl, strlen('/storage/')));
    }
}
