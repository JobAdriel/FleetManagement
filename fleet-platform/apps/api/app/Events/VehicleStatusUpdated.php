<?php

namespace App\Events;

use App\Models\Vehicle;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehicleStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $vehicle;
    public $previousStatus;

    public function __construct(Vehicle $vehicle, ?string $previousStatus = null)
    {
        $this->vehicle = $vehicle;
        $this->previousStatus = $previousStatus;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('tenant.' . $this->vehicle->tenant_id),
            new Channel('vehicle.' . $this->vehicle->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'vehicle.status-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->vehicle->id,
            'plate' => $this->vehicle->plate,
            'status' => $this->vehicle->status,
            'previous_status' => $this->previousStatus,
            'mileage' => $this->vehicle->mileage,
            'updated_at' => $this->vehicle->updated_at->toIso8601String(),
        ];
    }
}
