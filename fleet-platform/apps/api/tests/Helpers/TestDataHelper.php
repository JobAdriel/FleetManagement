<?php

namespace Tests\Helpers;

use App\Models\Vehicle;
use App\Models\ServiceRequest;
use App\Models\WorkOrder;
use App\Models\Quote;
use App\Models\Vendor;
use App\Models\Document;
use App\Models\Notification;
use App\Models\Tenant;
use App\Models\User;

/**
 * Helper class for creating test data
 */
class TestDataHelper
{
    /**
     * Create a complete fleet scenario with vehicles, service requests, and work orders
     */
    public static function createFleetScenario(Tenant $tenant, int $vehicleCount = 5): array
    {
        $vehicles = Vehicle::factory()
            ->count($vehicleCount)
            ->create(['tenant_id' => $tenant->id]);

        $serviceRequests = collect();
        $workOrders = collect();
        $quotes = collect();

        foreach ($vehicles as $vehicle) {
            $vendor = Vendor::factory()->create(['tenant_id' => $tenant->id]);

            $request = ServiceRequest::factory()->create([
                'tenant_id' => $tenant->id,
                'vehicle_id' => $vehicle->id,
            ]);
            $serviceRequests->push($request);

            $quote = Quote::factory()->create([
                'tenant_id' => $tenant->id,
                'service_request_id' => $request->id,
                'vendor_id' => $vendor->id,
            ]);
            $quotes->push($quote);

            $workOrder = WorkOrder::factory()->create([
                'tenant_id' => $tenant->id,
                'vehicle_id' => $vehicle->id,
                'quote_id' => $quote->id,
                'shop_id' => $vendor->id,
            ]);
            $workOrders->push($workOrder);
        }

        return [
            'vehicles' => $vehicles,
            'service_requests' => $serviceRequests,
            'work_orders' => $workOrders,
            'quotes' => $quotes,
        ];
    }

    /**
     * Create documents for an entity
     */
    public static function createDocumentsForEntity(
        Tenant $tenant,
        string $entityType,
        string $entityId,
        int $count = 3
    ): \Illuminate\Database\Eloquent\Collection {
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        return Document::factory()
            ->count($count)
            ->create([
                'tenant_id' => $tenant->id,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'uploaded_by' => $user->id,
            ]);
    }

    /**
     * Create notifications for a user
     */
    public static function createNotificationsForUser(
        User $user,
        int $count = 5,
        array $attributes = []
    ): \Illuminate\Database\Eloquent\Collection {
        return Notification::factory()
            ->count($count)
            ->create(array_merge([
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
            ], $attributes));
    }

    /**
     * Create a vehicle with complete maintenance history
     */
    public static function createVehicleWithHistory(Tenant $tenant): array
    {
        $vehicle = Vehicle::factory()->create(['tenant_id' => $tenant->id]);
        $vendor = Vendor::factory()->create(['tenant_id' => $tenant->id]);

        // Create pending request
        $pendingRequest = ServiceRequest::factory()->pending()->create([
            'tenant_id' => $tenant->id,
            'vehicle_id' => $vehicle->id,
        ]);

        // Create in-progress request
        $inProgressRequest = ServiceRequest::factory()->inProgress()->create([
            'tenant_id' => $tenant->id,
            'vehicle_id' => $vehicle->id,
        ]);

        // Create completed requests
        $completedRequests = ServiceRequest::factory()
            ->count(3)
            ->completed()
            ->create([
                'tenant_id' => $tenant->id,
                'vehicle_id' => $vehicle->id,
            ]);

        // Create work orders for completed requests
        $workOrders = collect();
        foreach ($completedRequests as $request) {
            $quote = Quote::factory()->approved()->create([
                'tenant_id' => $tenant->id,
                'service_request_id' => $request->id,
                'vendor_id' => $vendor->id,
            ]);

            $workOrder = WorkOrder::factory()->completed()->create([
                'tenant_id' => $tenant->id,
                'vehicle_id' => $vehicle->id,
                'quote_id' => $quote->id,
                'shop_id' => $vendor->id,
            ]);
            $workOrders->push($workOrder);
        }

        // Create documents
        $documents = self::createDocumentsForEntity(
            $tenant,
            'vehicle',
            $vehicle->id,
            5
        );

        return [
            'vehicle' => $vehicle,
            'pending_request' => $pendingRequest,
            'in_progress_request' => $inProgressRequest,
            'completed_requests' => $completedRequests,
            'work_orders' => $workOrders,
            'documents' => $documents,
        ];
    }

    /**
     * Create mixed status vehicles for testing dashboard
     */
    public static function createMixedStatusVehicles(Tenant $tenant): array
    {
        return [
            'active' => Vehicle::factory()->active()->count(10)->create(['tenant_id' => $tenant->id]),
            'maintenance' => Vehicle::factory()->inMaintenance()->count(5)->create(['tenant_id' => $tenant->id]),
            'inactive' => Vehicle::factory()->inactive()->count(3)->create(['tenant_id' => $tenant->id]),
        ];
    }
}
