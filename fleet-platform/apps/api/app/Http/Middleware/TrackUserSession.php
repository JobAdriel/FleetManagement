<?php

namespace App\Http\Middleware;

use App\Models\UserSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackUserSession
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            $this->trackSession($request);
        }

        return $next($request);
    }

    protected function trackSession(Request $request): void
    {
        $user = $request->user();
        $token = $request->bearerToken();

        if (!$token) {
            return;
        }

        // Parse user agent
        $userAgent = $request->header('User-Agent');
        $deviceInfo = $this->parseUserAgent($userAgent);

        // Find or create session
        $session = UserSession::updateOrCreate(
            [
                'user_id' => $user->id,
                'token' => $token,
            ],
            [
                'tenant_id' => $user->tenant_id,
                'ip_address' => $request->ip(),
                'user_agent' => $userAgent,
                'device_name' => $deviceInfo['device_name'],
                'device_type' => $deviceInfo['device_type'],
                'last_activity_at' => now(),
                'expires_at' => null, // Sanctum handles expiration
            ]
        );
    }

    protected function parseUserAgent(?string $userAgent): array
    {
        if (!$userAgent) {
            return [
                'device_name' => 'Unknown Device',
                'device_type' => 'web',
            ];
        }

        $deviceType = 'web';
        $deviceName = 'Unknown Device';

        // Detect mobile
        if (preg_match('/mobile|android|iphone|ipad|phone/i', $userAgent)) {
            $deviceType = 'mobile';
        }

        // Detect device name
        if (preg_match('/iPhone/i', $userAgent)) {
            $deviceName = 'iPhone';
        } elseif (preg_match('/iPad/i', $userAgent)) {
            $deviceName = 'iPad';
        } elseif (preg_match('/Android/i', $userAgent)) {
            $deviceName = 'Android Device';
        } elseif (preg_match('/Windows/i', $userAgent)) {
            $deviceName = 'Windows PC';
        } elseif (preg_match('/Macintosh/i', $userAgent)) {
            $deviceName = 'Mac';
        } elseif (preg_match('/Linux/i', $userAgent)) {
            $deviceName = 'Linux PC';
        }

        // Detect browser
        $browser = 'Unknown Browser';
        if (preg_match('/Chrome/i', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/Firefox/i', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/Safari/i', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/Edge/i', $userAgent)) {
            $browser = 'Edge';
        }

        return [
            'device_name' => "$deviceName ($browser)",
            'device_type' => $deviceType,
        ];
    }
}
