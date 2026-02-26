<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OAuthConnection extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'provider',
        'provider_user_id',
        'provider_email',
        'provider_data',
        'connected_at',
    ];

    protected $casts = [
        'provider_data' => 'array',
        'connected_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
