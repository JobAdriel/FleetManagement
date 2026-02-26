<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DispatchRequest extends Model
{
    use HasUuids;

    protected $fillable = ['tenant_id', 'service_request_id', 'requested_by', 'status', 'urgency'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function serviceRequest()
    {
        return $this->belongsTo(ServiceRequest::class);
    }
}
