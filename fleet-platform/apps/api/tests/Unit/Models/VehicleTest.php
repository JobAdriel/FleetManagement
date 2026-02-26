<?php

namespace Tests\Unit\Models;

use App\Models\Vehicle;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VehicleTest extends TestCase
{
    use RefreshDatabase;

    public function test_vehicle_belongs_to_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        $vehicle = Vehicle::factory()->create(['tenant_id' => $tenant->id]);

        $this->assertInstanceOf(Tenant::class, $vehicle->tenant);
        $this->assertEquals($tenant->id, $vehicle->tenant->id);
    }

    public function test_vehicle_has_service_requests(): void
    {
        $vehicle = Vehicle::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Collection::class, $vehicle->serviceRequests);
    }

    public function test_vehicle_has_documents(): void
    {
        $vehicle = Vehicle::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Collection::class, $vehicle->documents);
    }

    public function test_vehicle_can_be_active(): void
    {
        $vehicle = Vehicle::factory()->active()->create();

        $this->assertEquals('active', $vehicle->status);
    }

    public function test_vehicle_can_be_in_maintenance(): void
    {
        $vehicle = Vehicle::factory()->inMaintenance()->create();

        $this->assertEquals('maintenance', $vehicle->status);
    }

    public function test_vehicle_can_be_inactive(): void
    {
        $vehicle = Vehicle::factory()->inactive()->create();

        $this->assertEquals('inactive', $vehicle->status);
    }

    public function test_vehicle_has_uuid_as_primary_key(): void
    {
        $vehicle = Vehicle::factory()->create();

        $this->assertIsString($vehicle->id);
        $this->assertEquals(36, strlen($vehicle->id));
    }

    public function test_vehicle_fillable_attributes(): void
    {
        $fillableAttributes = [
            'tenant_id',
            'plate',
            'vin',
            'make',
            'model',
            'year',
            'odometer',
            'fuel_type',
            'status',
            'assigned_driver_id',
            'cost_center',
        ];

        $vehicle = new Vehicle();

        $this->assertEquals($fillableAttributes, $vehicle->getFillable());
    }

    public function test_vehicle_casts_odometer_to_integer(): void
    {
        $vehicle = Vehicle::factory()->create(['odometer' => '12345']);

        $this->assertIsInt($vehicle->odometer);
        $this->assertEquals(12345, $vehicle->odometer);
    }

    public function test_vehicle_casts_year_to_integer(): void
    {
        $vehicle = Vehicle::factory()->create(['year' => '2023']);

        $this->assertIsInt($vehicle->year);
        $this->assertEquals(2023, $vehicle->year);
    }

    public function test_vehicle_scope_for_tenant(): void
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();

        Vehicle::factory()->count(3)->create(['tenant_id' => $tenant1->id]);
        Vehicle::factory()->count(2)->create(['tenant_id' => $tenant2->id]);

        $tenant1Vehicles = Vehicle::where('tenant_id', $tenant1->id)->get();

        $this->assertCount(3, $tenant1Vehicles);
        $this->assertTrue($tenant1Vehicles->every(fn($v) => $v->tenant_id === $tenant1->id));
    }
}
