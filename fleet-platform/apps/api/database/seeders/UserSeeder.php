<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $acbTenant = \App\Models\Tenant::where('slug', 'acb')->first();
        $sgsTenant = \App\Models\Tenant::where('slug', 'sgs')->first();

        // ACB Users
        $acbAdmin = \App\Models\User::create([
            'tenant_id' => $acbTenant->id,
            'name' => 'ACB Admin',
            'email' => 'admin@acb.local',
            'password' => \Hash::make('password'),
        ]);
        $acbAdmin->assignRole('Admin');

        $acbManager = \App\Models\User::create([
            'tenant_id' => $acbTenant->id,
            'name' => 'ACB Service Manager',
            'email' => 'sm@acb.local',
            'password' => \Hash::make('password'),
        ]);
        $acbManager->assignRole('Manager');

        $acbWorkshop = \App\Models\User::create([
            'tenant_id' => $acbTenant->id,
            'name' => 'ACB Workshop',
            'email' => 'workshop@acb.local',
            'password' => \Hash::make('password'),
        ]);
        $acbWorkshop->assignRole('Technician');

        // SGS Users
        $sgsOwner = \App\Models\User::create([
            'tenant_id' => $sgsTenant->id,
            'name' => 'SGS Fleet Owner',
            'email' => 'owner@sgs.local',
            'password' => \Hash::make('password'),
        ]);
        $sgsOwner->assignRole('Admin');

        $sgsApprover = \App\Models\User::create([
            'tenant_id' => $sgsTenant->id,
            'name' => 'SGS Approver',
            'email' => 'approver@sgs.local',
            'password' => \Hash::make('password'),
        ]);
        $sgsApprover->assignRole('Approver');

        $sgsDispatcher = \App\Models\User::create([
            'tenant_id' => $sgsTenant->id,
            'name' => 'SGS Dispatcher',
            'email' => 'dispatcher@sgs.local',
            'password' => \Hash::make('password'),
        ]);
        $sgsDispatcher->assignRole('Dispatcher');
    }
}
