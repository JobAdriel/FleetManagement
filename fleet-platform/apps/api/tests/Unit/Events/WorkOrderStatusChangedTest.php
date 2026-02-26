<?php

namespace Tests\Unit\Events;

use App\Events\WorkOrderStatusChanged;
use App\Models\WorkOrder;
use App\Models\Tenant;
use Illuminate\Broadcasting\Channel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkOrderStatusChangedTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_broadcasts_on_channels(): void
    {
        $tenant = Tenant::factory()->create();
        $workOrder = WorkOrder::factory()->create(['tenant_id' => $tenant->id]);
        
        $event = new WorkOrderStatusChanged($workOrder, 'pending', 'in_progress');
        
        $channels = $event->broadcastOn();
        
        $this->assertIsArray($channels);
        $this->assertCount(2, $channels);
        $this->assertInstanceOf(Channel::class, $channels[0]);
    }

    public function test_event_broadcast_channel_name(): void
    {
        $tenant = Tenant::factory()->create();
        $workOrder = WorkOrder::factory()->create(['tenant_id' => $tenant->id]);
        
        $event = new WorkOrderStatusChanged($workOrder, 'pending', 'in_progress');
        
        $channels = $event->broadcastOn();
        
        $this->assertEquals("tenant.{$tenant->id}", $channels[0]->name);
    }

    public function test_event_broadcast_data(): void
    {
        $tenant = Tenant::factory()->create();
        $workOrder = WorkOrder::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'in_progress',
        ]);
        
        $event = new WorkOrderStatusChanged($workOrder, 'pending', 'in_progress');
        
        $data = $event->broadcastWith();
        
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('previous_status', $data);
        $this->assertArrayHasKey('status', $data);
        $this->assertEquals($workOrder->id, $data['id']);
        $this->assertEquals('pending', $data['previous_status']);
        $this->assertEquals('in_progress', $data['status']);
    }

    public function test_event_broadcast_as_custom_name(): void
    {
        $workOrder = WorkOrder::factory()->create();
        
        $event = new WorkOrderStatusChanged($workOrder, 'pending', 'in_progress');
        
        $this->assertEquals('work-order.status-changed', $event->broadcastAs());
    }

    public function test_event_stores_work_order_and_status_changes(): void
    {
        $workOrder = WorkOrder::factory()->create(['status' => 'in_progress']);
        
        $event = new WorkOrderStatusChanged($workOrder, 'pending', 'in_progress');
        
        $this->assertSame($workOrder, $event->workOrder);
        $this->assertEquals('pending', $event->previousStatus);
        $this->assertEquals('in_progress', $event->workOrder->status);
    }
}
