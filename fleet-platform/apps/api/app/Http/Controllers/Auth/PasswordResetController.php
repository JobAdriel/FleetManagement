<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class PasswordResetController extends Controller
{
    /**
     * Request a password reset link
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Don't reveal that the user doesn't exist
            return response()->json([
                'message' => 'If an account exists with this email, you will receive a password reset link.',
            ]);
        }

        $token = Str::random(64);

        // Store token in password_reset_tokens table
        \DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        // Send email with reset link
        Mail::to($user->email)->send(new PasswordResetMail($user, $token));

        return response()->json([
            'message' => 'If an account exists with this email, you will receive a password reset link.',
        ]);
    }

    /**
     * Reset the password using the token
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()
            ],
        ]);

        $resetRecord = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 400);
        }

        // Check if token is valid (not older than 1 hour)
        if (now()->diffInHours($resetRecord->created_at) > 1) {
            \DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            
            return response()->json([
                'message' => 'Reset token has expired. Please request a new one.',
            ], 400);
        }

        // Verify token
        if (!Hash::check($request->token, $resetRecord->token)) {
            return response()->json([
                'message' => 'Invalid reset token.',
            ], 400);
        }

        // Update password
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Delete the reset token
        \DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password has been reset successfully. Please log in with your new password.',
        ]);
    }

    /**
     * Validate a reset token
     */
    public function validateToken(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
        ]);

        $resetRecord = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid token.',
            ], 400);
        }

        // Check expiration
        if (now()->diffInHours($resetRecord->created_at) > 1) {
            \DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            
            return response()->json([
                'valid' => false,
                'message' => 'Token has expired.',
            ], 400);
        }

        // Verify token
        if (!Hash::check($request->token, $resetRecord->token)) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid token.',
            ], 400);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Token is valid.',
        ]);
    }
}
