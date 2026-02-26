<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityEvent extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'event_type',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public $timestamps = false;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Log a security event
     */
    public static function log(
        ?string $userId,
        ?string $tenantId,
        string $eventType,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?array $metadata = null
    ): self {
        return self::create([
            'user_id' => $userId,
            'tenant_id' => $tenantId,
            'event_type' => $eventType,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
