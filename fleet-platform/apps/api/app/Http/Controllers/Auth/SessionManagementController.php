<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\UserSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SessionManagementController extends Controller
{
    /**
     * Get all active sessions for the user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $sessions = UserSession::where('user_id', $user->id)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->orderBy('last_activity_at', 'desc')
            ->get()
            ->map(function ($session) use ($request) {
                return [
                    'id' => $session->id,
                    'device_name' => $session->device_name,
                    'device_type' => $session->device_type,
                    'ip_address' => $session->ip_address,
                    'user_agent' => $session->user_agent,
                    'last_activity_at' => $session->last_activity_at,
                    'is_current' => $session->token === $request->bearerToken(),
                    'created_at' => $session->created_at,
                ];
            });

        return response()->json([
            'sessions' => $sessions,
        ]);
    }

    /**
     * Revoke a specific session
     */
    public function revoke(Request $request, string $sessionId): JsonResponse
    {
        $user = $request->user();

        $session = UserSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json([
                'message' => 'Session not found.',
            ], 404);
        }

        // Revoke the session
        $session->revoke();

        // Delete the corresponding Sanctum token if it exists
        $user->tokens()->where('token', hash('sha256', $session->token))->delete();

        return response()->json([
            'message' => 'Session revoked successfully.',
        ]);
    }

    /**
     * Revoke all sessions except the current one
     */
    public function revokeOthers(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentToken = $request->bearerToken();

        // Revoke all sessions except current
        UserSession::where('user_id', $user->id)
            ->where('token', '!=', $currentToken)
            ->update(['expires_at' => now()]);

        // Delete corresponding Sanctum tokens
        $user->tokens()
            ->where('token', '!=', hash('sha256', $currentToken))
            ->delete();

        return response()->json([
            'message' => 'All other sessions have been revoked.',
        ]);
    }

    /**
     * Revoke all sessions
     */
    public function revokeAll(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid password.',
            ], 400);
        }

        // Revoke all sessions
        UserSession::where('user_id', $user->id)
            ->update(['expires_at' => now()]);

        // Delete all Sanctum tokens
        $user->tokens()->delete();

        return response()->json([
            'message' => 'All sessions have been revoked. You have been logged out.',
        ]);
    }

    /**
     * Update current session activity
     */
    public function updateActivity(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $request->bearerToken();

        $session = UserSession::where('user_id', $user->id)
            ->where('token', $token)
            ->first();

        if ($session) {
            $session->update([
                'last_activity_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Activity updated.',
        ]);
    }

    /**
     * Get session statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalSessions = UserSession::where('user_id', $user->id)
            ->count();

        $activeSessions = UserSession::where('user_id', $user->id)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->count();

        $deviceTypes = UserSession::where('user_id', $user->id)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->select('device_type', \DB::raw('count(*) as count'))
            ->groupBy('device_type')
            ->get()
            ->pluck('count', 'device_type');

        return response()->json([
            'total_sessions' => $totalSessions,
            'active_sessions' => $activeSessions,
            'device_types' => $deviceTypes,
        ]);
    }
}
