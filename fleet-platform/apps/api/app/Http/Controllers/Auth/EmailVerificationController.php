<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\EmailVerificationMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class EmailVerificationController extends Controller
{
    /**
     * Send email verification link
     */
    public function send(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email is already verified.',
            ], 400);
        }

        $token = Str::random(64);

        // Store verification token
        \DB::table('email_verification_tokens')->updateOrInsert(
            ['user_id' => $user->id],
            [
                'id' => Str::uuid(),
                'token' => Hash::make($token),
                'expires_at' => now()->addHours(24),
                'created_at' => now(),
            ]
        );

        // Send verification email
        Mail::to($user->email)->send(new EmailVerificationMail($user, $token));

        return response()->json([
            'message' => 'Verification email sent successfully.',
        ]);
    }

    /**
     * Verify email with token
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
        ]);

        $user = $request->user();

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email is already verified.',
            ], 400);
        }

        $verificationRecord = \DB::table('email_verification_tokens')
            ->where('user_id', $user->id)
            ->first();

        if (!$verificationRecord) {
            return response()->json([
                'message' => 'Invalid verification token.',
            ], 400);
        }

        // Check expiration
        if (now()->isAfter($verificationRecord->expires_at)) {
            \DB::table('email_verification_tokens')->where('user_id', $user->id)->delete();
            
            return response()->json([
                'message' => 'Verification token has expired. Please request a new one.',
            ], 400);
        }

        // Verify token
        if (!Hash::check($request->token, $verificationRecord->token)) {
            return response()->json([
                'message' => 'Invalid verification token.',
            ], 400);
        }

        // Mark email as verified
        $user->update([
            'email_verified_at' => now(),
        ]);

        // Delete verification token
        \DB::table('email_verification_tokens')->where('user_id', $user->id)->delete();

        return response()->json([
            'message' => 'Email verified successfully.',
        ]);
    }

    /**
     * Check if email needs verification
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'verified' => $user->email_verified_at !== null,
            'email' => $user->email,
            'verified_at' => $user->email_verified_at,
        ]);
    }
}
