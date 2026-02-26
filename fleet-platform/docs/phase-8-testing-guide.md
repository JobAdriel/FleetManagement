# Phase 8: Testing Suite - Complete Guide

## Overview
Phase 8 implements a comprehensive testing infrastructure covering unit tests, integration tests, component tests, and end-to-end tests with CI/CD automation.

---

## Backend Testing (PHPUnit)

### Test Structure
```
tests/
├── Unit/
│   ├── Models/          # Model unit tests
│   ├── Events/          # Event tests
│   └── Jobs/            # Job tests
├── Feature/
│   └── Api/             # API integration tests
├── Helpers/             # Test helper classes
└── TestCase.php         # Base test case
```

### Running Backend Tests

#### Run all tests:
```bash
cd fleet-platform/apps/api
php artisan test
```

#### Run specific test suite:
```bash
# Unit tests only
php artisan test --testsuite=Unit

# Feature tests only
php artisan test --testsuite=Feature

# Specific test file
php artisan test tests/Unit/Models/VehicleTest.php

# Specific test method
php artisan test --filter=test_vehicle_belongs_to_tenant
```

#### Run with coverage:
```bash
php artisan test --coverage
php artisan test --coverage --min=80  # Require 80% minimum coverage
```

### Database Factories

All models have factories for easy test data creation:

```php
use App\Models\Vehicle;
use App\Models\Tenant;

$tenant = Tenant::factory()->create();
$vehicle = Vehicle::factory()->active()->create(['tenant_id' => $tenant->id]);
```

Available factory states:
- **Vehicle**: `active()`, `inMaintenance()`, `inactive()`
- **ServiceRequest**: `pending()`, `inProgress()`, `completed()`, `urgent()`
- **WorkOrder**: `pending()`, `inProgress()`, `completed()`
- **Notification**: `sent()`, `alert()`, `withMetadata([])`
- **Document**: `forVehicle()`, `registration()`, `insurance()`

### Test Helpers

#### AuthHelper:
```php
use Tests\Helpers\AuthHelper;

// Authenticate as admin
$admin = AuthHelper::actingAsAdmin();

// Authenticate as regular user
$user = AuthHelper::actingAs();

// Create user with specific tenant
$tenant = Tenant::factory()->create();
$manager = AuthHelper::actingAsManager($tenant);
```

#### TestDataHelper:
```php
use Tests\Helpers\TestDataHelper;

// Create complete fleet scenario
$data = TestDataHelper::createFleetScenario($tenant, 10);
// Returns: vehicles, service_requests, work_orders, quotes

// Create vehicle with maintenance history
$history = TestDataHelper::createVehicleWithHistory($tenant);

// Create mixed status vehicles
$vehicles = TestDataHelper::createMixedStatusVehicles($tenant);
```

#### AssertionHelper:
```php
use Tests\Helpers\AssertionHelper;

// Assert pagination structure
AssertionHelper::assertHasPagination($response);

// Assert tenant isolation
AssertionHelper::assertTenantIsolation($response, $tenant->id);

// Assert file uploaded
AssertionHelper::assertFileUploaded('local', $path);

// Assert broadcast to channels
AssertionHelper::assertBroadcastToChannels(VehicleStatusUpdated::class, [
    "tenant.{$tenant->id}",
    "vehicle.{$vehicle->id}"
]);
```

### Example Unit Test

```php
namespace Tests\Unit\Models;

use App\Models\Vehicle;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VehicleTest extends TestCase
{
    use RefreshDatabase;

    public function test_vehicle_belongs_to_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        $vehicle = Vehicle::factory()->create(['tenant_id' => $tenant->id]);

        $this->assertInstanceOf(Tenant::class, $vehicle->tenant);
        $this->assertEquals($tenant->id, $vehicle->tenant->id);
    }
}
```

### Example Feature Test

