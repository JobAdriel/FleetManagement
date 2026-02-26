<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $acbTenant = \App\Models\Tenant::where('slug', 'acb')->first();
        $sgsTenant = \App\Models\Tenant::where('slug', 'sgs')->first();

        // ACB Vendors
        $acbVendors = [
            ['name' => 'ACB Workshop', 'type' => 'internal', 'contact_email' => 'workshop@acb.local'],
            ['name' => 'Manila Motor Repair', 'type' => 'shop', 'contact_email' => 'mmr@vendors.com'],
            ['name' => 'Quezon Auto Service', 'type' => 'shop', 'contact_email' => 'qas@vendors.com'],
            ['name' => 'Parts Plus', 'type' => 'supplier', 'contact_email' => 'parts@vendors.com'],
        ];

        foreach ($acbVendors as $vendor) {
            \App\Models\Vendor::create([
                'tenant_id' => $acbTenant->id,
                'name' => $vendor['name'],
                'type' => $vendor['type'],
                'contact_email' => $vendor['contact_email'],
                'contact_phone' => '02-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                'status' => 'active',
            ]);
        }

        // SGS Vendors
        $sgsVendors = [
            ['name' => 'SGS Fleet Service', 'type' => 'internal', 'contact_email' => 'fleet@sgs.local'],
            ['name' => 'Premier Auto Works', 'type' => 'shop', 'contact_email' => 'paw@vendors.com'],
            ['name' => 'Express Parts Supply', 'type' => 'supplier', 'contact_email' => 'eps@vendors.com'],
        ];

        foreach ($sgsVendors as $vendor) {
            \App\Models\Vendor::create([
                'tenant_id' => $sgsTenant->id,
                'name' => $vendor['name'],
                'type' => $vendor['type'],
                'contact_email' => $vendor['contact_email'],
                'contact_phone' => '02-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                'status' => 'active',
            ]);
        }
    }
}
