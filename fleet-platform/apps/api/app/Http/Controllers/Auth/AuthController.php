<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    /**
     * Login user and return token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Load roles and permissions
        $user->load('roles.permissions', 'permissions');

        $userData = $user->toArray();
        $userData['roles_names'] = $user->getRoleNames();
        $userData['permissions_names'] = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'user' => $userData,
            'token' => $user->createToken('auth-token')->plainTextToken,
        ]);
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'tenant_id' => 'required|uuid|exists:tenants,id',
        ]);

        $user = User::create([
            'tenant_id' => $request->tenant_id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('auth-token')->plainTextToken,
        ], 201);
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request)
    {
        $bearerToken = $request->bearerToken();
        if ($bearerToken) {
            $tokenId = null;
            $plainToken = $bearerToken;

            if (str_contains($bearerToken, '|')) {
                [$tokenId, $plainToken] = explode('|', $bearerToken, 2);
            }

            if ($tokenId) {
                PersonalAccessToken::where('id', $tokenId)->delete();
            }

            PersonalAccessToken::where('token', hash('sha256', $plainToken))->delete();
        }

        $request->user()->tokens()->delete();

        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Refresh user token
     */
    public function refresh(Request $request)
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('auth-token')->plainTextToken,
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
