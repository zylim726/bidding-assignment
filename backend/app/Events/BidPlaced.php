<?php

namespace App\Events;

use App\Models\Bid;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BidPlaced implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Bid $bid
    ) {
        $this->bid->load('user');
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('product.' . $this->bid->product_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'bid.placed';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->bid->id,
            'amount' => $this->bid->amount,
            'created_at' => $this->bid->created_at,
            'user' => [
                'id' => $this->bid->user->id,
                'name' => $this->bid->user->name,
            ],
        ];
    }
}