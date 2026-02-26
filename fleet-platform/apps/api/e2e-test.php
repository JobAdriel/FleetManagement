#!/usr/bin/env php
<?php
/**
 * E2E Test Runner - Tests complete workflow and RBAC
 * 
 * Usage: php e2e-test.php
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\User;
use App\Models\Vehicle;
use App\Models\ServiceRequest;
use App\Models\Quote;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Artisan;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\RolePermissionSeeder;

// Colors for terminal output
class Color {
    const GREEN = "\033[32m";
    const RED = "\033[31m";
    const YELLOW = "\033[33m";
    const BLUE = "\033[34m";
    const RESET = "\033[0m";
}

$tests = [
    'passed' => 0,
    'failed' => 0,
    'errors' => [],
];

function log_test($name, $passed, $message = '') {
    global $tests;
    if ($passed) {
        echo Color::GREEN . "✓ PASS" . Color::RESET . " - $name\n";
        $tests['passed']++;
    } else {
        echo Color::RED . "✗ FAIL" . Color::RESET . " - $name\n";
        if ($message) echo "  └─ $message\n";
        $tests['failed']++;
        $tests['errors'][] = $name;
    }
}

echo Color::BLUE . "\n=== Fleet Management E2E Test Suite ===\n" . Color::RESET;
echo "Running on: " . env('APP_ENV', 'testing') . " @ " . date('Y-m-d H:i:s') . "\n\n";

if (User::count() === 0) {
    Artisan::call('db:seed', ['--class' => DatabaseSeeder::class]);
}
Artisan::call('db:seed', ['--class' => RolePermissionSeeder::class]);

// ===== SECTION 1: USER AUTHENTICATION & ROLES =====
echo Color::BLUE . "\n[1] Authentication & Roles\n" . Color::RESET;

$adminUser = User::where('email', 'admin@acb.local')->first();
$managerUser = User::where('email', 'sm@acb.local')->first();
$technicianUser = User::where('email', 'workshop@acb.local')->first();
$dispatcherUser = User::where('email', 'dispatcher@sgs.local')->first();
$approverUser = User::where('email', 'approver@sgs.local')->first();

log_test(
    "Admin user exists with correct role",
    $adminUser && $adminUser->hasRole('admin'),
    $adminUser ? "Roles: " . implode(', ', $adminUser->roles_names) : "User not found"
);

log_test(
    "Manager user exists with correct role",
    $managerUser && $managerUser->hasRole('manager'),
    $managerUser ? "Roles: " . implode(', ', $managerUser->roles_names) : "User not found"
);

log_test(
    "Technician user exists with correct role",
    $technicianUser && $technicianUser->hasRole('technician'),
    $technicianUser ? "Roles: " . implode(', ', $technicianUser->roles_names) : "User not found"
);

log_test(
    "Dispatcher user exists with correct role",
    $dispatcherUser && $dispatcherUser->hasRole('dispatcher'),
    $dispatcherUser ? "Roles: " . implode(', ', $dispatcherUser->roles_names) : "User not found"
);

log_test(
    "Approver user exists with correct role",
    $approverUser && $approverUser->hasRole('approver'),
    $approverUser ? "Roles: " . implode(', ', $approverUser->roles_names) : "User not found"
);

// ===== SECTION 2: PERMISSIONS =====
echo Color::BLUE . "\n[2] Permissions\n" . Color::RESET;

log_test(
    "Admin has all permissions",
    $adminUser && count($adminUser->permissions_names) >= 28,
    $adminUser ? "Permissions: " . count($adminUser->permissions_names) : "N/A"
);

log_test(
    "Manager has scoped permissions (10+)",
    $managerUser && count($managerUser->permissions_names) >= 10,
    $managerUser ? "Permissions: " . count($managerUser->permissions_names) : "N/A"
);

log_test(
    "Technician has limited permissions (5+)",
    $technicianUser && count($technicianUser->permissions_names) >= 5,
    $technicianUser ? "Permissions: " . count($technicianUser->permissions_names) : "N/A"
);

log_test(
    "Admin has 'view_dashboard' permission",
    $adminUser && $adminUser->hasPermissionTo('view_dashboard'),
    ""
);

log_test(
    "Manager has 'view_vehicles' permission",
    $managerUser && $managerUser->hasPermissionTo('view_vehicles'),
    ""
);

log_test(
    "Technician has 'view_work_orders' permission",
    $technicianUser && $technicianUser->hasPermissionTo('view_work_orders'),
    ""
);

// ===== SECTION 3: TENANT ISOLATION =====
echo Color::BLUE . "\n[3] Tenant Isolation\n" . Color::RESET;

log_test(
    "Admin and Manager are in ACB tenant",
    $adminUser && $managerUser && $adminUser->tenant_id === $managerUser->tenant_id,
    $adminUser && $managerUser ? "Tenant: " . $adminUser->tenant_id : "N/A"
);

log_test(
    "Dispatcher and Approver are in SGS tenant",
    $dispatcherUser && $approverUser && $dispatcherUser->tenant_id === $approverUser->tenant_id,
    $dispatcherUser && $approverUser ? "Tenant: " . $dispatcherUser->tenant_id : "N/A"
);

log_test(
    "ACB and SGS are different tenants",
    $adminUser && $dispatcherUser && $adminUser->tenant_id !== $dispatcherUser->tenant_id,
    ""
);

// ===== SECTION 4: API TOKENS =====
echo Color::BLUE . "\n[4] API Tokens\n" . Color::RESET;

$adminToken = $adminUser->createToken('test-token-' . Str::random())->plainTextToken;
$managerToken = $managerUser->createToken('test-token-' . Str::random())->plainTextToken;

log_test(
    "API tokens generated successfully",
    !empty($adminToken) && !empty($managerToken),
    "Admin token length: " . strlen($adminToken)
);

log_test(
    "Tokens have correct format",
    strpos($adminToken, '|') > 0,
    ""
);

// ===== SECTION 5: RESOURCE AVAILABILITY =====
echo Color::BLUE . "\n[5] Resource Availability\n" . Color::RESET;

if ($adminUser) {
    if (Vehicle::where('tenant_id', $adminUser->tenant_id)->count() === 0) {
        Vehicle::factory()->count(2)->create(['tenant_id' => $adminUser->tenant_id]);
    }

    if (ServiceRequest::where('tenant_id', $adminUser->tenant_id)->count() === 0) {
        $vehicle = Vehicle::where('tenant_id', $adminUser->tenant_id)->first();
        if ($vehicle) {
            ServiceRequest::create([
                'tenant_id' => $adminUser->tenant_id,
                'vehicle_id' => $vehicle->id,
                'issue_description' => 'E2E seed request',
                'priority' => 'normal',
                'status' => 'draft',
            ]);
        }
    }
}

$vehicleCount = Vehicle::where('tenant_id', $adminUser->tenant_id)->count();
$srCount = ServiceRequest::where('tenant_id', $adminUser->tenant_id)->count();

log_test(
    "Vehicles exist in database",
    $vehicleCount > 0,
    "Count: $vehicleCount"
);

log_test(
    "Service requests exist in database",
    $srCount > 0,
    "Count: $srCount"
);

// ===== SECTION 6: MODEL ATTRIBUTES =====
echo Color::BLUE . "\n[6] Model Attributes\n" . Color::RESET;

log_test(
    "User has roles_names appended attribute",
    $adminUser && property_exists($adminUser, 'roles_names') || isset($adminUser->roles_names),
    "Roles: " . implode(', ', $adminUser->roles_names ?? [])
);

log_test(
    "User has permissions_names appended attribute",
    $adminUser && property_exists($adminUser, 'permissions_names') || isset($adminUser->permissions_names),
    "Permission count: " . count($adminUser->permissions_names ?? [])
);

log_test(
    "roles_names returns array",
    is_array($adminUser->roles_names),
    "Type: " . gettype($adminUser->roles_names)
);

log_test(
    "permissions_names returns array",
    is_array($adminUser->permissions_names),
    "Type: " . gettype($adminUser->permissions_names)
);

// ===== SECTION 7: PERMISSION CHECKS =====
echo Color::BLUE . "\n[7] Permission Checking\n" . Color::RESET;

log_test(
    "Admin can use hasPermissionTo()",
    $adminUser && $adminUser->hasPermissionTo('view_vehicles'),
    ""
);

log_test(
    "Admin has role admin",
    $adminUser && $adminUser->hasRole('admin'),
    ""
);

log_test(
    "Manager does NOT have role admin",
    $managerUser && !$managerUser->hasRole('admin'),
    ""
);

log_test(
    "Manager can view vehicles",
    $managerUser && $managerUser->hasPermissionTo('view_vehicles'),
    ""
);

log_test(
    "Technician cannot manage roles",
    $technicianUser && !$technicianUser->hasPermissionTo('manage_roles'),
    ""
);

// ===== SECTION 8: ROLE HIERARCHY =====
echo Color::BLUE . "\n[8] Role Definition Validation\n" . Color::RESET;

$adminPerms = $adminUser->getAllPermissions()->pluck('name')->toArray();
$managerPerms = $managerUser->getAllPermissions()->pluck('name')->toArray();
$techPerms = $technicianUser->getAllPermissions()->pluck('name')->toArray();

log_test(
    "Admin has more permissions than Manager",
    count($adminPerms) > count($managerPerms),
    "Admin: " . count($adminPerms) . ", Manager: " . count($managerPerms)
);

log_test(
    "Manager has more permissions than Technician",
    count($managerPerms) > count($techPerms),
    "Manager: " . count($managerPerms) . ", Tech: " . count($techPerms)
);

log_test(
    "All admin permissions include core permissions",
    in_array('view_dashboard', $adminPerms) && in_array('view_vehicles', $adminPerms),
    ""
);

// ===== RESULTS SUMMARY =====
echo Color::BLUE . "\n=== Test Results ===\n" . Color::RESET;
echo Color::GREEN . "Passed: " . Color::RESET . $tests['passed'] . "\n";
echo Color::RED . "Failed: " . Color::RESET . $tests['failed'] . "\n";

if ($tests['failed'] > 0) {
    echo Color::RED . "\nFailed Tests:\n" . Color::RESET;
    foreach ($tests['errors'] as $error) {
        echo "  - $error\n";
    }
}

$total = $tests['passed'] + $tests['failed'];
$percentage = $total > 0 ? round(($tests['passed'] / $total) * 100, 1) : 0;

echo "\nSuccess Rate: " . Color::BLUE . "$percentage%" . Color::RESET . "\n";

// Exit with appropriate code
exit($tests['failed'] > 0 ? 1 : 0);
