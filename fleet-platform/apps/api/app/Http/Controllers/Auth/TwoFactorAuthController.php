<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorAuthController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Enable 2FA for the authenticated user
     */
    public function enable(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is already enabled.',
            ], 400);
        }

        // Generate secret
        $secret = $this->google2fa->generateSecretKey();

        // Generate QR code URL
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        // Generate recovery codes
        $recoveryCodes = $this->generateRecoveryCodes();

        // Store the secret temporarily (not activated yet)
        $user->update([
            'two_factor_secret' => encrypt($secret),
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
        ]);

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'recovery_codes' => $recoveryCodes,
            'message' => 'Scan the QR code with your authenticator app, then verify with a code to enable 2FA.',
        ]);
    }

    /**
     * Confirm and activate 2FA
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if ($user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is already enabled.',
            ], 400);
        }

        if (!$user->two_factor_secret) {
            return response()->json([
                'message' => 'Please enable 2FA first.',
            ], 400);
        }

        $secret = decrypt($user->two_factor_secret);

        // Verify the code
        $valid = $this->google2fa->verifyKey($secret, $request->code);

        if (!$valid) {
            return response()->json([
                'message' => 'Invalid verification code.',
            ], 400);
        }

        // Activate 2FA
        $user->update([
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Two-factor authentication has been enabled successfully.',
        ]);
    }

    /**
     * Disable 2FA
     */
    public function disable(Request $request): JsonResponse
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

        if (!$user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled.',
            ], 400);
        }

        $user->update([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        return response()->json([
            'message' => 'Two-factor authentication has been disabled.',
        ]);
    }

    /**
     * Verify 2FA code during login
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
            'user_id' => ['required', 'uuid'],
        ]);

        $user = \App\Models\User::find($request->user_id);

        if (!$user || !$user->two_factor_enabled) {
            return response()->json([
                'message' => 'Invalid request.',
            ], 400);
        }

        $secret = decrypt($user->two_factor_secret);

        // Check if it's a recovery code
        if ($this->verifyRecoveryCode($user, $request->code)) {
            return response()->json([
                'verified' => true,
                'message' => 'Recovery code accepted. Please set up 2FA again for security.',
            ]);
        }

        // Verify TOTP code
        $valid = $this->google2fa->verifyKey($secret, $request->code, 2); // 2 window = ±60 seconds

        if (!$valid) {
            return response()->json([
                'verified' => false,
                'message' => 'Invalid verification code.',
            ], 400);
        }

        return response()->json([
            'verified' => true,
            'message' => 'Verification successful.',
        ]);
    }

    /**
     * Get recovery codes
     */
    public function getRecoveryCodes(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled.',
            ], 400);
        }

        $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);

        return response()->json([
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Regenerate recovery codes
     */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
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

        if (!$user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled.',
            ], 400);
        }

        $recoveryCodes = $this->generateRecoveryCodes();

        $user->update([
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
        ]);

        return response()->json([
            'recovery_codes' => $recoveryCodes,
            'message' => 'Recovery codes have been regenerated.',
        ]);
    }

    /**
     * Generate recovery codes
     */
    protected function generateRecoveryCodes(): array
    {
        $codes = [];

        for ($i = 0; $i < 8; $i++) {
            $codes[] = strtoupper(substr(str_replace(['-', '_'], '', base64_encode(random_bytes(8))), 0, 10));
        }

        return $codes;
    }

    /**
     * Verify recovery code
     */
    protected function verifyRecoveryCode($user, string $code): bool
    {
        if (!$user->two_factor_recovery_codes) {
            return false;
        }

        $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);

        $index = array_search(strtoupper($code), $recoveryCodes);

        if ($index === false) {
            return false;
        }

        // Remove used recovery code
        unset($recoveryCodes[$index]);
        $recoveryCodes = array_values($recoveryCodes);

        $user->update([
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
        ]);

        return true;
    }
}
