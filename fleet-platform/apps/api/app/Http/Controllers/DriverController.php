<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Driver::where('tenant_id', $request->user()->tenant_id)
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'license_number' => 'required|unique:drivers',
            'license_class' => 'required|string',
            'license_expiry' => 'required|date',
            'contact_phone' => 'nullable|string',
            'contact_email' => 'nullable|email',
        ]);

        $driver = Driver::create([
            'tenant_id' => $request->user()->tenant_id,
            ...$validated,
        ]);

        return response()->json($driver, 201);
    }

    public function show(Request $request, Driver $driver)
    {
        if ($driver->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        return response()->json($driver);
    }

    public function update(Request $request, Driver $driver)
    {
        if ($driver->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'license_number' => 'sometimes|unique:drivers,license_number,' . $driver->id,
            'license_class' => 'sometimes|string',
            'license_expiry' => 'sometimes|date',
            'contact_phone' => 'nullable|string',
            'contact_email' => 'nullable|email',
            'employment_status' => 'sometimes|string',
        ]);

        $driver->update($validated);
        return response()->json($driver);
    }

    public function destroy(Request $request, Driver $driver)
    {
        if ($driver->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        $driver->delete();
        return response()->json(null, 204);
    }
}
