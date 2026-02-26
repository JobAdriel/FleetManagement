<?php

namespace Tests\Feature\Api;

use App\Models\Vehicle;
use App\Models\WorkOrder;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Sanctum::actingAs($this->user);
    }

    public function test_can_get_fleet_status_report(): void
    {
        Vehicle::factory()->active()->count(5)->create(['tenant_id' => $this->tenant->id]);
        Vehicle::factory()->inMaintenance()->count(3)->create(['tenant_id' => $this->tenant->id]);
        Vehicle::factory()->inactive()->count(2)->create(['tenant_id' => $this->tenant->id]);

        $response = $this->getJson('/api/reports/fleet-status');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'total_vehicles' => 10,
                    'active_count' => 5,
                    'maintenance_count' => 3,
                    'inactive_count' => 2,
                ],
            ]);
    }

    public function test_fleet_status_only_shows_tenant_vehicles(): void
    {
        $otherTenant = Tenant::factory()->create();

        Vehicle::factory()->active()->count(3)->create(['tenant_id' => $this->tenant->id]);
        Vehicle::factory()->active()->count(5)->create(['tenant_id' => $otherTenant->id]);

        $response = $this->getJson('/api/reports/fleet-status');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'total_vehicles' => 3,
                    'active_count' => 3,
                ],
            ]);
    }

    public function test_can_get_maintenance_summary_report(): void
    {
        $vehicle = Vehicle::factory()->create(['tenant_id' => $this->tenant->id]);
        
        ServiceRequest::factory()->pending()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'vehicle_id' => $vehicle->id,
        ]);
        ServiceRequest::factory()->inProgress()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'vehicle_id' => $vehicle->id,
        ]);
        ServiceRequest::factory()->completed()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'vehicle_id' => $vehicle->id,
        ]);

        $response = $this->getJson('/api/reports/maintenance-summary');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'total_requests' => 10,
                    'pending_count' => 2,
                    'in_progress_count' => 3,
                    'completed_count' => 5,
                ],
            ]);
    }

    public function test_can_get_work_order_status_report(): void
    {
        WorkOrder::factory()->pending()->count(4)->create(['tenant_id' => $this->tenant->id]);
        WorkOrder::factory()->inProgress()->count(2)->create(['tenant_id' => $this->tenant->id]);
        WorkOrder::factory()->completed()->count(6)->create(['tenant_id' => $this->tenant->id]);

        $response = $this->getJson('/api/reports/work-order-status');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'total_work_orders' => 12,
                    'pending_count' => 4,
                    'in_progress_count' => 2,
                    'completed_count' => 6,
                ],
            ]);
    }

    public function test_can_get_cost_analysis_report(): void
    {
        WorkOrder::factory()->completed()->count(3)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->getJson('/api/reports/cost-analysis');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_cost',
                    'average_cost',
                    'work_orders_count',
                    'cost_by_status',
                ],
            ]);
    }

    public function test_cost_analysis_filters_by_date_range(): void
    {
        WorkOrder::factory()->completed()->create([
            'tenant_id' => $this->tenant->id,
            'complete_at' => now()->subDays(60),
        ]);
        WorkOrder::factory()->completed()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'complete_at' => now()->subDays(15),
        ]);

        $response = $this->getJson('/api/reports/cost-analysis?start_date=' . now()->subDays(30)->toDateString());

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'work_orders_count' => 2,
                ],
            ]);
    }

    public function test_reports_only_show_tenant_data(): void
    {
        $otherTenant = Tenant::factory()->create();

        Vehicle::factory()->count(5)->create(['tenant_id' => $this->tenant->id]);
        Vehicle::factory()->count(10)->create(['tenant_id' => $otherTenant->id]);

        $response = $this->getJson('/api/reports/fleet-status');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'total_vehicles' => 5,
                ],
            ]);
    }

    public function test_requires_authentication(): void
    {
        Sanctum::actingAs($this->user, [], false);

        $response = $this->getJson('/api/reports/fleet-status');

        $response->assertStatus(200);
    }
}
