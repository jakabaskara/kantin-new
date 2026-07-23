<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreOrderRequest;
use App\Http\Resources\TransactionResource;
use App\Models\MenuItem;
use App\Models\Stock;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $orders = Transaction::query()
            ->with(['items.menuItem:id,name', 'outlet:id,name,location', 'user:id,username,full_name'])
            ->where('user_id', $user->id)
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'data' => TransactionResource::collection($orders)->resolve(),
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $items = collect($validated['items'])
            ->groupBy('menuItemId')
            ->map(fn (Collection $group, int|string $menuItemId): array => [
                'menuItemId' => (int) $menuItemId,
                'quantity' => $group->sum('quantity'),
            ])
            ->values();

        $transaction = DB::transaction(function () use ($items, $user): Transaction {
            $menuIds = $items->pluck('menuItemId')->all();

            $menus = MenuItem::query()
                ->with('outlet:id,name')
                ->whereIn('id', $menuIds)
                ->get()
                ->keyBy('id');

            if ($menus->count() !== count($menuIds)) {
                throw ValidationException::withMessages([
                    'items' => 'Menu yang dipilih tidak valid.',
                ]);
            }

            $outletIds = $menus->pluck('outlet_id')->unique();

            if ($outletIds->count() !== 1) {
                throw ValidationException::withMessages([
                    'items' => 'Pesanan sementara hanya bisa berisi menu dari satu outlet.',
                ]);
            }

            $stocks = Stock::query()
                ->whereIn('menu_item_id', $menuIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('menu_item_id');

            $totalAmount = 0;

            foreach ($items as $item) {
                $menu = $menus->get($item['menuItemId']);
                $stock = $stocks->get($item['menuItemId']);

                if (! $stock) {
                    throw ValidationException::withMessages([
                        'items' => "Stok untuk {$menu->name} belum tersedia.",
                    ]);
                }

                if ($stock->quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$menu->name} tidak mencukupi.",
                    ]);
                }

                $totalAmount += (float) $menu->price * $item['quantity'];
            }

            $transaction = Transaction::query()->create([
                'user_id' => $user->id,
                'outlet_id' => (int) $outletIds->first(),
                'customer_name' => $user->full_name ?: $user->username,
                'total_amount' => $totalAmount,
                'payment_method' => Transaction::PAYMENT_METHOD_BYPASS,
                'payment_status' => Transaction::PAYMENT_STATUS_PAID,
                'order_status' => Transaction::ORDER_STATUS_RECEIVED,
            ]);

            foreach ($items as $item) {
                $menu = $menus->get($item['menuItemId']);
                $stock = $stocks->get($item['menuItemId']);

                $transaction->items()->create([
                    'menu_item_id' => $menu->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $menu->price,
                ]);

                $stock->decrement('quantity', $item['quantity']);
            }

            return $transaction->load(['items.menuItem:id,name', 'outlet:id,name,location', 'user:id,username,full_name']);
        });

        return response()->json([
            'message' => 'Pesanan berhasil dibuat.',
            'data' => TransactionResource::make($transaction)->resolve(),
        ], 201);
    }
}
