<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define all permissions
        $resources = ['vehicles', 'drivers', 'service_requests', 'quotes', 'work_orders', 'invoices', 'preventive_rules'];
        $actions = ['view', 'create', 'edit', 'delete'];

        // Create general permissions
        Permission::firstOrCreate(['name' => 'view_dashboard']);
        Permission::firstOrCreate(['name' => 'view_reports']);
        Permission::firstOrCreate(['name' => 'manage_users']);
        Permission::firstOrCreate(['name' => 'manage_roles']);

        // Create resource permissions
        foreach ($resources as $resource) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$action}_{$resource}"]);
            }
        }

        // Create roles
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $technicianRole = Role::firstOrCreate(['name' => 'technician']);
        $dispatcherRole = Role::firstOrCreate(['name' => 'dispatcher']);
        $approverRole = Role::firstOrCreate(['name' => 'approver']);

        // Assign all permissions to admin
        $adminRole->syncPermissions(Permission::all());

        // Manager: Can view/edit most things, approve quotes/work orders
        $managerPermissions = [
            'view_dashboard', 'view_reports',
            'view_vehicles', 'edit_vehicles',
            'view_drivers', 'edit_drivers',
            'view_service_requests', 'create_service_requests', 'edit_service_requests',
            'view_quotes', 'edit_quotes',
            'view_work_orders', 'edit_work_orders',
            'view_invoices', 'edit_invoices',
            'view_preventive_rules',
        ];
        $managerRole->syncPermissions($managerPermissions);

        // Technician: Can view work orders, update status
        $technicianPermissions = [
            'view_work_orders', 'edit_work_orders',
            'view_quotes',
            'view_service_requests',
            'view_vehicles',
            'view_drivers',
        ];
        $technicianRole->syncPermissions($technicianPermissions);

        // Dispatcher: Can create service requests, view vehicles/drivers
        $dispatcherPermissions = [
            'view_dashboard',
            'view_vehicles',
            'view_drivers',
            'view_service_requests', 'create_service_requests', 'edit_service_requests',
            'view_work_orders',
            'view_invoices',
        ];
        $dispatcherRole->syncPermissions($dispatcherPermissions);

        // Approver: Can approve quotes and invoices
        $approverPermissions = [
            'view_dashboard',
            'view_quotes', 'edit_quotes',
            'view_invoices', 'edit_invoices',
            'view_service_requests',
            'view_work_orders',
            'view_vehicles',
        ];
        $approverRole->syncPermissions($approverPermissions);

        // Assign roles to seeded users
        // ACB Tenant
        $acbAdmin = User::where('email', 'admin@acb.local')->first();
        if ($acbAdmin) {
            $acbAdmin->assignRole('admin');
        }

        $acbSM = User::where('email', 'sm@acb.local')->first();
        if ($acbSM) {
            $acbSM->assignRole('manager');
        }

        $acbWorkshop = User::where('email', 'workshop@acb.local')->first();
        if ($acbWorkshop) {
            $acbWorkshop->assignRole('technician');
        }

        // SGS Tenant
        $sgsOwner = User::where('email', 'owner@sgs.local')->first();
        if ($sgsOwner) {
            $sgsOwner->assignRole('admin');
        }

        $sgsApprover = User::where('email', 'approver@sgs.local')->first();
        if ($sgsApprover) {
            $sgsApprover->assignRole('approver');
        }

        $sgsDispatcher = User::where('email', 'dispatcher@sgs.local')->first();
        if ($sgsDispatcher) {
            $sgsDispatcher->assignRole('dispatcher');
        }

        echo "✓ Roles and permissions seeded successfully!\n";
    }
}
