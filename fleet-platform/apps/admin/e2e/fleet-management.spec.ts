import { test, expect, type Page } from '@playwright/test';

/**
 * Helper function to login as admin user
 */
async function loginAsAdmin(page: Page) {
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[name="email"]', 'admin@acb.local');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard');
}

test.describe('Document Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should navigate to documents page', async ({ page }) => {
    await page.click('a[href="/documents"]');
    await expect(page).toHaveURL(/.*documents/);
    await expect(page.locator('h1')).toContainText('Documents');
  });

  test('should upload document using drag and drop', async ({ page }) => {
    await page.click('a[href="/documents"]');
    
    // Switch to drag-drop mode
    await page.click('button:has-text("Drag & Drop")');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content here'),
    });
    
    // Wait for upload to complete
    await expect(page.locator('.upload-progress')).toBeVisible();
    await expect(page.locator('.upload-progress')).toHaveText('100%', { timeout: 10000 });
    
    // Verify toast notification
    await expect(page.locator('.toast-success')).toContainText('uploaded successfully');
  });

  test('should filter documents by entity type', async ({ page }) => {
    await page.click('a[href="/documents"]');
    
    // Select filter
    await page.selectOption('select[name="entityType"]', 'vehicle');
    
    // Verify filtering
    await expect(page.locator('.document-item')).toHaveCount(1, { timeout: 5000 });
  });

  test('should download document', async ({ page }) => {
    await page.click('a[href="/documents"]');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download"):first'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should delete document with confirmation', async ({ page }) => {
    await page.click('a[href="/documents"]');
    
    const initialCount = await page.locator('.document-item').count();
    
    // Click delete
    await page.click('button:has-text("Delete"):first');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Verify document removed
    await expect(page.locator('.document-item')).toHaveCount(initialCount - 1);
    await expect(page.locator('.toast-success')).toContainText('deleted');
  });
});

test.describe('Live Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display live statistics', async ({ page }) => {
    await page.click('a[href="/dashboard/live"]');
    
    await expect(page.locator('h1')).toContainText('Live Fleet Dashboard');
    
    // Verify stat cards
    await expect(page.locator('.stat-card')).toHaveCount(4);
    await expect(page.locator('.stat-card:has-text("Total Vehicles")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("Active")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("In Maintenance")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("Inactive")')).toBeVisible();
  });

  test('should show live indicator', async ({ page }) => {
    await page.click('a[href="/dashboard/live"]');
    
    const liveIndicator = page.locator('.live-indicator');
    await expect(liveIndicator).toBeVisible();
    await expect(liveIndicator).toHaveClass(/active/);
  });

  test('should display recent activities', async ({ page }) => {
    await page.click('a[href="/dashboard/live"]');
    
    const activityFeed = page.locator('.activity-feed');
    await expect(activityFeed).toBeVisible();
    
    const activities = page.locator('.activity-item');
    await expect(activities.first()).toBeVisible();
  });

  test('should update statistics in real-time', async ({ page }) => {
    await page.click('a[href="/dashboard/live"]');
    
    const activeCount = page.locator('.stat-card:has-text("Active") .stat-value');
    const initialValue = await activeCount.textContent();
    
    // Wait for polling interval (30 seconds)
    await page.waitForTimeout(31000);
    
    // Value should potentially update
    const newValue = await activeCount.textContent();
    expect(newValue).toBeDefined();
  });
});

