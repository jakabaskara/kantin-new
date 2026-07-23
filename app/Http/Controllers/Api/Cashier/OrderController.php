<?php

namespace App\Http\Controllers\Api\Cashier;

use App\Http\Controllers\Controller;
use App\Http\Resources\OutletResource;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function incoming(Request $request): JsonResponse
    {
        $user = $request->user();
        $user?->loadMissing('outlet');
        $outletId = $user?->outlet_id;

        $orders = $outletId
            ? Transaction::query()
                ->with(['items.menuItem:id,name', 'outlet:id,name,location', 'user:id,username,full_name'])
                ->where('outlet_id', $outletId)
                ->whereIn('order_status', [
                    Transaction::ORDER_STATUS_RECEIVED,
                    Transaction::ORDER_STATUS_PREPARING,
                    Transaction::ORDER_STATUS_READY,
                ])
                ->oldest()
                ->limit(50)
                ->get()
            : collect();

        return response()->json([
            'data' => [
                'orders' => TransactionResource::collection($orders)->resolve(),
                'outlet' => $user?->outlet
                    ? OutletResource::make($user->outlet)->resolve()
                    : null,
                'stats' => [
                    'received' => $orders->where('order_status', Transaction::ORDER_STATUS_RECEIVED)->count(),
                    'preparing' => $orders->where('order_status', Transaction::ORDER_STATUS_PREPARING)->count(),
                    'ready' => $orders->where('order_status', Transaction::ORDER_STATUS_READY)->count(),
                ],
            ],
        ]);
    }
}
