<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class BiddingSeeder extends Seeder
{
    public function run(): void
    {
        /*
         * Current user
         *
         * There is no login system in this assignment.
         * Olivia represents the current user.
         */
        User::create([
            'name' => 'Olivia',
        ]);

        /*
         * Initial auction product
         */
        Product::create([
            'name' => 'iPhone 17 Pro',
            'description' => 'Latest iPhone model for bidding.',
            'starting_price' => 3000.00,
            'current_price' => 3000.00,
            'status' => 'pending',
            'started_at' => null,
            'ends_at' => null,
        ]);
    }
}