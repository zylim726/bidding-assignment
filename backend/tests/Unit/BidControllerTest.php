<?php

namespace Tests\Unit;

use App\Http\Controllers\BidController;
use App\Models\Bid;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class BidControllerTest extends TestCase
{
    use RefreshDatabase;

    /*
     * ============================================================
     * FIRST BID
     * ============================================================
     *
     * The first valid bid should:
     * - change pending -> active
     * - set started_at
     * - set ends_at to 60 seconds later
     * - update current price
     * - create a bid
     */
    public function test_first_bid_starts_the_auction(): void
    {
        Event::fake();

        $product = Product::factory()->create([
            'status' => 'pending',
            'starting_price' => 100,
            'current_price' => 100,
            'started_at' => null,
            'ends_at' => null,
        ]);

        $request = Request::create(
            '/api/products/' . $product->id . '/bids',
            'POST',
            [
                'name' => 'Olivia',
                'amount' => 120,
            ]
        );

        $controller = new BidController();

        $response = $controller->store(
            $request,
            $product
        );

        $this->assertEquals(
            200,
            $response->getStatusCode()
        );

        $product->refresh();

        $this->assertEquals(
            'active',
            $product->status
        );

        $this->assertNotNull(
            $product->started_at
        );

        $this->assertNotNull(
            $product->ends_at
        );

        $this->assertEquals(
            120,
            (float) $product->current_price
        );

        $this->assertEquals(
            60,
            $product->started_at->diffInSeconds(
                $product->ends_at
            )
        );

        $this->assertDatabaseHas('bids', [
            'product_id' => $product->id,
            'amount' => 120,
        ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Olivia',
        ]);
    }


    /*
     * ============================================================
     * LATER BID
     * ============================================================
     *
     * A later bid should:
     * - keep the auction active
     * - keep the original started_at
     * - keep the original ends_at
     * - update current price
     */
    public function test_later_bid_keeps_the_same_end_time(): void
    {
        Event::fake();

        $startedAt = now()->subSeconds(20);

        $endsAt = $startedAt->copy()->addSeconds(60);

        $product = Product::factory()->create([
            'status' => 'active',
            'starting_price' => 100,
            'current_price' => 120,
            'started_at' => $startedAt,
            'ends_at' => $endsAt,
        ]);

        $request = Request::create(
            '/api/products/' . $product->id . '/bids',
            'POST',
            [
                'name' => 'Alex',
                'amount' => 150,
            ]
        );

        $controller = new BidController();

        $response = $controller->store(
            $request,
            $product
        );

        $this->assertEquals(
            200,
            $response->getStatusCode()
        );

        $product->refresh();

        $this->assertEquals(
            'active',
            $product->status
        );

        $this->assertEquals(
            $startedAt->timestamp,
            $product->started_at->timestamp
        );

        $this->assertEquals(
            $endsAt->timestamp,
            $product->ends_at->timestamp
        );

        $this->assertEquals(
            150,
            (float) $product->current_price
        );

        $this->assertDatabaseHas('bids', [
            'product_id' => $product->id,
            'amount' => 150,
        ]);
    }


    /*
     * ============================================================
     * BID MUST BE HIGHER
     * ============================================================
     *
     * A bid equal to or lower than the current price
     * should be rejected.
     */
    public function test_bid_must_be_higher_than_current_price(): void
    {
        Event::fake();

        $product = Product::factory()->create([
            'status' => 'active',
            'starting_price' => 100,
            'current_price' => 120,
            'started_at' => now(),
            'ends_at' => now()->addSeconds(60),
        ]);

        $request = Request::create(
            '/api/products/' . $product->id . '/bids',
            'POST',
            [
                'name' => 'Olivia',
                'amount' => 110,
            ]
        );

        $controller = new BidController();

        $response = $controller->store(
            $request,
            $product
        );

        $this->assertEquals(
            422,
            $response->getStatusCode()
        );

        $responseData = $response->getData(true);

        $this->assertEquals(
            'Bid amount must be higher than current bid.',
            $responseData['message']
        );

        $this->assertDatabaseMissing('bids', [
            'product_id' => $product->id,
            'amount' => 110,
        ]);
    }


    /*
     * ============================================================
     * EXPIRED AUCTION
     * ============================================================
     *
     * If the auction has passed ends_at:
     * - the auction becomes ended
     * - the new bid is rejected
     */
    public function test_expired_auction_rejects_bid(): void
    {
        Event::fake();

        $product = Product::factory()->create([
            'status' => 'active',
            'starting_price' => 100,
            'current_price' => 150,
            'started_at' => now()->subSeconds(61),
            'ends_at' => now()->subSecond(),
        ]);

        $request = Request::create(
            '/api/products/' . $product->id . '/bids',
            'POST',
            [
                'name' => 'Olivia',
                'amount' => 200,
            ]
        );

        $controller = new BidController();

        $response = $controller->store(
            $request,
            $product
        );

        $this->assertEquals(
            422,
            $response->getStatusCode()
        );

        $responseData = $response->getData(true);

        $this->assertEquals(
            'Auction has ended.',
            $responseData['message']
        );

        $product->refresh();

        $this->assertEquals(
            'ended',
            $product->status
        );

        $this->assertDatabaseMissing('bids', [
            'product_id' => $product->id,
            'amount' => 200,
        ]);
    }
}