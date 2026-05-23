<?php

namespace Database\Factories;

use App\Models\Outlet;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'outlet_id' => Outlet::factory(),
            'customer_name' => fake()->name(),
            'total_amount' => fake()->numberBetween(10000, 100000),
            'cash_received_amount' => null,
            'change_amount' => null,
            'payment_method' => Transaction::PAYMENT_METHOD_COD,
            'payment_status' => Transaction::PAYMENT_STATUS_PAID,
            'order_status' => Transaction::ORDER_STATUS_RECEIVED,
            'payment_proof_path' => null,
        ];
    }
}
