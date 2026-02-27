<?php

namespace App\Http\Controllers;

use App\Models\Rfq;
use App\Models\Quote;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        $query = Quote::where('tenant_id', $request->user()->tenant_id)
            ->with(['quoteItems', 'rfq.serviceRequest', 'vendor'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        return response()->json(
            $query->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rfq_id' => 'nullable|uuid|exists:rfqs,id',
            'service_request_id' => 'nullable|uuid|exists:service_requests,id',
            'rfq_code' => 'required|string|unique:quotes,rfq_code',
            'vendor_id' => 'nullable|uuid|exists:vendors,id',
            'subtotal' => 'required|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'validity_until' => 'nullable|date',
            'status' => 'nullable|string|in:draft,submitted,approved,rejected,cancelled',
        ]);

        $rfqId = $validated['rfq_id'] ?? null;

        if (!$rfqId && !empty($validated['service_request_id'])) {
            $rfq = Rfq::firstOrCreate(
                [
                    'tenant_id' => $request->user()->tenant_id,
                    'service_request_id' => $validated['service_request_id'],
                ],
                [
                    'due_date' => now()->addDays(7)->toDateString(),
                    'status' => 'sent',
                ]
            );

            $rfqId = $rfq->id;
        }

        unset($validated['service_request_id'], $validated['rfq_id']);

        $quote = Quote::create([
            'tenant_id' => $request->user()->tenant_id,
            'rfq_id' => $rfqId,
            'total' => ($validated['subtotal'] ?? 0) + ($validated['tax'] ?? 0),
            ...$validated,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json($quote->load(['rfq.serviceRequest', 'vendor']), 201);
    }

    public function show(Request $request, Quote $quote)
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        return response()->json($quote->load('quoteItems'));
    }

    public function update(Request $request, Quote $quote)
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'rfq_id' => 'sometimes|nullable|uuid|exists:rfqs,id',
            'service_request_id' => 'sometimes|nullable|uuid|exists:service_requests,id',
            'subtotal' => 'sometimes|numeric|min:0',
            'tax' => 'sometimes|numeric|min:0',
            'validity_until' => 'sometimes|date',
            'status' => 'sometimes|string|in:draft,submitted,approved,rejected,cancelled',
        ]);

        if (array_key_exists('service_request_id', $validated) && empty($validated['rfq_id'])) {
            if (!empty($validated['service_request_id'])) {
                $rfq = Rfq::firstOrCreate(
                    [
                        'tenant_id' => $request->user()->tenant_id,
                        'service_request_id' => $validated['service_request_id'],
                    ],
                    [
                        'due_date' => now()->addDays(7)->toDateString(),
                        'status' => 'sent',
                    ]
                );

                $validated['rfq_id'] = $rfq->id;
            } else {
                $validated['rfq_id'] = null;
            }
        }

        unset($validated['service_request_id']);

        if (isset($validated['subtotal']) || isset($validated['tax'])) {
            $validated['total'] = ($validated['subtotal'] ?? $quote->subtotal) + ($validated['tax'] ?? $quote->tax);
        }

        $quote->update($validated);
        return response()->json($quote->fresh(['rfq.serviceRequest', 'vendor']));
    }

    public function destroy(Request $request, Quote $quote)
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        $quote->delete();
        return response()->json(null, 204);
    }
}
