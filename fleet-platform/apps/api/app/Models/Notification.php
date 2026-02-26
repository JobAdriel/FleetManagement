<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'recipient_id',
        'channel',
        'template',
        'payload',
        'sent_at',
        'status',
    ];

    protected $casts = [
        'payload' => 'array',
        'sent_at' => 'datetime',
    ];

    public function setUserIdAttribute(string|int $value): void
    {
        $this->attributes['recipient_id'] = $value;
    }

    public function getUserIdAttribute(): ?string
    {
        return $this->attributes['recipient_id'] ?? null;
    }

    public function setTypeAttribute(string $value): void
    {
        $this->attributes['template'] = $value;
    }

    public function getTypeAttribute(): ?string
    {
        return $this->attributes['template'] ?? null;
    }

    public function setIsSentAttribute(bool|int|string $value): void
    {
        $isSent = filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        $isSent = $isSent ?? ((int) $value === 1);

        $this->attributes['status'] = $isSent ? 'sent' : 'pending';
        if ($isSent && empty($this->attributes['sent_at'])) {
            $this->attributes['sent_at'] = now();
        }
    }

    public function getIsSentAttribute(): bool
    {
        return ($this->attributes['status'] ?? 'pending') === 'sent';
    }

    public function setTitleAttribute(string $value): void
    {
        $payload = $this->payload ?? [];
        $payload['title'] = $value;
        $this->attributes['payload'] = json_encode($payload);
    }

    public function getTitleAttribute(): ?string
    {
        return $this->payload['title'] ?? null;
    }

    public function setMessageAttribute(string $value): void
    {
        $payload = $this->payload ?? [];
        $payload['message'] = $value;
        $this->attributes['payload'] = json_encode($payload);
    }

    public function getMessageAttribute(): ?string
    {
        return $this->payload['message'] ?? null;
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function user()
    {
        return $this->recipient();
    }
}
