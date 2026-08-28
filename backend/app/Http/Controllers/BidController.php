<?php

namespace App\Http\Controllers;

use App\Events\BidPlaced;
use App\Models\Bid;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BidController extends Controller
{
    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'gt:0'],
        ]);

        return DB::transaction(function () use ($product, $validated) {

            /*
             * REFRESH PRODUCT
             */

            $product->refresh();

            /*
             * CHECK IF ALREADY ENDED
             */

            if ($product->status === 'ended') {
                return response()->json([
                    'message' => 'Auction has ended.',
                ], 422);
            }

            /*
             * CHECK AUCTION EXPIRY
             *
             * Backend is the final authority.
             *
             * Once now() >= ends_at,
             * no more bids are accepted.
             */

            if (
                $product->status === 'active' &&
                $product->ends_at &&
                now()->greaterThanOrEqualTo($product->ends_at)
            ) {
                $product->update([
                    'status' => 'ended',
                ]);

                return response()->json([
                    'message' => 'Auction has ended.',
                ], 422);
            }

            /*
             * CHECK BID AMOUNT
             */

            $currentPrice = (float) $product->current_price;
            $bidAmount = (float) $validated['amount'];

            if ($bidAmount <= $currentPrice) {
                return response()->json([
                    'message' => 'Bid amount must be higher than current bid.',
                ], 422);
            }

            /*
             * FIND / CREATE USER
             *
             * No login.
             * No email.
             * No password.
             *
             * The bidder is identified only by name.
             *
             * If Olivia already exists, use Olivia.
             * If Alex does not exist, create Alex.
             */

            $user = User::firstOrCreate([
                'name' => trim($validated['name']),
            ]);

            /*
             * FIRST BID
             *
             * pending -> active
             *
             * The 60-second timer starts only here.
             */

            if ($product->status === 'pending') {

                $startedAt = now();

                $product->update([
                    'status' => 'active',
                    'started_at' => $startedAt,
                    'ends_at' => $startedAt->copy()->addSeconds(60),
                    'current_price' => $bidAmount,
                ]);
            }

            /*
             * LATER BID
             *
             * DO NOT change:
             *
             * started_at
             * ends_at
             *
             * Only update current price.
             */

            else {

                $product->update([
                    'current_price' => $bidAmount,
                ]);
            }

            /*
             * CREATE BID
             */

            $bid = Bid::create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'amount' => $bidAmount,
            ]);

            event(new BidPlaced($bid));

            /*
             * LOAD LATEST PRODUCT
             */

            $product->refresh();

            $product->load([
                'bids' => function ($query) {
                    $query
                        ->with('user')
                        ->orderByDesc('amount')
                        ->orderByDesc('id');
                },
            ]);

            /*
             * RETURN
             */

            return response()->json([
                'message' => 'Bid placed successfully.',
                'product' => $product,
            ]);
        });
    }
}