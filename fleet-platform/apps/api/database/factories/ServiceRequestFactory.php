<?php

namespace Database\Factories;

use App\Models\ServiceRequest;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceRequestFactory extends Factory
{
    protected $model = ServiceRequest::class;

    public function definition(): array
    {
        $vehicle = Vehicle::factory()->create();

        return [
            'tenant_id' => $vehicle->tenant_id,
            'vehicle_id' => $vehicle->id,
            'issue_description' => $this->faker->sentence(10),
            'priority' => $this->faker->randomElement(['low', 'normal', 'high']),
            'status' => $this->faker->randomElement(['draft', 'submitted', 'cancelled']),
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
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
}
