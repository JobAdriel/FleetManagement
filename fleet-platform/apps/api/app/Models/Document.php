<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'storage_key',
        'original_filename',
        'mime_type',
        'size',
        'checksum',
        'entity_type',
        'entity_id',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFileSizeAttribute(): int
    {
        return (int) $this->size;
    }

    public function setFileSizeAttribute(int|string $value): void
    {
        $this->attributes['size'] = (int) $value;
    }

    public function getFileNameAttribute(): ?string
    {
        return $this->original_filename;
    }

    public function setFileNameAttribute(string $value): void
    {
        $this->attributes['original_filename'] = $value;
    }

    public function getFilePathAttribute(): ?string
    {
        return $this->storage_key;
    }

    public function setFilePathAttribute(string $value): void
    {
        $this->attributes['storage_key'] = $value;
    }
}
