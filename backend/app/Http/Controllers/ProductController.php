<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * Display the product and current auction information.
     */
    public function show(Product $product): JsonResponse
    {
        /*
         * CHECK AUCTION EXPIRY
         */

        if (
            $product->status === 'active' &&
            $product->ends_at &&
            now()->greaterThanOrEqualTo($product->ends_at)
        ) {
            $product->update([
                'status' => 'ended',
            ]);

            $product->refresh();
        }

        /*
         * LOAD BIDS
         */

        $product->load([
            'bids' => function ($query) {
                $query
                    ->with('user')
                    ->orderByDesc('amount')
                    ->orderByDesc('id');
            },
        ]);

        /*
         * FIND WINNER
         */

        $winner = null;

        if ($product->status === 'ended') {

            $winningBid = $product->bids->first();

            if ($winningBid && $winningBid->user) {
                $winner = [
                    'id' => $winningBid->user->id,
                    'name' => $winningBid->user->name,
                ];
            }
        }

        /*
         * RETURN PRODUCT
         */

        return response()->json([
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'starting_price' => $product->starting_price,
            'current_price' => $product->current_price,
            'status' => $product->status,
            'started_at' => $product->started_at,
            'ends_at' => $product->ends_at,
            'bids' => $product->bids,
            'winner' => $winner,
        ]);
    }

    /**
     * Reset auction to its initial state for testing.
     */
    public function reset(Product $product): JsonResponse
    {
        /*
         * REMOVE ALL BIDS FOR THIS PRODUCT
         */
        $product->bids()->delete();

        /*
         * RESET AUCTION TO INITIAL STATE
         */
        $product->update([
            'current_price' => $product->starting_price,
            'status' => 'pending',
            'started_at' => null,
            'ends_at' => null,
        ]);

        /*
         * REFRESH PRODUCT
         */
        $product->refresh();

        /*
         * LOAD EMPTY BID HISTORY
         */
        $product->load([
            'bids' => function ($query) {
                $query
                    ->with('user')
                    ->orderByDesc('amount')
                    ->orderByDesc('id');
            },
        ]);

        return response()->json([
            'message' => 'Auction reset successfully.',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'starting_price' => $product->starting_price,
                'current_price' => $product->current_price,
                'status' => $product->status,
                'started_at' => $product->started_at,
                'ends_at' => $product->ends_at,
                'bids' => $product->bids,
                'winner' => null,
            ],
        ]);
    }
}