<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MenuIndexRequest;
use App\Http\Requests\Admin\StoreMenuItemRequest;
use App\Http\Requests\Admin\UpdateMenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OutletResource;
use App\Models\MenuItem;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MenuItemController extends Controller
{
    public function index(MenuIndexRequest $request): Response
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
            ->withQueryString()
            ->through(fn (MenuItem $menuItem) => MenuItemResource::make($menuItem)->resolve());

        $outlets = Outlet::query()
            ->orderBy('name')
            ->get(['id', 'name', 'location', 'qris_image_url']);

        return Inertia::render('admin/menu/index', [
            'menus' => $menus,
            'outlets' => OutletResource::collection($outlets)->resolve(),
            'filters' => [
                'search' => $search,
                'outlet' => $outletId ? (int) $outletId : null,
            ],
        ]);
    }

    public function store(StoreMenuItemRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $imageUrl = $this->resolveImageUrl($request->file('imageFile'));

        DB::transaction(function () use ($imageUrl, $validated): void {
            $outletIds = $validated['outletId'] === 'all'
                ? Outlet::query()->orderBy('name')->pluck('id')
                : collect([(int) $validated['outletId']]);

            $outletIds->each(function (int $outletId) use ($imageUrl, $validated): void {
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
            });
        });

        return redirect()->route('admin.menu.index');
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): RedirectResponse
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

        return redirect()->route('admin.menu.index');
    }

    public function destroy(MenuItem $menuItem): RedirectResponse
    {
        Gate::authorize('delete', $menuItem);

        $imageUrl = $menuItem->image_url;

        $menuItem->delete();
        $this->deleteStoredImage($imageUrl);

        return redirect()->route('admin.menu.index');
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
