<?php

namespace App\Events;

use App\Models\Quote;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuoteApproved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $quote;

    public function __construct(Quote $quote)
    {
        $this->quote = $quote->load('vendor');
    }

    public function broadcastOn(): Channel
    {
        return new Channel('tenant.' . $this->quote->tenant_id);
    }

    public function broadcastAs(): string
    {
        return 'quote.approved';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->quote->id,
            'vendor_id' => $this->quote->vendor_id,
            'vendor' => $this->quote->vendor->name ?? 'Unknown',
            'total' => $this->quote->total,
            'approved_at' => now()->toIso8601String(),
        ];
    }
}
