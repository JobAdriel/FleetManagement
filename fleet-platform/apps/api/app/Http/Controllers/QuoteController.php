<?php

namespace App\Http\Controllers;

use App\Models\Quote;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Quote::where('tenant_id', $request->user()->tenant_id)
                ->with(['quoteItems', 'rfq.serviceRequest'])
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rfq_id' => 'nullable|uuid|exists:rfqs,id',
            'rfq_code' => 'required|string|unique:quotes,rfq_code',
            'vendor_id' => 'nullable|uuid|exists:vendors,id',
            'subtotal' => 'required|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'validity_until' => 'nullable|date',
            'status' => 'nullable|string|in:draft,submitted,approved,rejected',
        ]);

        $quote = Quote::create([
            'tenant_id' => $request->user()->tenant_id,
            'total' => ($validated['subtotal'] ?? 0) + ($validated['tax'] ?? 0),
            ...$validated,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json($quote, 201);
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
            'subtotal' => 'sometimes|numeric|min:0',
            'tax' => 'sometimes|numeric|min:0',
            'validity_until' => 'sometimes|date',
            'status' => 'sometimes|string|in:draft,submitted,approved,rejected',
        ]);

        if (isset($validated['subtotal']) || isset($validated['tax'])) {
            $validated['total'] = ($validated['subtotal'] ?? $quote->subtotal) + ($validated['tax'] ?? $quote->tax);
        }

        $quote->update($validated);
        return response()->json($quote);
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
