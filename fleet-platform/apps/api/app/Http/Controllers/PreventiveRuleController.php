<?php

namespace App\Http\Controllers;

use App\Models\PreventiveRule;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class PreventiveRuleController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            PreventiveRule::where('tenant_id', $request->user()->tenant_id)
                ->orderBy('name')
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'trigger_type' => 'required|string|in:mileage,time,date',
            'trigger_value' => 'required|integer',
            'action' => 'required|string',
            'is_active' => 'nullable|boolean',
        ]);

        $rule = PreventiveRule::create([
            'tenant_id' => $request->user()->tenant_id,
            ...$validated,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json($rule, 201);
    }

    public function show(Request $request, PreventiveRule $preventiveRule)
    {
        if ($preventiveRule->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        return response()->json($preventiveRule);
    }

    public function update(Request $request, PreventiveRule $preventiveRule)
    {
        if ($preventiveRule->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'trigger_type' => 'sometimes|string|in:mileage,time,date',
            'trigger_value' => 'sometimes|integer',
            'action' => 'sometimes|string',
            'is_active' => 'nullable|boolean',
        ]);

        $preventiveRule->update($validated);
        return response()->json($preventiveRule);
    }

    public function destroy(Request $request, PreventiveRule $preventiveRule)
    {
        if ($preventiveRule->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        $preventiveRule->delete();
        return response()->json(null, 204);
    }

    /**
     * Calculate next due date/mileage for each vehicle based on active rules
     */
    public function nextDue(Request $request)
    {
        $rules = PreventiveRule::where('tenant_id', $request->user()->tenant_id)
            ->where('is_active', true)
            ->get();

        $vehicles = Vehicle::where('tenant_id', $request->user()->tenant_id)
            ->get();

        $results = [];

        foreach ($vehicles as $vehicle) {
            $vehicleNextDue = [];
            
            foreach ($rules as $rule) {
                $nextDue = $this->calculateNextDue($vehicle, $rule);
                if ($nextDue) {
                    $vehicleNextDue[] = $nextDue;
                }
            }

            if (!empty($vehicleNextDue)) {
                $results[] = [
                    'vehicle_id' => $vehicle->id,
                    'vehicle' => $vehicle->make . ' ' . $vehicle->model . ' (' . $vehicle->plate . ')',
                    'next_maintenance' => $vehicleNextDue,
                ];
            }
        }

        return response()->json($results);
    }

    private function calculateNextDue(Vehicle $vehicle, PreventiveRule $rule)
    {
        if ($rule->trigger_type === 'mileage') {
            $currentOdometer = $vehicle->odometer ?? 0;
            $nextMileage = ceil($currentOdometer / $rule->trigger_value) * $rule->trigger_value + $rule->trigger_value;
            
            return [
                'rule_name' => $rule->name,
                'type' => 'mileage',
                'current' => $currentOdometer,
                'next_at' => $nextMileage,
                'remaining' => $nextMileage - $currentOdometer,
            ];
        }

        if ($rule->trigger_type === 'time') {
            // Time-based (days)
            $lastService = $vehicle->updated_at; // Simplified - should track last service date
            $nextDate = $lastService->addDays($rule->trigger_value);
            
            return [
                'rule_name' => $rule->name,
                'type' => 'time',
                'next_date' => $nextDate->format('Y-m-d'),
                'days_remaining' => now()->diffInDays($nextDate, false),
            ];
        }

        return null;
    }
}
