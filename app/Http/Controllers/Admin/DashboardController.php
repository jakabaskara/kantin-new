<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OutletResource;
use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Stock;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $lowStockMenus = MenuItem::query()
            ->with(['outlet:id,name', 'stock:menu_item_id,quantity'])
            ->whereHas('stock', fn ($query) => $query->where('quantity', '<=', 5))
            ->orderBy(
                Stock::query()
                    ->select('quantity')
                    ->whereColumn('stocks.menu_item_id', 'menu_items.id')
                    ->limit(1),
            )
            ->limit(6)
            ->get();

        $recentOutlets = Outlet::query()
            ->withCount('menuItems')
            ->latest()
            ->limit(4)
            ->get();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'outlets' => Outlet::query()->count(),
                'menus' => MenuItem::query()->count(),
                'stockItems' => Stock::query()->count(),
                'lowStockItems' => Stock::query()->where('quantity', '<=', 5)->count(),
                'users' => User::query()->count(),
                'cashiers' => User::query()->whereIn('role', ['Cashier', 'Kasir'])->count(),
            ],
            'lowStockMenus' => MenuItemResource::collection($lowStockMenus)->resolve(),
            'recentOutlets' => OutletResource::collection($recentOutlets)->resolve(),
        ]);
    }
}
