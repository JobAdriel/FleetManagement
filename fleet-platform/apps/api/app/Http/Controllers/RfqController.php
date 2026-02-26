<?php

namespace App\Http\Controllers;

use App\Models\Rfq;
use Illuminate\Http\Request;

class RfqController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Rfq::where('tenant_id', $request->user()->tenant_id)
                ->with(['serviceRequest', 'quotes'])
                ->orderBy('created_at', 'desc')
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_request_id' => 'required|uuid|exists:service_requests,id',
            'due_date' => 'required|date',
        ]);

        $rfq = Rfq::create([
            'tenant_id' => $request->user()->tenant_id,
            ...$validated,
            'status' => 'draft',
        ]);

        return response()->json($rfq->load('serviceRequest'), 201);
    }

    public function show(Request $request, Rfq $rfq)
    {
        if ($rfq->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        return response()->json($rfq->load(['serviceRequest', 'quotes.vendor']));
    }

    public function update(Request $request, Rfq $rfq)
    {
        if ($rfq->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'due_date' => 'sometimes|date',
            'status' => 'sometimes|string|in:draft,sent,closed,cancelled',
        ]);

        $rfq->update($validated);
        return response()->json($rfq);
    }

    public function destroy(Request $request, Rfq $rfq)
    {
        if ($rfq->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        $rfq->delete();
        return response()->json(null, 204);
    }
}
