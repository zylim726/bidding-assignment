<?php

namespace Tests\Unit;

use App\Models\Bid;
use App\Models\Product;
use App\Models\User;
use App\Http\Controllers\ProductController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WinnerProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_highest_bidder_becomes_winner(): void
    {
        /*
         * Create ended product
         */
        $product = Product::factory()->create([
            'status' => 'ended',
            'starting_price' => 100,
            'current_price' => 200,
            'started_at' => now()->subSeconds(60),
            'ends_at' => now()->subSecond(),
        ]);

        /*
         * Create bidders
         *
         * No login system in this assignment.
         * Users only need a name.
         */
        $olivia = User::create([
            'name' => 'Olivia',
        ]);

        $alex = User::create([
            'name' => 'Alex',
        ]);

        /*
         * Alex bids RM150
         */
        Bid::create([
            'product_id' => $product->id,
            'user_id' => $alex->id,
            'amount' => 150,
        ]);

        /*
         * Olivia bids RM200
         */
        Bid::create([
            'product_id' => $product->id,
            'user_id' => $olivia->id,
            'amount' => 200,
        ]);

        /*
         * Call ProductController
         */
        $controller = new ProductController();

        $response = $controller->show($product);

        /*
         * Convert response to array
         */
        $data = $response->getData(true);

        /*
         * Winner should exist
         */
        $this->assertNotNull($data['winner']);

        /*
         * Olivia has the highest bid,
         * so Olivia should be the winner.
         */
        $this->assertEquals(
            $olivia->id,
            $data['winner']['id']
        );

        $this->assertEquals(
            'Olivia',
            $data['winner']['name']
        );

        /*
         * Winning price should be RM200.
         */
        $this->assertEquals(
            200,
            (float) $data['current_price']
        );
    }
}