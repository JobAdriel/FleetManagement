<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'ip_address',
        'user_agent',
        'device_name',
        'device_type',
        'token',
        'last_activity_at',
        'expires_at',
    ];

    protected $casts = [
        'last_activity_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isActive(): bool
    {
        if (!$this->expires_at) {
            return true;
        }

        return $this->expires_at->isFuture();
    }

    public function revoke(): void
    {
        $this->update(['expires_at' => now()]);
    }
}
