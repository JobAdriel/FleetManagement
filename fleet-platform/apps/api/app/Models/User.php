<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Append roles and permissions to user serialization
     */
    protected $appends = ['roles_names', 'permissions_names'];

    /**
     * Get the tenant this user belongs to
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'recipient_id');
    }

    /**
     * Get role names as array
     */
    public function getRolesNamesAttribute()
    {
        return $this->roles->pluck('name')->toArray();
    }

    /**
     * Get permission names as array
     */
    public function getPermissionsNamesAttribute()
    {
        return $this->getAllPermissions()->pluck('name')->toArray();
    }
}
