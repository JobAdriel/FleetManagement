<?php

namespace Database\Factories;

use App\Models\WorkOrder;
use App\Models\Quote;
use App\Models\Vendor;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class WorkOrderFactory extends Factory
{
    protected $model = WorkOrder::class;

    public function definition(): array
    {
        return [
            'id' => Str::uuid()->toString(),
            'tenant_id' => Tenant::factory(),
            'quote_id' => Quote::factory(),
            'shop_id' => Vendor::factory(),
            'assigned_to' => User::factory(),
            'status' => $this->faker->randomElement(['pending', 'in_progress', 'completed', 'cancelled']),
            'start_at' => null,
            'complete_at' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
            'start_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'start_at' => now()->subDays(5),
            'complete_at' => now(),
        ]);
    }
}
