<?php

namespace App\Http\Controllers\Api\Cashier;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cashier\UpdateOrderStatusRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Stock;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusController extends Controller
{
    public function update(UpdateOrderStatusRequest $request, Transaction $transaction): JsonResponse
    {
        $validated = $request->validated();
        $nextStatus = (int) $validated['status'];

        $updated = DB::transaction(function () use ($nextStatus, $transaction): Transaction {
            $lockedTransaction = Transaction::query()
                ->with('items')
                ->lockForUpdate()
                ->findOrFail($transaction->id);

            if ($lockedTransaction->order_status === Transaction::ORDER_STATUS_CANCELLED) {
                throw ValidationException::withMessages([
                    'status' => 'Pesanan yang sudah dibatalkan tidak bisa diubah.',
                ]);
            }

            if ($nextStatus === Transaction::ORDER_STATUS_CANCELLED) {
                foreach ($lockedTransaction->items as $item) {
                    Stock::query()
                        ->where('menu_item_id', $item->menu_item_id)
                        ->increment('quantity', $item->quantity);
                }
            }

            $lockedTransaction->update([
                'order_status' => $nextStatus,
            ]);

            return $lockedTransaction->load(['items.menuItem:id,name', 'outlet:id,name,location', 'user:id,username,full_name']);
        });

        $message = match ($nextStatus) {
            Transaction::ORDER_STATUS_PREPARING => 'Pesanan mulai diproses.',
            Transaction::ORDER_STATUS_READY => 'Pesanan siap diambil.',
            Transaction::ORDER_STATUS_COMPLETED => 'Pesanan selesai.',
            Transaction::ORDER_STATUS_CANCELLED => 'Pesanan dibatalkan dan stok dikembalikan.',
            default => 'Status pesanan berhasil diperbarui.',
        };

        return response()->json([
            'message' => $message,
            'data' => TransactionResource::make($updated)->resolve(),
        ]);
    }
}
