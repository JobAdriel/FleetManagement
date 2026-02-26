<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\VehicleController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('vehicles', VehicleController::class);
});