```php
namespace Tests\Feature\Api;

use App\Models\Document;
use Tests\Helpers\AuthHelper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_document(): void
    {
        Storage::fake('local');
        $user = AuthHelper::actingAs();
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->postJson('/api/documents', [
            'entity_type' => 'vehicle',
            'entity_id' => $vehicleId,
            'file' => $file,
            'category' => 'registration',
        ]);

        $response->assertStatus(201);
        Storage::disk('local')->assertExists($response->json('data.file_path'));
    }
}
```

---

## Frontend Testing (Vitest + React Testing Library)

### Test Structure
```
src/
├── __tests__/           # Component tests
│   ├── DragDropUpload.test.tsx
│   ├── ToastNotification.test.tsx
│   └── LiveDashboard.test.tsx
└── test/
    ├── setup.ts         # Test setup & mocks
    └── testUtils.ts     # Test utilities
```

### Running Frontend Tests

```bash
cd fleet-platform/apps/admin

# Run all tests
npm run test:unit

# Run in watch mode
npm run test:unit -- --watch

# Run with coverage
npm run test:unit -- --coverage

# Run specific test file
npm run test:unit -- DragDropUpload.test.tsx

# Run tests matching pattern
npm run test:unit -- --grep "upload"
```

### Test Utilities

Located in `src/test/testUtils.ts`:

```typescript
import {
  mockFetch,
  mockApiSuccess,
  createMockFile,
  mockAuthToken,
  mockEcho,
  createMockVehicle,
} from '@/test/testUtils';

// Mock successful API response
mockApiSuccess({ vehicles: [] });

// Mock file upload
const file = createMockFile('test.pdf', 1024, 'application/pdf');

// Mock authentication
const token = mockAuthToken();

// Mock WebSocket connection
const echo = mockEcho();

// Create test data
const vehicle = createMockVehicle({ status: 'active' });
```

### Example Component Test

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DragDropUpload } from '../components/DragDropUpload';
import { mockApiSuccess, createMockFile } from '@/test/testUtils';

