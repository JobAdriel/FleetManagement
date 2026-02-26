<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VehicleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $acbTenant = \App\Models\Tenant::where('slug', 'acb')->first();
        $sgsTenant = \App\Models\Tenant::where('slug', 'sgs')->first();
        $makes = ['Toyota', 'Hino', 'Isuzu', 'Volvo', 'Mercedes'];
        $models = ['HiAce', '300, 700', 'FVR', 'FH16', 'Actros'];
        $fuelTypes = ['Diesel', 'Gasoline', 'LPG'];

        // Create vehicles for ACB tenant
        for ($i = 1; $i <= 25; $i++) {
            $make = $makes[array_rand($makes)];
            \App\Models\Vehicle::create([
                'tenant_id' => $acbTenant->id,
                'plate' => 'ACB-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'vin' => 'VIN' . \Illuminate\Support\Str::random(14),
                'make' => $make,
                'model' => $models[array_rand($models)],
                'year' => rand(2015, 2024),
                'odometer' => rand(1000, 150000),
                'fuel_type' => $fuelTypes[array_rand($fuelTypes)],
                'status' => 'active',
                'cost_center' => 'CC' . str_pad(rand(1, 5), 3, '0', STR_PAD_LEFT),
            ]);
        }

        // Create vehicles for SGS tenant
        for ($i = 1; $i <= 50; $i++) {
            $make = $makes[array_rand($makes)];
            \App\Models\Vehicle::create([
                'tenant_id' => $sgsTenant->id,
                'plate' => 'SGS-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'vin' => 'VIN' . \Illuminate\Support\Str::random(14),
                'make' => $make,
                'model' => $models[array_rand($models)],
                'year' => rand(2015, 2024),
                'odometer' => rand(1000, 150000),
                'fuel_type' => $fuelTypes[array_rand($fuelTypes)],
                'status' => 'active',
                'cost_center' => 'CC' . str_pad(rand(1, 5), 3, '0', STR_PAD_LEFT),
            ]);
        }
    }
}
