<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\MenuIndexRequest;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OutletResource;
use App\Models\MenuItem;
use App\Models\Outlet;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
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
            ->orderBy('name')
            ->get();

        $outlets = Outlet::query()
            ->orderBy('name')
            ->get(['id', 'name', 'location', 'qris_image_url']);

        return Inertia::render('customer/menu/index', [
            'menus' => MenuItemResource::collection($menus)->resolve(),
            'outlets' => OutletResource::collection($outlets)->resolve(),
            'filters' => [
                'search' => $search,
                'outlet' => $outletId ? (int) $outletId : null,
            ],
        ]);
    }
}
