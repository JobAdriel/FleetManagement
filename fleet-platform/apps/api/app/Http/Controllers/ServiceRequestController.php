<?php

namespace App\Http\Controllers;

use App\Models\ServiceRequest;
use App\Events\ServiceRequestCreated;
use App\Jobs\SendNotificationJob;
use Illuminate\Http\Request;

class ServiceRequestController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            ServiceRequest::where('tenant_id', $request->user()->tenant_id)
                ->orderBy('created_at', 'desc')
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|uuid|exists:vehicles,id',
            'issue_description' => 'required|string',
            'priority' => 'nullable|string|in:low,normal,high',
        ]);

        $sr = ServiceRequest::create([
            'tenant_id' => $request->user()->tenant_id,
            ...$validated,
            'status' => 'draft',
        ]);

        // Broadcast real-time event
        broadcast(new ServiceRequestCreated($sr));

        // Queue notification job (placeholder)
        SendNotificationJob::dispatch(
            $sr->tenant_id,
            $request->user()->id,
            'service_request_created',
            ['service_request_id' => $sr->id, 'issue' => $sr->issue_description],
            'in_app'
        );

        return response()->json($sr, 201);
    }

    public function show(Request $request, ServiceRequest $serviceRequest)
    {
        if ($serviceRequest->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        return response()->json($serviceRequest);
    }

    public function update(Request $request, ServiceRequest $serviceRequest)
    {
        if ($serviceRequest->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'issue_description' => 'sometimes|string',
            'priority' => 'sometimes|string|in:low,normal,high',
            'status' => 'sometimes|string|in:draft,submitted,cancelled',
        ]);

        $serviceRequest->update($validated);
        return response()->json($serviceRequest);
    }

    public function destroy(Request $request, ServiceRequest $serviceRequest)
    {
        if ($serviceRequest->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        $serviceRequest->delete();
        return response()->json(null, 204);
    }
}
