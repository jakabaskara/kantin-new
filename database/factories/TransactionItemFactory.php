<?php

namespace Database\Factories;

use App\Models\MenuItem;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TransactionItem>
 */
class TransactionItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'transaction_id' => Transaction::factory(),
            'menu_item_id' => MenuItem::factory(),
            'quantity' => fake()->numberBetween(1, 5),
            'unit_price' => fake()->numberBetween(8000, 35000),
        ];
    }
}
