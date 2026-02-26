<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Private user channel - for personal notifications
Broadcast::channel('user.{userId}', function (User $user, string $userId) {
    return (int) $user->id === (int) $userId;
});

// Tenant channel - for all users within a tenant
Broadcast::channel('tenant.{tenantId}', function (User $user, string $tenantId) {
    return $user->tenant_id === $tenantId;
});

// Presence channel for online users in a tenant
Broadcast::channel('tenant-presence.{tenantId}', function (User $user, string $tenantId) {
    if ($user->tenant_id === $tenantId) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }
    return false;
});

// Vehicle-specific channel (for real-time vehicle updates)
Broadcast::channel('vehicle.{vehicleId}', function (User $user, string $vehicleId) {
    // Check if user has access to this vehicle via tenant
    $vehicle = \App\Models\Vehicle::find($vehicleId);
    return $vehicle && $vehicle->tenant_id === $user->tenant_id;
});

// Service request channel
Broadcast::channel('service-request.{requestId}', function (User $user, string $requestId) {
    $request = \App\Models\ServiceRequest::find($requestId);
    return $request && $request->tenant_id === $user->tenant_id;
});
