<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\OAuthConnection;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class OAuthController extends Controller
{
    /**
     * Redirect to OAuth provider
     */
    public function redirect(string $provider): JsonResponse
    {
        if (!in_array($provider, ['google', 'github', 'microsoft'])) {
            return response()->json([
                'message' => 'Unsupported OAuth provider.',
            ], 400);
        }

        $redirectUrl = Socialite::driver($provider)->stateless()->redirect()->getTargetUrl();

        return response()->json([
            'redirect_url' => $redirectUrl,
        ]);
    }

    /**
     * Handle OAuth callback
     */
    public function callback(string $provider, Request $request): JsonResponse
    {
        if (!in_array($provider, ['google', 'github', 'microsoft'])) {
            return response()->json([
                'message' => 'Unsupported OAuth provider.',
            ], 400);
        }

        try {
            $socialiteUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to authenticate with ' . $provider . '.',
                'error' => $e->getMessage(),
            ], 400);
        }

        // Check if OAuth connection already exists
        $oauthConnection = OAuthConnection::where('provider', $provider)
            ->where('provider_user_id', $socialiteUser->getId())
            ->first();

        if ($oauthConnection) {
            // Login existing user
            $user = $oauthConnection->user;

            // Update provider data
            $oauthConnection->update([
                'provider_email' => $socialiteUser->getEmail(),
                'provider_data' => [
                    'name' => $socialiteUser->getName(),
                    'avatar' => $socialiteUser->getAvatar(),
                ],
            ]);
        } else {
            // Check if user with this email already exists
            $user = User::where('email', $socialiteUser->getEmail())->first();

            if ($user) {
                // Link OAuth to existing user
                OAuthConnection::create([
                    'user_id' => $user->id,
                    'tenant_id' => $user->tenant_id,
                    'provider' => $provider,
                    'provider_user_id' => $socialiteUser->getId(),
                    'provider_email' => $socialiteUser->getEmail(),
                    'provider_data' => [
                        'name' => $socialiteUser->getName(),
                        'avatar' => $socialiteUser->getAvatar(),
                    ],
                    'connected_at' => now(),
                ]);
            } else {
                // Create new user
                $tenantId = $request->input('tenant_id') ?? $this->getDefaultTenantId();

                $user = User::create([
                    'tenant_id' => $tenantId,
                    'name' => $socialiteUser->getName(),
                    'email' => $socialiteUser->getEmail(),
                    'email_verified_at' => now(), // OAuth email is pre-verified
                    'password' => Hash::make(Str::random(32)), // Random password
                ]);

                // Create OAuth connection
                OAuthConnection::create([
                    'user_id' => $user->id,
                    'tenant_id' => $user->tenant_id,
                    'provider' => $provider,
                    'provider_user_id' => $socialiteUser->getId(),
                    'provider_email' => $socialiteUser->getEmail(),
                    'provider_data' => [
                        'name' => $socialiteUser->getName(),
                        'avatar' => $socialiteUser->getAvatar(),
                    ],
                    'connected_at' => now(),
                ]);
            }
        }

        // Create access token
        $token = $user->createToken('oauth-login')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Authenticated successfully via ' . $provider . '.',
        ]);
    }

    /**
     * Connect OAuth provider to existing user
     */
    public function connect(string $provider, Request $request): JsonResponse
    {
        if (!in_array($provider, ['google', 'github', 'microsoft'])) {
            return response()->json([
                'message' => 'Unsupported OAuth provider.',
            ], 400);
        }

        $user = $request->user();

        // Check if already connected
        $existing = OAuthConnection::where('user_id', $user->id)
            ->where('provider', $provider)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'This provider is already connected to your account.',
            ], 400);
        }

        try {
            $socialiteUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to connect with ' . $provider . '.',
                'error' => $e->getMessage(),
            ], 400);
        }

        // Create OAuth connection
        OAuthConnection::create([
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'provider' => $provider,
            'provider_user_id' => $socialiteUser->getId(),
            'provider_email' => $socialiteUser->getEmail(),
            'provider_data' => [
                'name' => $socialiteUser->getName(),
                'avatar' => $socialiteUser->getAvatar(),
            ],
            'connected_at' => now(),
        ]);

        return response()->json([
            'message' => $provider . ' connected successfully.',
        ]);
    }

    /**
     * Disconnect OAuth provider
     */
    public function disconnect(string $provider, Request $request): JsonResponse
    {
        $user = $request->user();

        $connection = OAuthConnection::where('user_id', $user->id)
            ->where('provider', $provider)
            ->first();

        if (!$connection) {
            return response()->json([
                'message' => 'This provider is not connected to your account.',
            ], 404);
        }

        // Check if user has a password set (don't disconnect if OAuth is the only auth method)
        if (!$user->password || Hash::check('', $user->password)) {
            $otherConnections = OAuthConnection::where('user_id', $user->id)
                ->where('provider', '!=', $provider)
                ->count();

            if ($otherConnections === 0) {
                return response()->json([
                    'message' => 'Cannot disconnect. Please set a password first or connect another provider.',
                ], 400);
            }
        }

        $connection->delete();

        return response()->json([
            'message' => $provider . ' disconnected successfully.',
        ]);
    }

    /**
     * List connected OAuth providers
     */
    public function list(Request $request): JsonResponse
    {
        $user = $request->user();

        $connections = OAuthConnection::where('user_id', $user->id)
            ->get()
            ->map(function ($connection) {
                return [
                    'provider' => $connection->provider,
                    'provider_email' => $connection->provider_email,
                    'connected_at' => $connection->connected_at,
                ];
            });

        return response()->json([
            'connections' => $connections,
        ]);
    }

    /**
     * Get default tenant ID or create a default tenant
     */
    protected function getDefaultTenantId(): string
    {
        // Get the default tenant or create one
        $tenant = \App\Models\Tenant::where('name', 'Default')->first();

        if (!$tenant) {
            $tenant = \App\Models\Tenant::create([
                'name' => 'Default',
                'domain' => 'default.example.com',
                'is_active' => true,
            ]);
        }

        return $tenant->id;
    }
}
