<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:pending,sent,failed',
        ]);

        $query = Notification::where('tenant_id', $request->user()->tenant_id)
            ->where('recipient_id', $request->user()->id)
            ->orderByDesc('created_at');

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        return response()->json($query->paginate(20));
    }

    public function show(Request $request, Notification $notification)
    {
        if ((string) $notification->tenant_id !== (string) $request->user()->tenant_id ||
            (string) $notification->recipient_id !== (string) $request->user()->id) {
            abort(403);
        }

        return response()->json($notification);
    }

    public function markAsSent(Request $request, Notification $notification)
    {
        if ((string) $notification->tenant_id !== (string) $request->user()->tenant_id ||
            (string) $notification->recipient_id !== (string) $request->user()->id) {
            abort(403);
        }

        if ($notification->status !== 'sent') {
            $notification->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);
        }

        return response()->json($notification);
    }

    public function destroy(Request $request, Notification $notification)
    {
        if ((string) $notification->tenant_id !== (string) $request->user()->tenant_id ||
            (string) $notification->recipient_id !== (string) $request->user()->id) {
            abort(403);
        }

        $notification->delete();
        return response()->json(null, 204);
    }
}
