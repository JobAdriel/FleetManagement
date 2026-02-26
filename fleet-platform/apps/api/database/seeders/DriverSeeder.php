<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DriverSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $acbTenant = \App\Models\Tenant::where('slug', 'acb')->first();
        $sgsTenant = \App\Models\Tenant::where('slug', 'sgs')->first();

        // Create drivers for ACB tenant
        for ($i = 1; $i <= 8; $i++) {
            \App\Models\Driver::create([
                'tenant_id' => $acbTenant->id,
                'name' => "ACB Driver $i",
                'license_number' => 'ACB-DL' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'license_class' => 'A',
                'license_expiry' => now()->addYears(3),
                'contact_phone' => '0917' . str_pad($i, 6, '0', STR_PAD_LEFT),
                'contact_email' => "driver$i@acb.local",
                'employment_status' => 'active',
            ]);
        }

        // Create drivers for SGS tenant
        for ($i = 1; $i <= 12; $i++) {
            \App\Models\Driver::create([
                'tenant_id' => $sgsTenant->id,
                'name' => "SGS Driver $i",
                'license_number' => 'SGS-DL' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'license_class' => 'A',
                'license_expiry' => now()->addYears(3),
                'contact_phone' => '0918' . str_pad($i, 6, '0', STR_PAD_LEFT),
                'contact_email' => "driver$i@sgs.local",
                'employment_status' => 'active',
            ]);
        }
    }
}