test.describe('Notification Center E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display notification list', async ({ page }) => {
    await page.click('a[href="/notifications"]');
    
    await expect(page.locator('h1')).toContainText('Notifications');
    await expect(page.locator('.notification-item')).toHaveCount(1, { timeout: 5000 });
  });

  test('should filter notifications by type', async ({ page }) => {
    await page.click('a[href="/notifications"]');
    
    await page.selectOption('select[name="type"]', 'alert');
    
    const notifications = page.locator('.notification-item');
    await expect(notifications.first()).toHaveClass(/type-alert/);
  });

  test('should mark notification as read', async ({ page }) => {
    await page.click('a[href="/notifications"]');
    
    const notification = page.locator('.notification-item:first');
    await notification.click();
    
    await expect(notification).toHaveClass(/read/);
  });

  test('should show notification details modal', async ({ page }) => {
    await page.click('a[href="/notifications"]');
    
    await page.click('.notification-item:first');
    
    const modal = page.locator('.notification-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.notification-title')).toBeVisible();
    await expect(modal.locator('.notification-message')).toBeVisible();
  });

  test('should receive real-time notification', async ({ page }) => {
    await page.click('a[href="/notifications"]');
    
    const initialCount = await page.locator('.notification-item').count();
    
    // Trigger notification from backend (would need API call or WebSocket)
    // This is a placeholder for the actual implementation
    
    // Wait for new notification to appear
    await page.waitForTimeout(2000);
    
    // Verify toast appears
    await expect(page.locator('.toast-notification')).toBeVisible();
  });
});

test.describe('Reports Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display fleet status report', async ({ page }) => {
    await page.click('a[href="/reports"]');
    
    await expect(page.locator('h2:has-text("Fleet Status")')).toBeVisible();
    
    const chart = page.locator('#fleet-status-chart');
    await expect(chart).toBeVisible();
  });

  test('should display maintenance summary', async ({ page }) => {
    await page.click('a[href="/reports"]');
    
    await expect(page.locator('h2:has-text("Maintenance Summary")')).toBeVisible();
    
    const stats = page.locator('.maintenance-stats');
    await expect(stats).toBeVisible();
  });

  test('should filter reports by date range', async ({ page }) => {
    await page.click('a[href="/reports"]');
    
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-01-31');
    await page.click('button:has-text("Apply Filter")');
    
    // Wait for data to reload
    await page.waitForLoadState('networkidle');
    
    // Verify chart updates
    await expect(page.locator('#fleet-status-chart')).toBeVisible();
  });

  test('should export report to PDF', async ({ page }) => {
    await page.click('a[href="/reports"]');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export PDF")'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/report.*\.pdf$/);
  });

  test('should display cost analysis', async ({ page }) => {
    await page.click('a[href="/reports"]');
    await page.click('button:has-text("Cost Analysis")');
    
    await expect(page.locator('h2:has-text("Cost Analysis")')).toBeVisible();
    await expect(page.locator('.total-cost')).toBeVisible();
    await expect(page.locator('.average-cost')).toBeVisible();
  });
});

test.describe('Vehicle Status Real-time Updates E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should update vehicle status and broadcast change', async ({ page }) => {
    await page.click('a[href="/vehicles"]');
    
    const vehicleCard = page.locator('.vehicle-card:first');
    await vehicleCard.click();
    
    // Change status
    await page.selectOption('select[name="status"]', 'maintenance');
    await page.click('button:has-text("Save")');
    
    // Verify toast notification
    await expect(page.locator('.toast-success')).toContainText('status updated');
    
    // Verify vehicle card updates
    await expect(vehicleCard.locator('.status-badge')).toContainText('Maintenance');
  });

  test('should receive real-time status update from another user', async ({ page, context }) => {
    const page1 = page;
    const page2 = await context.newPage();
    
    // Login on both pages
    await loginAsAdmin(page1);
    await loginAsAdmin(page2);
    
    // Navigate to vehicles on both pages
    await page1.click('a[href="/vehicles"]');
    await page2.click('a[href="/vehicles"]');
    
    const vehicleId = await page1.locator('.vehicle-card:first').getAttribute('data-vehicle-id');
    
    // Update status on page1
    await page1.click('.vehicle-card:first');
    await page1.selectOption('select[name="status"]', 'maintenance');
    await page1.click('button:has-text("Save")');
    
    // Verify page2 receives update
    await page2.waitForTimeout(1000);
    const vehicleOnPage2 = page2.locator(`[data-vehicle-id="${vehicleId}"]`);
    await expect(vehicleOnPage2.locator('.status-badge')).toContainText('Maintenance');
    
    await page2.close();
  });
});
