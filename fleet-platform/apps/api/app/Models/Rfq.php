<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rfq extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['tenant_id', 'service_request_id', 'status', 'due_date'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function serviceRequest()
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }
}
