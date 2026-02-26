<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EnhancedAuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\TwoFactorAuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\OAuthController;
use App\Http\Controllers\Auth\SessionManagementController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\ServiceRequestController;
use App\Http\Controllers\RfqController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\WorkOrderController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PreventiveRuleController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;

// Public auth routes
// CSRF token endpoint for stateful requests
Route::post('/sanctum/csrf-cookie', function (Request $request) {
    return response()->json(['message' => 'CSRF cookie set']);
});

Route::post('/login', [AuthController::class, 'login']); // Using basic AuthController instead of Enhanced for now
Route::post('/register', [AuthController::class, 'register']);

// Password Reset
Route::post('/password/forgot', [PasswordResetController::class, 'forgotPassword']);
Route::post('/password/reset', [PasswordResetController::class, 'resetPassword']);
Route::post('/password/validate-token', [PasswordResetController::class, 'validateToken']);

// Email Verification
Route::post('/email/verify', [EmailVerificationController::class, 'verify']);

// OAuth
Route::get('/oauth/{provider}/redirect', [OAuthController::class, 'redirect']);
Route::get('/oauth/{provider}/callback', [OAuthController::class, 'callback']);

// Health check (public)
Route::get('/healthz', function () {
    return response()->json(['status' => 'ok']);
});

// Protected routes (require Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    // Auth endpoints
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);

    // Password Management
    Route::post('/password/change', [EnhancedAuthController::class, 'changePassword']);

    // Two-Factor Authentication
    Route::prefix('2fa')->group(function () {
        Route::post('/enable', [TwoFactorAuthController::class, 'enable']);
        Route::post('/confirm', [TwoFactorAuthController::class, 'confirm']);
        Route::post('/disable', [TwoFactorAuthController::class, 'disable']);
        Route::post('/verify', [TwoFactorAuthController::class, 'verify']);
        Route::get('/recovery-codes', [TwoFactorAuthController::class, 'getRecoveryCodes']);
        Route::post('/recovery-codes/regenerate', [TwoFactorAuthController::class, 'regenerateRecoveryCodes']);
    });

    // Email Verification
    Route::post('/email/send-verification', [EmailVerificationController::class, 'send']);
    Route::get('/email/verification-status', [EmailVerificationController::class, 'status']);

    // OAuth Management
    Route::prefix('oauth')->group(function () {
        Route::get('/connections', [OAuthController::class, 'list']);
        Route::post('/{provider}/connect', [OAuthController::class, 'connect']);
        Route::delete('/{provider}/disconnect', [OAuthController::class, 'disconnect']);
    });

    // Session Management
    Route::prefix('sessions')->group(function () {
        Route::get('/', [SessionManagementController::class, 'index']);
        Route::delete('/{session}', [SessionManagementController::class, 'revoke']);
        Route::post('/revoke-others', [SessionManagementController::class, 'revokeOthers']);
        Route::post('/revoke-all', [SessionManagementController::class, 'revokeAll']);
        Route::post('/update-activity', [SessionManagementController::class, 'updateActivity']);
        Route::get('/statistics', [SessionManagementController::class, 'statistics']);
    });

    // Security Events
    Route::get('/security/events', [EnhancedAuthController::class, 'securityEvents']);

    // Fleet & Maintenance Resources
    Route::apiResource('vehicles', VehicleController::class);
    Route::apiResource('drivers', DriverController::class);
    Route::apiResource('service-requests', ServiceRequestController::class);
    Route::apiResource('rfqs', RfqController::class);
    Route::apiResource('quotes', QuoteController::class);
    Route::apiResource('vendors', VendorController::class);
    Route::apiResource('approvals', ApprovalController::class)->except(['update']);
    Route::apiResource('work-orders', WorkOrderController::class);
    Route::apiResource('invoices', InvoiceController::class);
    Route::apiResource('preventive-rules', PreventiveRuleController::class);
    
    // User & Role Management
    Route::apiResource('users', UserController::class);
    Route::apiResource('roles', RoleController::class);
    Route::get('/permissions', [RoleController::class, 'permissions']);
    Route::post('/roles/{role}/permissions', [RoleController::class, 'assignPermissions']);
    
    // Preventive Maintenance
    Route::get('/preventive-rules/next-due/calculate', [PreventiveRuleController::class, 'nextDue']);

    // Documents & Notifications
    Route::apiResource('documents', DocumentController::class)->except(['update']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::apiResource('notifications', NotificationController::class)->only(['index', 'show', 'destroy']);
    Route::patch('/notifications/{notification}/mark-sent', [NotificationController::class, 'markAsSent']);

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/fleet-status', [ReportController::class, 'fleetStatus']);
        Route::get('/maintenance-summary', [ReportController::class, 'maintenanceSummary']);
        Route::get('/work-order-status', [ReportController::class, 'workOrderStatus']);
        Route::get('/cost-analysis', [ReportController::class, 'costAnalysis']);
        Route::get('/maintenance-spend', [ReportController::class, 'maintenanceSpend']);
        Route::get('/vehicle-downtime', [ReportController::class, 'vehicleDowntime']);
        Route::get('/request-cycle-time', [ReportController::class, 'requestCycleTime']);
        Route::get('/fleet-summary', [ReportController::class, 'fleetSummary']);
    });
});
