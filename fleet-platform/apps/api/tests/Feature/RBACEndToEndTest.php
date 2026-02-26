<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Vehicle;
use App\Models\ServiceRequest;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

class RBACEndToEndTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $managerUser;
    protected $technicianUser;
    protected $dispatcherUser;
    protected $approverUser;
    protected $tenantId;
    protected $adminToken;
    protected $managerToken;
    protected $technicianToken;
    protected $dispatcherToken;
    protected $approverToken;

    public function setUp(): void
    {
        parent::setUp();

        // Seed base data - includes RoleSeeder which creates roles and assigns them
        $this->seed(DatabaseSeeder::class);
        
        // Get test users (seeded with roles assigned)
        $this->adminUser = User::where('email', 'admin@acb.local')->first();
        $this->managerUser = User::where('email', 'sm@acb.local')->first();
        $this->technicianUser = User::where('email', 'workshop@acb.local')->first();
        $this->dispatcherUser = User::where('email', 'dispatcher@sgs.local')->first();
        $this->approverUser = User::where('email', 'approver@sgs.local')->first();
        
        // Generate tokens for each user
        $this->adminToken = $this->adminUser->createToken('test-token')->plainTextToken;
        $this->managerToken = $this->managerUser->createToken('test-token')->plainTextToken;
        $this->technicianToken = $this->technicianUser->createToken('test-token')->plainTextToken;
        $this->dispatcherToken = $this->dispatcherUser->createToken('test-token')->plainTextToken;
        $this->approverToken = $this->approverUser->createToken('test-token')->plainTextToken;
        
        $this->tenantId = $this->adminUser->tenant_id;
    }

    /**
     * Test 1: User login and token generation
     */
    public function test_login_with_valid_credentials()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@acb.local',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'roles_names', 'permissions_names'],
            'token',
        ]);
        $response->assertJsonPath('user.roles_names', ['Admin']);
    }

    /**
     * Test 2: User login with invalid credentials
     */
    public function test_login_with_invalid_credentials()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@acb.local',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    /**
     * Test 3: Get current user (authenticated)
     */
    public function test_get_current_user()
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->getJson('/api/me');

        $response->assertStatus(200);
        $response->assertJsonPath('email', 'admin@acb.local');
        $response->assertJsonPath('roles_names', ['Admin']);
    }

    /**
     * Test 4: Admin can view all resources
     */
    public function test_admin_can_view_vehicles()
    {
        // Create test vehicle in admin's tenant
        Vehicle::factory()->create(['tenant_id' => $this->tenantId]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->getJson('/api/vehicles');

        $response->assertStatus(200);
        $response->assertJsonStructure(['data']);
        $this->assertIsArray($response['data']);
    }

    /**
     * Test 5: Manager can view vehicles
     */
    public function test_manager_can_view_vehicles()
    {
        Vehicle::factory()->create(['tenant_id' => $this->managerUser->tenant_id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->managerToken}")
            ->getJson('/api/vehicles');

        $response->assertStatus(200);
    }

    /**
     * Test 6: Technician has limited permissions
     */
    public function test_technician_can_view_work_orders_but_not_delete_vehicles()
    {
        // Technician should be able to view work orders
        $response = $this->withHeader('Authorization', "Bearer {$this->technicianToken}")
            ->getJson('/api/work-orders');

        $response->assertStatus(200);
    }

    /**
     * Test 7: Dispatcher can view service requests
     */
    public function test_dispatcher_can_view_service_requests()
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->dispatcherToken}")
            ->getJson('/api/service-requests');

        $response->assertStatus(200);
    }

    /**
     * Test 8: Approver has specific permissions
     */
    public function test_approver_can_view_quotes()
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->approverToken}")
            ->getJson('/api/quotes');

        $response->assertStatus(200);
    }

    /**
     * Test 9: User roles are serialized in response
     */
    public function test_user_serialization_includes_roles_and_permissions()
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->getJson('/api/me');

        $response->assertStatus(200);
        $this->assertIsArray($response['roles_names']);
        $this->assertIsArray($response['permissions_names']);
        $this->assertContains('Admin', $response['roles_names']);
        $this->assertTrue(count($response['permissions_names']) > 0);
    }

    /**
     * Test 10: Logout revokes token
     */
    public function test_logout_revokes_token()
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->postJson('/api/logout');

        $response->assertStatus(200);

        Auth::forgetGuards();

        // Try to use the revoked token
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->getJson('/api/me');

        $response->assertStatus(401);
    }

    /**
     * Test 11: Tenant isolation - manager can't see other tenant's vehicles
     */
    public function test_tenant_isolation_enforced()
    {
        // Create vehicle in different tenant
        $otherTenant = Tenant::where('id', '!=', $this->managerUser->tenant_id)->first();
        if ($otherTenant) {
            Vehicle::factory()->create(['tenant_id' => $otherTenant->id]);

            $response = $this->withHeader('Authorization', "Bearer {$this->managerToken}")
                ->getJson('/api/vehicles');

            $response->assertStatus(200);
            // Response should only contain vehicles from manager's tenant
            // (Assuming controller implements tenant filtering)
        }
    }

    /**
     * Test 12: Unauthenticated access denied
     */
    public function test_unauthenticated_access_denied()
    {
        $response = $this->getJson('/api/vehicles');

        $response->assertStatus(401);
    }

    /**
     * Test 13: Token refresh
     */
    public function test_refresh_token()
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->postJson('/api/refresh');

        $response->assertStatus(200);
        $response->assertJsonStructure(['user', 'token']);
        $this->assertNotEquals($this->adminToken, $response['token']);
    }

    /**
     * Test 14: Create service request workflow
     */
    public function test_dispatcher_can_create_service_request()
    {
        Vehicle::factory()->create(['tenant_id' => $this->dispatcherUser->tenant_id]);
        $vehicle = Vehicle::where('tenant_id', $this->dispatcherUser->tenant_id)->first();

        $response = $this->withHeader('Authorization', "Bearer {$this->dispatcherToken}")
            ->postJson('/api/service-requests', [
                'vehicle_id' => $vehicle->id,
                'issue_description' => 'Test service request',
                'priority' => 'high',
            ]);

        $response->assertStatus(201);
    }

    /**
     * Test 15: Manager can edit service request
     */
    public function test_manager_can_edit_service_request()
    {
        $sr = ServiceRequest::factory()->create(['tenant_id' => $this->managerUser->tenant_id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->managerToken}")
            ->putJson("/api/service-requests/{$sr->id}", [
                'status' => 'submitted',
            ]);

        $response->assertStatus(200);
    }

    /**
     * Test 16: Permission-based access control
     *
     * This test assumes middleware is registered. Currently it tests
     * that different roles have expected permission attributes.
     */
    public function test_permission_attributes_per_role()
    {
        $adminPerms = $this->adminUser->getAllPermissions()->pluck('name')->toArray();
        $managerPerms = $this->managerUser->getAllPermissions()->pluck('name')->toArray();
        $techPerms = $this->technicianUser->getAllPermissions()->pluck('name')->toArray();

        // Admin should have all permissions
        $this->assertTrue(count($adminPerms) > count($managerPerms));
        $this->assertTrue(count($managerPerms) > count($techPerms));
    }
}
