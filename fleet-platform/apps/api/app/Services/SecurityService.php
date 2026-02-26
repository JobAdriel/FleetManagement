<?php

namespace App\Services;

use App\Models\AccountLockout;
use App\Models\PasswordHistory;
use App\Models\SecurityEvent;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SecurityService
{
    const MAX_LOGIN_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15; // minutes
    const PASSWORD_HISTORY_COUNT = 5; // Remember last 5 passwords

    /**
     * Check if account is locked
     */
    public function isAccountLocked(User $user): bool
    {
        $lockout = AccountLockout::firstOrCreate(['user_id' => $user->id]);
        return $lockout->isLocked();
    }

    /**
     * Get lockout time remaining
     */
    public function getLockoutTimeRemaining(User $user): ?int
    {
        $lockout = AccountLockout::where('user_id', $user->id)->first();

        if (!$lockout || !$lockout->isLocked()) {
            return null;
        }

        return $lockout->locked_until->diffInMinutes(now());
    }

    /**
     * Record a failed login attempt
     */
    public function recordFailedLogin(User $user, string $ipAddress, string $userAgent): void
    {
        $lockout = AccountLockout::firstOrCreate(['user_id' => $user->id]);
        $lockout->recordFailedAttempt();

        // Lock account if max attempts reached
        if ($lockout->failed_attempts >= self::MAX_LOGIN_ATTEMPTS) {
            $lockout->lock(self::LOCKOUT_DURATION);

            SecurityEvent::log(
                $user->id,
                $user->tenant_id,
                'account_locked',
                $ipAddress,
                $userAgent,
                [
                    'failed_attempts' => $lockout->failed_attempts,
                    'locked_until' => $lockout->locked_until,
                ]
            );
        }

        SecurityEvent::log(
            $user->id,
            $user->tenant_id,
            'login_failed',
            $ipAddress,
            $userAgent,
            [
                'failed_attempts' => $lockout->failed_attempts,
            ]
        );
    }

    /**
     * Record a successful login
     */
    public function recordSuccessfulLogin(User $user, string $ipAddress, string $userAgent): void
    {
        // Reset failed attempts
        $lockout = AccountLockout::where('user_id', $user->id)->first();
        if ($lockout) {
            $lockout->unlock();
        }

        SecurityEvent::log(
            $user->id,
            $user->tenant_id,
            'login_success',
            $ipAddress,
            $userAgent
        );
    }

    /**
     * Check if password was used before
     */
    public function isPasswordReused(User $user, string $newPassword): bool
    {
        $recentPasswords = PasswordHistory::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(self::PASSWORD_HISTORY_COUNT)
            ->get();

        foreach ($recentPasswords as $history) {
            if (Hash::check($newPassword, $history->password_hash)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Save password to history
     */
    public function savePasswordToHistory(User $user, string $passwordHash): void
    {
        PasswordHistory::create([
            'user_id' => $user->id,
            'password_hash' => $passwordHash,
            'created_at' => now(),
        ]);

        // Keep only recent passwords
        $keepIds = PasswordHistory::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(self::PASSWORD_HISTORY_COUNT)
            ->pluck('id');

        PasswordHistory::where('user_id', $user->id)
            ->whereNotIn('id', $keepIds)
            ->delete();
    }

    /**
     * Validate password strength
     */
    public function validatePasswordStrength(string $password): array
    {
        $errors = [];

        if (strlen($password) < 8) {
            $errors[] = 'Password must be at least 8 characters long.';
        }

        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter.';
        }

        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter.';
        }

        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number.';
        }

        if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
            $errors[] = 'Password must contain at least one special character.';
        }

        // Check for common passwords
        $commonPasswords = [
            'password', '12345678', 'qwerty', 'abc123', 'password123',
            'admin', 'letmein', 'welcome', 'monkey', '1234567890',
        ];

        if (in_array(strtolower($password), $commonPasswords)) {
            $errors[] = 'Password is too common. Please choose a stronger password.';
        }

        return $errors;
    }

    /**
     * Log a security event
     */
    public function logEvent(
        User $user,
        string $eventType,
        string $ipAddress,
        string $userAgent,
        ?array $metadata = null
    ): void {
        SecurityEvent::log(
            $user->id,
            $user->tenant_id,
            $eventType,
            $ipAddress,
            $userAgent,
            $metadata
        );
    }

    /**
     * Get user's recent security events
     */
    public function getUserSecurityEvents(User $user, int $limit = 10): array
    {
        return SecurityEvent::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($event) {
                return [
                    'event_type' => $event->event_type,
                    'ip_address' => $event->ip_address,
                    'created_at' => $event->created_at,
                    'metadata' => $event->metadata,
                ];
            })
            ->toArray();
    }
}
