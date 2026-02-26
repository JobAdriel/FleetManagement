<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use App\Models\Quote;
use App\Models\WorkOrder;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Approval::where('tenant_id', $request->user()->tenant_id)
                ->with('quote')
                ->orderBy('created_at', 'desc')
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'quote_id' => 'required|uuid|exists:quotes,id',
            'status' => 'required|string|in:pending,approved,rejected',
            'approval_notes' => 'nullable|string',
        ]);

        $quote = Quote::findOrFail($validated['quote_id']);
        
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $approval = Approval::create([
            'tenant_id' => $request->user()->tenant_id,
            'approver_id' => $request->user()->id,
            ...$validated,
        ]);

        // Update quote status based on approval
        if ($validated['status'] === 'approved') {
            $quote->update(['status' => 'approved']);
            
            // Auto-create work order from approved quote
            WorkOrder::create([
                'tenant_id' => $request->user()->tenant_id,
                'quote_id' => $quote->id,
                'assigned_to' => null, // Can be assigned later
                'scheduled_date' => now()->addDays(3), // Default 3 days from approval
                'status' => 'scheduled',
            ]);
        } elseif ($validated['status'] === 'rejected') {
            $quote->update(['status' => 'rejected']);
        }

        return response()->json($approval->load('quote'), 201);
    }

    public function show(Request $request, Approval $approval)
    {
        if ($approval->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        return response()->json($approval->load('quote'));
    }

    public function destroy(Request $request, Approval $approval)
    {
        if ($approval->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }
        $approval->delete();
        return response()->json(null, 204);
    }
}
