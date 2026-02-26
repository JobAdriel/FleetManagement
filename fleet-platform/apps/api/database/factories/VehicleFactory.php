<?php

namespace Database\Factories;

use App\Models\Tenant;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    public function definition(): array
    {
        $tenantId = Tenant::query()->value('id');
        if (!$tenantId) {
            $name = $this->faker->unique()->company;
            $tenantId = Tenant::create([
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => $this->faker->sentence(6),
                'is_active' => true,
            ])->id;
        }

        return [
            'tenant_id' => $tenantId,
            'plate' => strtoupper($this->faker->bothify('??-####')),
            'vin' => strtoupper($this->faker->bothify('1HG##############')),
            'make' => $this->faker->randomElement(['Ford', 'Toyota', 'Honda', 'Nissan', 'Chevrolet']),
            'model' => $this->faker->word(),
            'year' => $this->faker->numberBetween(2015, (int) date('Y')),
            'odometer' => $this->faker->numberBetween(0, 200000),
            'fuel_type' => $this->faker->randomElement(['gas', 'diesel', 'hybrid', 'electric']),
            'status' => $this->faker->randomElement(['active', 'inactive', 'maintenance']),
            'assigned_driver_id' => null,
            'cost_center' => $this->faker->optional()->bothify('CC-###'),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    public function inMaintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'maintenance',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
