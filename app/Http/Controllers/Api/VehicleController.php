<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vehicle\StoreVehicleRequest;
use App\Http\Requests\Vehicle\UpdateVehicleRequest;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Vehicle::query();

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('plate_no', 'like', "%{$search}%")
                  ->orWhere('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = (int) $request->input('per_page', 10);
        $vehicles = $query->latest()->paginate($perPage);

        return response()->json($vehicles);
    }

    public function store(StoreVehicleRequest $request): JsonResponse
    {
        $vehicle = Vehicle::create($request->validated());
        return response()->json($vehicle, 201);
    }

    public function show(Vehicle $vehicle): JsonResponse
    {
        return response()->json($vehicle);
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): JsonResponse
    {
        $vehicle->update($request->validated());
        return response()->json($vehicle);
    }

    public function destroy(Vehicle $vehicle): JsonResponse
    {
        $vehicle->delete();
        return response()->json(['message' => 'Vehicle deleted']);
    }
}