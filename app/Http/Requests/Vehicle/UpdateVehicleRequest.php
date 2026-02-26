<?php

namespace App\Http\Requests\Vehicle;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $vehicleId = $this->route('vehicle')?->id ?? $this->route('vehicle');

        return [
            'plate_no' => ['required', 'string', 'max:30', Rule::unique('vehicles', 'plate_no')->ignore($vehicleId)],
            'make' => ['required', 'string', 'max:100'],
            'model' => ['required', 'string', 'max:100'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'status' => ['required', Rule::in(['active', 'in_maintenance', 'inactive'])],
            'odometer' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}