<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            TenantSeeder::class,
            RoleSeeder::class,
            UserSeeder::class,
            DriverSeeder::class,
            VehicleSeeder::class,
            VendorSeeder::class,
            PreventiveRuleSeeder::class,
            InvoiceSeeder::class,
        ]);
    }
}
