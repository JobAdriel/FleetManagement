<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Invoice::where('tenant_id', $request->user()->tenant_id)
                ->with(['customer', 'workOrder.vehicle', 'workOrder.quote'])
                ->orderBy('created_at', 'desc')
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_tenant_id' => 'required|uuid|exists:tenants,id',
            'work_order_id' => 'nullable|uuid|exists:work_orders,id',
            'subtotal' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'due_date' => 'required|date',
            'status' => 'nullable|string|in:draft,sent,paid,disputed',
            'notes' => 'nullable|string',
        ]);

        $invoiceNumber = 'INV-' . date('Ymd') . '-' . random_int(1000, 9999);

        $invoice = Invoice::create([
            'tenant_id' => $request->user()->tenant_id,
            'invoice_number' => $invoiceNumber,
            'total' => ($validated['subtotal'] ?? 0) + ($validated['tax'] ?? 0),
            'status' => $validated['status'] ?? 'draft',
            ...$validated,
        ]);

        return response()->json($invoice->load(['customer', 'workOrder.vehicle', 'workOrder.quote']), 201);
    }

    public function show(Request $request, Invoice $invoice)
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        return response()->json($invoice->load(['items', 'customer']));
    }

    public function update(Request $request, Invoice $invoice)
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'customer_tenant_id' => 'sometimes|uuid|exists:tenants,id',
            'work_order_id' => 'sometimes|nullable|uuid|exists:work_orders,id',
            'subtotal' => 'sometimes|numeric|min:0',
            'tax' => 'sometimes|numeric|min:0',
            'due_date' => 'sometimes|date',
            'status' => 'sometimes|string|in:draft,sent,paid,disputed',
            'notes' => 'sometimes|nullable|string',
        ]);

        if (isset($validated['subtotal']) || isset($validated['tax'])) {
            $validated['total'] = ($validated['subtotal'] ?? $invoice->subtotal) + ($validated['tax'] ?? $invoice->tax);
        }

        $invoice->update($validated);
        return response()->json($invoice->fresh(['customer', 'workOrder.vehicle', 'workOrder.quote']));
    }

    public function destroy(Request $request, Invoice $invoice)
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        $invoice->delete();
        return response()->json(null, 204);
    }
}
