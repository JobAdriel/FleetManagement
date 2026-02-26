<?php

namespace Tests\Unit\Models;

use App\Models\WorkOrder;
use App\Models\Quote;
use App\Models\Vendor;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_work_order_belongs_to_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        $workOrder = WorkOrder::factory()->create(['tenant_id' => $tenant->id]);

        $this->assertInstanceOf(Tenant::class, $workOrder->tenant);
        $this->assertEquals($tenant->id, $workOrder->tenant->id);
    }

    public function test_work_order_belongs_to_quote(): void
    {
        $quote = Quote::factory()->create();
        $workOrder = WorkOrder::factory()->create(['quote_id' => $quote->id]);

        $this->assertInstanceOf(Quote::class, $workOrder->quote);
        $this->assertEquals($quote->id, $workOrder->quote->id);
    }

    public function test_work_order_belongs_to_shop(): void
    {
        $shop = Vendor::factory()->shop()->create();
        $workOrder = WorkOrder::factory()->create(['shop_id' => $shop->id]);

        $this->assertInstanceOf(Vendor::class, $workOrder->shop);
        $this->assertEquals($shop->id, $workOrder->shop->id);
    }

    public function test_work_order_can_be_pending(): void
    {
        $workOrder = WorkOrder::factory()->pending()->create();

        $this->assertEquals('pending', $workOrder->status);
        $this->assertNull($workOrder->start_at);
        $this->assertNull($workOrder->complete_at);
    }

    public function test_work_order_can_be_in_progress(): void
    {
        $workOrder = WorkOrder::factory()->inProgress()->create();

        $this->assertEquals('in_progress', $workOrder->status);
        $this->assertNotNull($workOrder->start_at);
        $this->assertNull($workOrder->complete_at);
    }

    public function test_work_order_can_be_completed(): void
    {
        $workOrder = WorkOrder::factory()->completed()->create();

        $this->assertEquals('completed', $workOrder->status);
        $this->assertNotNull($workOrder->start_at);
        $this->assertNotNull($workOrder->complete_at);
    }

    public function test_work_order_has_uuid_as_primary_key(): void
    {
        $workOrder = WorkOrder::factory()->create();

        $this->assertIsString($workOrder->id);
        $this->assertEquals(36, strlen($workOrder->id));
    }

    public function test_work_order_fillable_attributes(): void
    {
        $fillableAttributes = [
            'tenant_id',
            'quote_id',
            'shop_id',
            'assigned_to',
            'start_at',
            'complete_at',
            'status',
        ];

        $workOrder = new WorkOrder();

        $this->assertEquals($fillableAttributes, $workOrder->getFillable());
    }

    public function test_work_order_casts_dates_to_datetime(): void
    {
        $workOrder = WorkOrder::factory()->completed()->create();

        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $workOrder->start_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $workOrder->complete_at);
    }
}
