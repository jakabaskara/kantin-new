<?php

namespace App\Models;

use Database\Factories\TransactionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    public const PAYMENT_METHOD_COD = 'COD';

    public const PAYMENT_METHOD_BYPASS = 'BYPASS';

    public const PAYMENT_STATUS_PAID = 'paid';

    public const ORDER_STATUS_RECEIVED = 1;

    public const ORDER_STATUS_PREPARING = 2;

    public const ORDER_STATUS_READY = 3;

    public const ORDER_STATUS_COMPLETED = 4;

    public const ORDER_STATUS_CANCELLED = 5;

    /** @use HasFactory<TransactionFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'outlet_id',
        'customer_name',
        'total_amount',
        'cash_received_amount',
        'change_amount',
        'payment_method',
        'payment_status',
        'order_status',
        'payment_proof_path',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'cash_received_amount' => 'decimal:2',
            'change_amount' => 'decimal:2',
            'order_status' => 'integer',
        ];
    }
}
