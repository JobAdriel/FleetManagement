<?php

namespace App\Http\Controllers;

use App\Events\VehicleStatusUpdated;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Vehicle::where('tenant_id', $request->user()->tenant_id)
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'plate' => 'required|unique:vehicles',
            'vin' => 'required|unique:vehicles',
            'make' => 'required|string',
            'model' => 'required|string',
            'year' => 'required|integer',
            'fuel_type' => 'nullable|string',
        ]);

        $vehicle = Vehicle::create([
            'tenant_id' => $request->user()->tenant_id,
            ...$validated,
        ]);

        return response()->json($vehicle, 201);
    }

    public function show(Request $request, Vehicle $vehicle)
    {
        if ($vehicle->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        return response()->json($vehicle);
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        if ($vehicle->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'plate' => 'sometimes|unique:vehicles,plate,' . $vehicle->id,
            'vin' => 'sometimes|unique:vehicles,vin,' . $vehicle->id,
            'make' => 'sometimes|string',
            'model' => 'sometimes|string',
            'year' => 'sometimes|integer',
            'odometer' => 'sometimes|integer',
            'fuel_type' => 'nullable|string',
            'status' => 'sometimes|string',
        ]);

        // Track previous status for broadcasting
        $previousStatus = $vehicle->status;

        $vehicle->update($validated);

        // Broadcast status change in real-time
        if (isset($validated['status']) && $validated['status'] !== $previousStatus) {
            event(new VehicleStatusUpdated($vehicle, $previousStatus));
        }

        return response()->json($vehicle);
    }

    public function destroy(Request $request, Vehicle $vehicle)
    {
        if ($vehicle->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        $vehicle->delete();
        return response()->json(null, 204);
    }
}
