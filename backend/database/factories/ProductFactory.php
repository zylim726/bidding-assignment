<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Test Product',
            'description' => 'Test product description',
            'starting_price' => 100,
            'current_price' => 100,
            'status' => 'pending',
            'started_at' => null,
            'ends_at' => null,
        ];
    }
}