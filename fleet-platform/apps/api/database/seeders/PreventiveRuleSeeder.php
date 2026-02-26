<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PreventiveRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $acbTenant = \App\Models\Tenant::where('slug', 'acb')->first();
        $sgsTenant = \App\Models\Tenant::where('slug', 'sgs')->first();

        $rules = [
            [
                'name' => 'Oil Change',
                'rule_type' => 'km',
                'interval_value' => 10000,
                'interval_unit' => 'km',
            ],
            [
                'name' => 'Inspection',
                'rule_type' => 'months',
                'interval_value' => 6,
                'interval_unit' => 'months',
            ],
            [
                'name' => 'Tire Rotation',
                'rule_type' => 'km',
                'interval_value' => 15000,
                'interval_unit' => 'km',
            ],
            [
                'name' => 'Filter Replacement',
                'rule_type' => 'km',
                'interval_value' => 20000,
                'interval_unit' => 'km',
            ],
        ];

        // Create rules for ACB tenant
        foreach ($rules as $rule) {
            \App\Models\PreventiveRule::create([
                'tenant_id' => $acbTenant->id,
                ...$rule,
                'is_active' => true,
            ]);
        }

        // Create rules for SGS tenant
        foreach ($rules as $rule) {
            \App\Models\PreventiveRule::create([
                'tenant_id' => $sgsTenant->id,
                ...$rule,
                'is_active' => true,
            ]);
        }
    }
}
