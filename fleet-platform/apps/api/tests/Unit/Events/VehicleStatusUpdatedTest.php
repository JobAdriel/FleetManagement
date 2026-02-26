<?php

namespace Tests\Unit\Events;

use App\Events\VehicleStatusUpdated;
use App\Models\Vehicle;
use App\Models\Tenant;
use Illuminate\Broadcasting\Channel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VehicleStatusUpdatedTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_broadcasts_on_channels(): void
    {
        $tenant = Tenant::factory()->create();
        $vehicle = Vehicle::factory()->create(['tenant_id' => $tenant->id]);
        
        $event = new VehicleStatusUpdated($vehicle, 'active', 'maintenance');
        
        $channels = $event->broadcastOn();
        
        $this->assertIsArray($channels);
        $this->assertCount(2, $channels);
        $this->assertInstanceOf(Channel::class, $channels[0]);
        $this->assertInstanceOf(Channel::class, $channels[1]);
    }

    public function test_event_broadcast_channel_names(): void
    {
        $tenant = Tenant::factory()->create();
        $vehicle = Vehicle::factory()->create(['tenant_id' => $tenant->id]);
        
        $event = new VehicleStatusUpdated($vehicle, 'active', 'maintenance');
        
        $channels = $event->broadcastOn();
        
        $this->assertEquals("tenant.{$tenant->id}", $channels[0]->name);
        $this->assertEquals("vehicle.{$vehicle->id}", $channels[1]->name);
    }

    public function test_event_broadcast_data(): void
    {
        $tenant = Tenant::factory()->create();
        $vehicle = Vehicle::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'maintenance',
        ]);
        
        $event = new VehicleStatusUpdated($vehicle, 'active', 'maintenance');
        
        $data = $event->broadcastWith();
        
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('status', $data);
        $this->assertArrayHasKey('previous_status', $data);
        $this->assertEquals($vehicle->id, $data['id']);
        $this->assertEquals('active', $data['previous_status']);
        $this->assertEquals('maintenance', $data['status']);
    }

    public function test_event_broadcast_as_custom_name(): void
    {
        $vehicle = Vehicle::factory()->create();
        
        $event = new VehicleStatusUpdated($vehicle, 'active', 'maintenance');
        
        $this->assertEquals('vehicle.status-updated', $event->broadcastAs());
    }

    public function test_event_stores_vehicle_and_status_changes(): void
    {
        $vehicle = Vehicle::factory()->create(['status' => 'maintenance']);
        
        $event = new VehicleStatusUpdated($vehicle, 'active', 'maintenance');
        
        $this->assertSame($vehicle, $event->vehicle);
        $this->assertEquals('active', $event->previousStatus);
        $this->assertEquals('maintenance', $event->vehicle->status);
    }
}
