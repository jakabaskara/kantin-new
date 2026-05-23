<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customerName' => $this->customer_name,
            'totalAmount' => (float) $this->total_amount,
            'cashReceivedAmount' => $this->cash_received_amount !== null
                ? (float) $this->cash_received_amount
                : null,
            'changeAmount' => $this->change_amount !== null
                ? (float) $this->change_amount
                : null,
            'paymentMethod' => $this->payment_method,
            'paymentStatus' => $this->payment_status,
            'orderStatus' => $this->order_status,
            'status' => $this->order_status,
            'outletId' => $this->outlet_id,
            'userId' => $this->user_id,
            'outletName' => $this->when(
                $this->relationLoaded('outlet'),
                fn () => $this->outlet?->name,
                null,
            ),
            'customerDisplayName' => $this->customer_name,
            'createdAt' => $this->created_at?->toISOString(),
            'items' => $this->when(
                $this->relationLoaded('items'),
                fn () => $this->items->map(fn ($item): array => [
                    'id' => $item->id,
                    'menuItemId' => $item->menu_item_id,
                    'menuName' => $item->relationLoaded('menuItem') ? $item->menuItem?->name : null,
                    'quantity' => $item->quantity,
                    'unitPrice' => (float) $item->unit_price,
                    'subtotal' => $item->subtotal,
                ])->all(),
            ),
        ];
    }
}
