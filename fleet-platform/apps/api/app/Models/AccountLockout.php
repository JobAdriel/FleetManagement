<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountLockout extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'failed_attempts',
        'locked_until',
        'last_attempt_at',
    ];

    protected $casts = [
        'locked_until' => 'datetime',
        'last_attempt_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if account is locked
     */
    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    /**
     * Lock the account for the given minutes
     */
    public function lock(int $minutes): void
    {
        $this->update([
            'locked_until' => now()->addMinutes($minutes),
        ]);
    }

    /**
     * Unlock the account
     */
    public function unlock(): void
    {
        $this->update([
            'locked_until' => null,
            'failed_attempts' => 0,
        ]);
    }

    /**
     * Record a failed login attempt
     */
    public function recordFailedAttempt(): void
    {
        $this->increment('failed_attempts');
        $this->update([
            'last_attempt_at' => now(),
        ]);
    }
}
