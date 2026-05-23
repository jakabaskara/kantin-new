<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreOrderRequest;
use App\Http\Resources\TransactionResource;
use App\Models\MenuItem;
use App\Models\Stock;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();
        $createdId = request()->integer('created');

        $orders = Transaction::query()
            ->with(['items.menuItem:id,name', 'outlet:id,name,location', 'user:id,username,full_name'])
            ->where('user_id', $user->id)
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('customer/orders/index', [
            'orders' => TransactionResource::collection($orders)->resolve(),
            'createdOrderId' => $createdId > 0 ? $createdId : null,
        ]);
    }

    public function store(StoreOrderRequest $request): RedirectResponse
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

        $transactionId = DB::transaction(function () use ($items, $user): int {
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

            return $transaction->id;
        });

        return to_route('customer.orders.index', ['created' => $transactionId])
            ->with('success', 'Pesanan berhasil dibuat.');
    }
}
