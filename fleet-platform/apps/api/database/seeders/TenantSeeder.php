<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Tenant::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'name' => 'ACB (Operations)',
            'slug' => 'acb',
            'description' => 'ACB Provider Tenant',
            'is_active' => true,
        ]);

        \App\Models\Tenant::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'name' => 'SGS Philippines',
            'slug' => 'sgs',
            'description' => 'SGS Client Fleet Tenant',
            'is_active' => true,
        ]);
    }
}
