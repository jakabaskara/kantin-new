<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cashier\UpdateOrderStatusRequest;
use App\Models\Stock;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusController extends Controller
{
    public function update(UpdateOrderStatusRequest $request, Transaction $transaction): RedirectResponse
    {
        $validated = $request->validated();
        $nextStatus = (int) $validated['status'];

        DB::transaction(function () use ($nextStatus, $transaction): void {
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
        });

        $message = match ($nextStatus) {
            Transaction::ORDER_STATUS_PREPARING => 'Pesanan mulai diproses.',
            Transaction::ORDER_STATUS_READY => 'Pesanan siap diambil.',
            Transaction::ORDER_STATUS_COMPLETED => 'Pesanan selesai.',
            Transaction::ORDER_STATUS_CANCELLED => 'Pesanan dibatalkan dan stok dikembalikan.',
            default => 'Status pesanan berhasil diperbarui.',
        };

        return back()->with('success', $message);
    }
}
