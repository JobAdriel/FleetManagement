<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SecurityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class EnhancedAuthController extends Controller
{
    protected SecurityService $securityService;

    public function __construct(SecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    /**
     * Login with security checks
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        // Check if account is locked
        if ($this->securityService->isAccountLocked($user)) {
            $minutesRemaining = $this->securityService->getLockoutTimeRemaining($user);

            return response()->json([
                'message' => "Account is locked due to too many failed login attempts. Please try again in {$minutesRemaining} minutes.",
                'locked_until_minutes' => $minutesRemaining,
            ], 423);
        }

        // Verify password
        if (!Hash::check($request->password, $user->password)) {
            $this->securityService->recordFailedLogin(
                $user,
                $request->ip(),
                $request->header('User-Agent')
            );

            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        // Check if email is verified
        if (!$user->email_verified_at) {
            return response()->json([
                'message' => 'Please verify your email address before logging in.',
                'requires_verification' => true,
            ], 403);
        }

        // Check if 2FA is enabled
        if ($user->two_factor_enabled) {
            // Return a temporary token for 2FA verification
            $tempToken = $user->createToken('temp-2fa', ['verify-2fa'])->plainTextToken;

            return response()->json([
                'requires_2fa' => true,
                'temp_token' => $tempToken,
                'message' => 'Please provide your two-factor authentication code.',
            ]);
        }

        // Create access token
        $token = $user->createToken($request->device_name ?? 'web')->plainTextToken;

        // Record successful login
        $this->securityService->recordSuccessfulLogin(
            $user,
            $request->ip(),
            $request->header('User-Agent')
        );

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Logged in successfully.',
        ]);
    }

    /**
     * Register with enhanced password validation
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_id' => ['required', 'uuid', 'exists:tenants,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Validate password strength
        $passwordErrors = $this->securityService->validatePasswordStrength($request->password);
        if (!empty($passwordErrors)) {
            throw ValidationException::withMessages([
                'password' => $passwordErrors,
            ]);
        }

        $passwordHash = Hash::make($request->password);

        $user = User::create([
            'tenant_id' => $request->tenant_id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => $passwordHash,
        ]);

        // Save initial password to history
        $this->securityService->savePasswordToHistory($user, $passwordHash);

        // Log registration event
        $this->securityService->logEvent(
            $user,
            'user_registered',
            $request->ip(),
            $request->header('User-Agent')
        );

        return response()->json([
            'user' => $user,
            'message' => 'Registration successful. Please verify your email address.',
        ], 201);
    }

    /**
     * Change password with validation
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
            ], 400);
        }

        // Validate new password strength
        $passwordErrors = $this->securityService->validatePasswordStrength($request->new_password);
        if (!empty($passwordErrors)) {
            throw ValidationException::withMessages([
                'new_password' => $passwordErrors,
            ]);
        }

        // Check if password was used before
        if ($this->securityService->isPasswordReused($user, $request->new_password)) {
            return response()->json([
                'message' => 'You cannot reuse a recent password. Please choose a different password.',
            ], 400);
        }

        $newPasswordHash = Hash::make($request->new_password);

        // Update password
        $user->update([
            'password' => $newPasswordHash,
        ]);

        // Save to history
        $this->securityService->savePasswordToHistory($user, $newPasswordHash);

        // Log event
        $this->securityService->logEvent(
            $user,
            'password_changed',
            $request->ip(),
            $request->header('User-Agent')
        );

        // Revoke all tokens except current
        $currentToken = $request->bearerToken();
        $user->tokens()->where('token', '!=', hash('sha256', $currentToken))->delete();

        return response()->json([
            'message' => 'Password changed successfully. All other sessions have been logged out.',
        ]);
    }

    /**
     * Get user's security events
     */
    public function securityEvents(Request $request): JsonResponse
    {
        $user = $request->user();
        $events = $this->securityService->getUserSecurityEvents($user, 20);

        return response()->json([
            'events' => $events,
        ]);
    }
}