describe('DragDropUpload', () => {
  it('accepts file selection', async () => {
    mockApiSuccess({ id: 'doc-123' });
    
    render(
      <DragDropUpload
        apiUrl="http://localhost:8000/api"
        entityType="vehicle"
        entityId="test-id"
        onUploadComplete={vi.fn()}
      />
    );

    const file = createMockFile('test.pdf', 1024, 'application/pdf');
    const input = screen.getByTestId('file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });
});
```

---

## E2E Testing (Playwright)

### Test Structure
```
e2e/
└── fleet-management.spec.ts  # E2E test suites
```

### Running E2E Tests

```bash
cd fleet-platform/apps/admin

# Install browsers (first time only)
npx playwright install --with-deps

# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test fleet-management.spec.ts

# Run specific test
npx playwright test -g "should upload document"

# Debug mode
npx playwright test --debug

# Generate report
npx playwright show-report
```

### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Document Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should upload document', async ({ page }) => {
    await page.click('a[href="/documents"]');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content'),
    });
    
    await expect(page.locator('.toast-success')).toContainText('uploaded');
  });
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

The pipeline runs on every push and pull request:

1. **Backend Tests** - PHPUnit with MySQL and Redis
2. **Frontend Tests** - Vitest with coverage
3. **E2E Tests** - Playwright with full stack
4. **Code Quality** - PHPStan, ESLint, TypeScript
5. **Security Scan** - Trivy vulnerability scanner
6. **Deploy** - Staging (develop) / Production (main)

### Workflow Files
- `.github/workflows/ci-cd.yml` - Main CI/CD pipeline
- `.github/workflows/nightly-tests.yml` - Nightly comprehensive tests

### Local CI Simulation

Run the same tests as CI locally:

```bash
# Backend tests
cd fleet-platform/apps/api
composer install
php artisan test --coverage --min=80

# Frontend tests
cd fleet-platform/apps/admin
npm ci
npm run test:unit -- --coverage
npm run lint
npm run type-check

# E2E tests
npm run test:e2e
```

---

## Test Coverage Goals

### Backend Coverage Targets
- **Overall**: 80% minimum
- **Models**: 90%+
- **Controllers**: 85%+
- **Events**: 90%+
- **Jobs**: 90%+

### Frontend Coverage Targets
- **Overall**: 75% minimum
- **Components**: 80%+
- **Pages**: 70%+
- **Services**: 85%+

### View Coverage Reports

```bash
# Backend coverage
cd fleet-platform/apps/api
php artisan test --coverage
open coverage/index.html

# Frontend coverage
cd fleet-platform/apps/admin
npm run test:unit -- --coverage
open coverage/index.html
```

---

## Best Practices

### Backend Testing
1. ✅ Use `RefreshDatabase` trait
2. ✅ Use factories for test data
3. ✅ Test tenant isolation
4. ✅ Mock external services
5. ✅ Test broadcasting events
6. ✅ Test queue jobs
7. ✅ Test file uploads/downloads
8. ✅ Use helper classes for common operations

### Frontend Testing
1. ✅ Mock API calls with `mockFetch`
2. ✅ Test user interactions
3. ✅ Test loading states
4. ✅ Test error handling
5. ✅ Test async operations with `waitFor`
6. ✅ Use `data-testid` for complex queries
7. ✅ Mock WebSocket connections
8. ✅ Test accessibility

### E2E Testing
1. ✅ Test complete user workflows
2. ✅ Test real-time features
3. ✅ Test cross-browser compatibility
4. ✅ Use page object patterns
5. ✅ Test responsive design
6. ✅ Verify data persistence
7. ✅ Test error scenarios

---

## Troubleshooting

### Backend Tests Failing

**Database connection errors:**
```bash
# Check .env.testing
DB_CONNECTION=sqlite
DB_DATABASE=:memory:

# Or use MySQL test database
DB_CONNECTION=mysql
DB_DATABASE=fleet_test
```

**Broadcasting tests failing:**
```bash
# Ensure broadcast connection is null in tests
BROADCAST_CONNECTION=null
```

### Frontend Tests Failing

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Timeout errors:**
```typescript
// Increase timeout in test
await waitFor(() => {
  expect(...).toBeInTheDocument();
}, { timeout: 10000 });
```

### E2E Tests Failing

**Browser not found:**
```bash
# Reinstall browsers
npx playwright install --with-deps
```

**Server not responding:**
```bash
# Ensure both backend and frontend are running
cd fleet-platform/apps/api && php artisan serve &
cd fleet-platform/apps/admin && npm run dev &
```

---

## Test Files Summary

### Backend (PHPUnit)
- **Factories**: 7 files (Tenant, Vehicle, ServiceRequest, WorkOrder, Quote, Vendor, Notification, Document)
- **Unit Tests**: 8 files (4 models, 3 events, 1 job)
- **Feature Tests**: 3 files (Document, Notification, Report APIs)
- **Helpers**: 3 files (Auth, TestData, Assertion)

### Frontend (Vitest)
- **Component Tests**: 3 files (DragDropUpload, ToastNotification, LiveDashboard)
- **Test Utilities**: 1 file (testUtils.ts)
- **Configuration**: 2 files (vitest.config.ts, setup.ts)

### E2E (Playwright)
- **Test Suites**: 1 file (5 test suites, 25+ tests)
- **Configuration**: 1 file (playwright.config.ts)

### CI/CD
- **Workflows**: 2 files (ci-cd.yml, nightly-tests.yml)

**Total Files Created**: 26 files

---

## Next Steps

1. **Run all tests** to ensure everything passes
2. **View coverage reports** to identify gaps
3. **Add more E2E tests** for complex workflows
4. **Configure CI/CD secrets** for deployment
5. **Set up test database** for integration tests
6. **Add performance tests** (optional)
7. **Add accessibility tests** (optional)

---

## Commands Cheat Sheet

```bash
# Backend
php artisan test                    # Run all tests
php artisan test --coverage         # With coverage
php artisan test --filter=Vehicle   # Specific test

# Frontend
npm run test:unit                   # Run component tests
npm run test:unit -- --coverage     # With coverage
npm run test:e2e                    # Run E2E tests

# CI/CD
git push                            # Triggers CI pipeline
gh workflow run nightly-tests       # Manual nightly run
```

Phase 8 Testing Suite is complete! 🎉
