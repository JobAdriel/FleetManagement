<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'view_dashboard',
            'view_vehicles',
            'create_vehicles',
            'edit_vehicles',
            'delete_vehicles',
            'view_drivers',
            'create_drivers',
            'edit_drivers',
            'delete_drivers',
            'view_service_requests',
            'create_service_requests',
            'edit_service_requests',
            'delete_service_requests',
            'view_quotes',
            'create_quotes',
            'edit_quotes',
            'delete_quotes',
            'view_work_orders',
            'create_work_orders',
            'edit_work_orders',
            'delete_work_orders',
            'view_preventive_rules',
            'create_preventive_rules',
            'edit_preventive_rules',
            'delete_preventive_rules',
            'view_invoices',
            'create_invoices',
            'edit_invoices',
            'delete_invoices',
            'view_reports',
            'manage_users',
            'manage_roles',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions
        
        // Admin role - all permissions
        $adminRole = Role::create(['name' => 'Admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Manager role - most permissions except user/role management
        $managerRole = Role::create(['name' => 'Manager']);
        $managerRole->givePermissionTo([
            'view_dashboard',
            'view_vehicles', 'create_vehicles', 'edit_vehicles', 'delete_vehicles',
            'view_drivers', 'create_drivers', 'edit_drivers', 'delete_drivers',
            'view_service_requests', 'create_service_requests', 'edit_service_requests', 'delete_service_requests',
            'view_quotes', 'create_quotes', 'edit_quotes', 'delete_quotes',
            'view_work_orders', 'create_work_orders', 'edit_work_orders', 'delete_work_orders',
            'view_preventive_rules', 'create_preventive_rules', 'edit_preventive_rules', 'delete_preventive_rules',
            'view_invoices', 'create_invoices', 'edit_invoices', 'delete_invoices',
            'view_reports',
        ]);

        // Technician role - work orders and service requests
        $technicianRole = Role::create(['name' => 'Technician']);
        $technicianRole->givePermissionTo([
            'view_dashboard',
            'view_vehicles',
            'view_service_requests', 'edit_service_requests',
            'view_work_orders', 'edit_work_orders',
        ]);

        // Dispatcher role - service requests and drivers
        $dispatcherRole = Role::create(['name' => 'Dispatcher']);
        $dispatcherRole->givePermissionTo([
            'view_dashboard',
            'view_vehicles', 'edit_vehicles',
            'view_drivers', 'create_drivers', 'edit_drivers',
            'view_service_requests', 'create_service_requests', 'edit_service_requests',
            'view_reports',
        ]);

        // Approver role - quotes and work orders approval
        $approverRole = Role::create(['name' => 'Approver']);
        $approverRole->givePermissionTo([
            'view_dashboard',
            'view_vehicles',
            'view_service_requests',
            'view_quotes', 'edit_quotes',
            'view_work_orders', 'create_work_orders',
            'view_reports',
        ]);
    }
}
