<?php

namespace Database\Factories;

use App\Models\Rfq;
use App\Models\ServiceRequest;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RfqFactory extends Factory
{
    protected $model = Rfq::class;

    public function definition(): array
    {
        $serviceRequest = ServiceRequest::factory()->create();

        return [
            'id' => Str::uuid()->toString(),
            'tenant_id' => $serviceRequest->tenant_id,
            'service_request_id' => $serviceRequest->id,
            'due_date' => $this->faker->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'status' => $this->faker->randomElement(['draft', 'sent', 'closed']),
        ];
    }
}
