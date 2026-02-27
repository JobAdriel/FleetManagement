<?php

namespace App\Http\Controllers;

use App\Events\WorkOrderStatusChanged;
use App\Models\WorkOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WorkOrderController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            WorkOrder::where('tenant_id', $request->user()->tenant_id)
                ->with(['quote', 'shop', 'vehicle'])
                ->orderBy('created_at', 'desc')
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'quote_id' => 'required|uuid|exists:quotes,id',
            'vehicle_id' => 'nullable|uuid|exists:vehicles,id',
            'shop_id' => 'required|uuid|exists:vendors,id',
            'assigned_to' => 'nullable|string|max:255',
            'status' => 'nullable|string',
            'owner_decision' => 'nullable|string|in:pending,approved,rejected,cancelled',
            'shop_notes' => 'nullable|string',
            'job_details' => 'nullable|string',
            'start_at' => 'nullable|date',
            'complete_at' => 'nullable|date',
        ]);

        // Use provided vehicle_id, or get from quote's service request if not provided
        $vehicleId = $validated['vehicle_id'] ?? null;
        if (!$vehicleId) {
            $quote = \App\Models\Quote::with('rfq.serviceRequest')->find($validated['quote_id']);
            $vehicleId = $quote?->rfq?->serviceRequest?->vehicle_id ?? null;
        }

        $wo = WorkOrder::create([
            'tenant_id' => $request->user()->tenant_id,
            'vehicle_id' => $vehicleId,
            'owner_decision' => $validated['owner_decision'] ?? 'pending',
            ...$validated,
        ]);

        return response()->json($wo->load('vehicle', 'quote', 'shop'), 201);
    }

    public function show(Request $request, WorkOrder $workOrder)
    {
        if ($workOrder->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        return response()->json($workOrder->load('tasks', 'parts'));
    }

    public function update(Request $request, WorkOrder $workOrder)
    {
        if ($workOrder->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'vehicle_id' => 'sometimes|uuid|exists:vehicles,id',
            'assigned_to' => 'sometimes|nullable|string|max:255',
            'start_at' => 'sometimes|date',
            'complete_at' => 'sometimes|date',
            'status' => 'sometimes|string|in:pending,in_progress,completed,cancelled',
            'owner_decision' => 'sometimes|string|in:pending,approved,rejected,cancelled',
            'shop_notes' => 'sometimes|nullable|string',
            'job_details' => 'sometimes|nullable|string',
        ]);

        Log::info('🔍 Work Order Update Request', [
            'work_order_id' => $workOrder->id,
            'old_vehicle_id' => $workOrder->vehicle_id,
            'new_vehicle_id' => $validated['vehicle_id'] ?? 'not provided',
            'all_validated' => $validated,
        ]);

        // Track previous status for broadcasting
        $previousStatus = $workOrder->status;

        $workOrder->update($validated);

        // Broadcast status change in real-time
        if (isset($validated['status']) && $validated['status'] !== $previousStatus) {
            event(new WorkOrderStatusChanged($workOrder, $previousStatus));
        }

        // Refresh and load relationships to ensure updated vehicle is returned
        $fresh = $workOrder->fresh(['vehicle', 'quote', 'shop']);
        
        Log::info('✅ Work Order Updated', [
            'work_order_id' => $fresh->id,
            'vehicle_id' => $fresh->vehicle_id,
            'vehicle_make' => $fresh->vehicle?->make ?? 'null',
            'vehicle_model' => $fresh->vehicle?->model ?? 'null',
        ]);

        return response()->json($fresh);
    }

    public function destroy(Request $request, WorkOrder $workOrder)
    {
        if ($workOrder->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        $workOrder->delete();
        return response()->json(null, 204);
    }
}
