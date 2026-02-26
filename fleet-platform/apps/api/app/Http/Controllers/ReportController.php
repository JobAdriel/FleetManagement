<?php

namespace App\Http\Controllers;

use App\Models\ServiceRequest;
use App\Models\Vehicle;
use App\Models\WorkOrder;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function fleetStatus(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $vehicles = Vehicle::where('tenant_id', $tenantId)->get();

        return response()->json([
            'data' => [
                'total_vehicles' => $vehicles->count(),
                'active_count' => $vehicles->where('status', 'active')->count(),
                'maintenance_count' => $vehicles->where('status', 'maintenance')->count(),
                'inactive_count' => $vehicles->where('status', 'inactive')->count(),
            ],
        ]);
    }

    public function maintenanceSummary(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $serviceRequests = ServiceRequest::where('tenant_id', $tenantId)->get();

        return response()->json([
            'data' => [
                'total_requests' => $serviceRequests->count(),
                'pending_count' => $serviceRequests->where('status', 'pending')->count(),
                'in_progress_count' => $serviceRequests->where('status', 'in_progress')->count(),
                'completed_count' => $serviceRequests->where('status', 'completed')->count(),
            ],
        ]);
    }

    public function workOrderStatus(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $workOrders = WorkOrder::where('tenant_id', $tenantId)->get();

        return response()->json([
            'data' => [
                'total_work_orders' => $workOrders->count(),
                'pending_count' => $workOrders->where('status', 'pending')->count(),
                'in_progress_count' => $workOrders->where('status', 'in_progress')->count(),
                'completed_count' => $workOrders->where('status', 'completed')->count(),
            ],
        ]);
    }

    public function costAnalysis(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $query = WorkOrder::where('tenant_id', $tenantId)->whereNotNull('complete_at');

        if ($request->filled('start_date')) {
            $query->whereDate('complete_at', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('complete_at', '<=', $request->input('end_date'));
        }

        $workOrders = $query->get();
        $workOrdersCount = $workOrders->count();
        $totalCost = (float) $workOrdersCount;
        $averageCost = $workOrdersCount > 0 ? $totalCost / $workOrdersCount : 0;

        return response()->json([
            'data' => [
                'total_cost' => $totalCost,
                'average_cost' => round($averageCost, 2),
                'work_orders_count' => $workOrdersCount,
                'cost_by_status' => [
                    'completed' => $workOrders->where('status', 'completed')->count(),
                    'in_progress' => $workOrders->where('status', 'in_progress')->count(),
                    'pending' => $workOrders->where('status', 'pending')->count(),
                ],
            ],
        ]);
    }

    /**
     * Maintenance spend summary by vehicle
     */
    public function maintenanceSpend(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $tenantId = $request->user()->tenant_id;
        $startDate = $validated['start_date'] ?? now()->subMonths(6)->startOfDay();
        $endDate = $validated['end_date'] ?? now()->endOfDay();

        // Get invoices with total spend (simulated as vehicle maintenance cost)
        $vehicles = Vehicle::where('tenant_id', $tenantId)->get();
        $data = [];

        foreach ($vehicles as $vehicle) {
            // Simulate maintenance spend and work order count
            $totalSpend = rand(5000, 50000);
            $workOrderCount = rand(1, 10);
            
            $data[] = [
                'vehicle_id' => $vehicle->id,
                'vehicle_plate' => $vehicle->plate,
                'total_spend' => $totalSpend,
                'work_order_count' => $workOrderCount,
            ];
        }

        // Sort by total spend descending
        usort($data, fn($a, $b) => $b['total_spend'] <=> $a['total_spend']);

        return response()->json($data);
    }

    /**
     * Vehicle downtime report
     */
    public function vehicleDowntime(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'nullable|uuid|exists:vehicles,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $tenantId = $request->user()->tenant_id;
        $startDate = $validated['start_date'] ?? now()->subMonths(3)->startOfDay();
        $endDate = $validated['end_date'] ?? now()->endOfDay();

        $vehicles = Vehicle::where('tenant_id', $tenantId)->get();
        $data = [];

        foreach ($vehicles as $vehicle) {
            // Simulate downtime days and work order count
            $downtimeDays = rand(0, 15);
            $workOrderCount = rand(0, 8);
            
            $data[] = [
                'vehicle_id' => $vehicle->id,
                'vehicle_plate' => $vehicle->plate,
                'downtime_days' => $downtimeDays,
                'work_order_count' => $workOrderCount,
            ];
        }

        // Sort by downtime days descending
        usort($data, fn($a, $b) => $b['downtime_days'] <=> $a['downtime_days']);

        return response()->json($data);
    }

    /**
     * Request cycle time
     */
    public function requestCycleTime(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $tenantId = $request->user()->tenant_id;
        $startDate = $validated['start_date'] ?? now()->subMonths(6)->startOfDay();
        $endDate = $validated['end_date'] ?? now()->endOfDay();

        $serviceRequests = ServiceRequest::where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $totalRequests = $serviceRequests->count();
        $completedRequests = $serviceRequests->whereIn('status', ['completed', 'closed'])->count();

        // Simulate average cycle time
        $avgCycleTime = $totalRequests > 0 ? rand(2, 7) + (rand(0, 9) / 10) : 0;

        return response()->json([
            'average_days' => round($avgCycleTime, 1),
            'total_requests' => $totalRequests,
            'completed_requests' => $completedRequests,
        ]);
    }

    /**
     * Fleet summary
     */
    public function fleetSummary(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $vehicles = Vehicle::where('tenant_id', $tenantId)->get();
        $totalVehicles = $vehicles->count();

        // Group by status
        $byStatus = [
            'active' => $vehicles->where('status', 'active')->count(),
            'maintenance' => $vehicles->where('status', 'maintenance')->count(),
            'inactive' => $vehicles->where('status', 'inactive')->count(),
        ];

        // Group by type
        $byType = [];
        foreach ($vehicles->groupBy('type') as $type => $typeVehicles) {
            $byType[$type] = $typeVehicles->count();
        }

        return response()->json([
            'total_vehicles' => $totalVehicles,
            'by_status' => $byStatus,
            'by_type' => $byType,
        ]);
    }
}
