<?php

namespace App\Events;

use App\Models\ServiceRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ServiceRequestCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $serviceRequest;

    public function __construct(ServiceRequest $serviceRequest)
    {
        $this->serviceRequest = $serviceRequest->load('vehicle');
    }

    public function broadcastOn(): Channel
    {
        return new Channel('tenant.' . $this->serviceRequest->tenant_id);
    }

    public function broadcastAs(): string
    {
        return 'service-request.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->serviceRequest->id,
            'vehicle_id' => $this->serviceRequest->vehicle_id,
            'vehicle' => $this->serviceRequest->vehicle->plate,
            'priority' => $this->serviceRequest->priority,
            'issue_description' => $this->serviceRequest->issue_description,
            'created_at' => $this->serviceRequest->created_at->toIso8601String(),
        ];
    }
}
