<?php

namespace App\Events;

use App\Models\WorkOrder;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkOrderStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $workOrder;
    public $previousStatus;

    public function __construct(WorkOrder $workOrder, ?string $previousStatus = null)
    {
        $this->workOrder = $workOrder->load('vehicle');
        $this->previousStatus = $previousStatus;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('tenant.' . $this->workOrder->tenant_id),
            new Channel('vehicle.' . $this->workOrder->vehicle_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'work-order.status-changed';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->workOrder->id,
            'vehicle_id' => $this->workOrder->vehicle_id,
            'vehicle_plate' => $this->workOrder->vehicle->plate ?? 'Unknown',
            'status' => $this->workOrder->status,
            'previous_status' => $this->previousStatus,
            'scheduled_date' => $this->workOrder->scheduled_date,
            'updated_at' => $this->workOrder->updated_at->toIso8601String(),
        ];
    }
}
