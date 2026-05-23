<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cashier\StoreCashTransactionRequest;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OutletResource;
use App\Http\Resources\TransactionResource;
use App\Models\MenuItem;
use App\Models\Stock;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CashPaymentController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();
        $outletId = $user?->outlet_id;
        $user?->loadMissing('outlet');

        /** @var Collection<int, MenuItem> $menus */
        $menus = $outletId
            ? MenuItem::query()
                ->with(['outlet:id,name', 'stock:menu_item_id,quantity'])
                ->where('outlet_id', $outletId)
                ->orderBy('name')
                ->get()
            : collect();

        $receipt = null;
        $recentTransactions = collect();

        if ($outletId) {
            $receiptId = request()->integer('receipt');

            $receipt = $receiptId > 0
                ? Transaction::query()
                    ->with(['items.menuItem:id,name', 'outlet:id,name,location'])
                    ->where('outlet_id', $outletId)
                    ->find($receiptId)
                : null;

            $recentTransactions = Transaction::query()
                ->with(['items.menuItem:id,name', 'outlet:id,name,location'])
                ->where('outlet_id', $outletId)
                ->latest()
                ->limit(5)
                ->get();
        }

        return Inertia::render('cashier/cash-payment', [
            'menus' => MenuItemResource::collection($menus)->resolve(),
            'outlet' => $user?->outlet
                ? OutletResource::make($user->outlet)->resolve()
                : null,
            'canSubmitCashTransaction' => $user?->can('createCash', Transaction::class) ?? false,
            'receipt' => $receipt ? TransactionResource::make($receipt)->resolve() : null,
            'recentTransactions' => TransactionResource::collection($recentTransactions)->resolve(),
        ]);
    }

    public function store(StoreCashTransactionRequest $request): RedirectResponse
    {
        $user = $request->user();
        Gate::authorize('createCash', Transaction::class);

        $validated = $request->validated();
        $items = collect($validated['items'])
            ->groupBy('menuItemId')
            ->map(fn (Collection $group, int|string $menuItemId): array => [
                'menuItemId' => (int) $menuItemId,
                'quantity' => $group->sum('quantity'),
            ])
            ->values();

        $transactionId = DB::transaction(function () use ($items, $user, $validated): int {
            $menuIds = $items->pluck('menuItemId')->all();

            $menus = MenuItem::query()
                ->where('outlet_id', $user->outlet_id)
                ->whereIn('id', $menuIds)
                ->get()
                ->keyBy('id');

            if ($menus->count() !== count($menuIds)) {
                throw ValidationException::withMessages([
                    'items' => 'Menu yang dipilih harus berasal dari outlet kasir.',
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

            $cashReceivedAmount = (float) $validated['cashReceivedAmount'];

            if ($cashReceivedAmount < $totalAmount) {
                throw ValidationException::withMessages([
                    'cashReceivedAmount' => 'Nominal bayar tidak boleh kurang dari total transaksi.',
                ]);
            }

            $transaction = Transaction::query()->create([
                'user_id' => $user->id,
                'outlet_id' => $user->outlet_id,
                'customer_name' => $validated['customerName'] ?? 'Pelanggan walk-in',
                'total_amount' => $totalAmount,
                'cash_received_amount' => $cashReceivedAmount,
                'change_amount' => $cashReceivedAmount - $totalAmount,
                'payment_method' => Transaction::PAYMENT_METHOD_COD,
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

        return to_route('cashier.cash-payment.index', ['receipt' => $transactionId])
            ->with('success', 'Transaksi tunai berhasil disimpan.');
    }
}
