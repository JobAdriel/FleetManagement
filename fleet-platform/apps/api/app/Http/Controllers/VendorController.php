<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Vendor::where('tenant_id', $request->user()->tenant_id)
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'type' => 'nullable|string|in:shop,parts_supplier,towing',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string',
            'address' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $vendor = Vendor::create([
            'tenant_id' => $request->user()->tenant_id,
            'status' => $validated['status'] ?? 'active',
            ...$validated,
        ]);

        return response()->json($vendor, 201);
    }

    public function show(Request $request, Vendor $vendor)
    {
        if ($vendor->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        return response()->json($vendor);
    }

    public function update(Request $request, Vendor $vendor)
    {
        if ($vendor->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'type' => 'nullable|string|in:shop,parts_supplier,towing',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string',
            'address' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $vendor->update($validated);
        return response()->json($vendor);
    }

    public function destroy(Request $request, Vendor $vendor)
    {
        if ($vendor->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        $vendor->delete();
        return response()->json(null, 204);
    }
}
