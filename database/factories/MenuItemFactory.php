<?php

namespace Database\Factories;

use App\Models\MenuItem;
use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuItem>
 */
class MenuItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'outlet_id' => Outlet::factory(),
            'name' => fake()->words(2, true),
            'description' => fake()->sentence(8),
            'price' => fake()->numberBetween(8000, 35000),
            'image_url' => null,
        ];
    }
}
