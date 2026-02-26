<?php

namespace Tests\Helpers;

use App\Models\User;
use App\Models\Tenant;
use Laravel\Sanctum\Sanctum;

/**
 * Helper class for authentication in tests
 */
class AuthHelper
{
    /**
     * Create and authenticate a user with Sanctum
     */
    public static function actingAs(?User $user = null, ?Tenant $tenant = null): User
    {
        if (!$tenant) {
            $tenant = Tenant::factory()->create();
        }

        if (!$user) {
            $user = User::factory()->create([
                'tenant_id' => $tenant->id,
            ]);
        }

        Sanctum::actingAs($user);

        return $user;
    }

    /**
     * Create an admin user
     */
    public static function createAdmin(?Tenant $tenant = null): User
    {
        if (!$tenant) {
            $tenant = Tenant::factory()->create();
        }

        return User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'admin',
        ]);
    }

    /**
     * Create a manager user
     */
    public static function createManager(?Tenant $tenant = null): User
    {
        if (!$tenant) {
            $tenant = Tenant::factory()->create();
        }

        return User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'manager',
        ]);
    }

    /**
     * Create a regular user
     */
    public static function createUser(?Tenant $tenant = null): User
    {
        if (!$tenant) {
            $tenant = Tenant::factory()->create();
        }

        return User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => 'user',
        ]);
    }

    /**
     * Create and authenticate as admin
     */
    public static function actingAsAdmin(?Tenant $tenant = null): User
    {
        $admin = self::createAdmin($tenant);
        Sanctum::actingAs($admin);
        return $admin;
    }

    /**
     * Create and authenticate as manager
     */
    public static function actingAsManager(?Tenant $tenant = null): User
    {
        $manager = self::createManager($tenant);
        Sanctum::actingAs($manager);
        return $manager;
    }
}
