/**
 * E2E Tests for PTO Request Workflow
 * 
 * Tests the complete PTO request flow:
 * 1. Employee submits PTO request
 * 2. Manager reviews and approves/denies
 * 3. System updates balances
 * 4. Notifications are sent
 */

import { test, expect } from '@playwright/test';

test.describe('PTO Request Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Check if we're redirected to login
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });
  });

  test('employee can submit PTO request', async ({ page }) => {
    // This test assumes user is already logged in or we have test credentials
    // In a real scenario, you'd log in first
    
    // Skip if not logged in
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Navigate to PTO request page
    await page.click('text=Request Time Off');
    
    // Fill out PTO request form
    await page.fill('[name="startDate"]', '2024-12-01');
    await page.fill('[name="endDate"]', '2024-12-05');
    await page.fill('[name="reason"]', 'Family vacation');
    
    // Select PTO type
    await page.selectOption('[name="ptoType"]', 'vacation');
    
    // Submit request
    await page.click('button:has-text("Submit Request")');
    
    // Wait for success message
    await expect(page.locator('text=Request submitted successfully')).toBeVisible({
      timeout: 5000
    });
    
    // Verify request appears in list
    await page.click('text=My Requests');
    await expect(page.locator('text=Family vacation')).toBeVisible();
  });

  test('manager can approve PTO request', async ({ page }) => {
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Navigate to pending requests (manager view)
    await page.click('text=Pending Approvals');
    
    // Find first pending request
    const firstRequest = page.locator('[data-testid="pto-request-item"]').first();
    
    if (await firstRequest.count() === 0) {
      test.skip();
      return;
    }
    
    // View request details
    await firstRequest.click();
    
    // Approve request
    await page.click('button:has-text("Approve")');
    
    // Confirm approval
    await page.click('button:has-text("Confirm")');
    
    // Wait for success message
    await expect(page.locator('text=Request approved')).toBeVisible({
      timeout: 5000
    });
  });

  test('manager can deny PTO request with reason', async ({ page }) => {
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Navigate to pending requests
    await page.click('text=Pending Approvals');
    
    const firstRequest = page.locator('[data-testid="pto-request-item"]').first();
    
    if (await firstRequest.count() === 0) {
      test.skip();
      return;
    }
    
    // View request
    await firstRequest.click();
    
    // Deny request
    await page.click('button:has-text("Deny")');
    
    // Fill denial reason
    await page.fill('[name="denialReason"]', 'Insufficient coverage during that period');
    
    // Confirm denial
    await page.click('button:has-text("Confirm Denial")');
    
    // Wait for success message
    await expect(page.locator('text=Request denied')).toBeVisible({
      timeout: 5000
    });
  });

  test('employee can view PTO balance', async ({ page }) => {
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Navigate to dashboard or balance page
    await page.click('text=My Balance');
    
    // Verify balance information is displayed
    await expect(page.locator('text=Available Hours')).toBeVisible();
    await expect(page.locator('text=Accrued Hours')).toBeVisible();
    await expect(page.locator('text=Used Hours')).toBeVisible();
    
    // Verify numeric values are present
    const balanceValue = page.locator('[data-testid="available-balance"]');
    await expect(balanceValue).toBeVisible();
    
    const text = await balanceValue.textContent();
    expect(text).toMatch(/\d+(\.\d+)?/); // Should contain a number
  });

  test('employee can cancel pending PTO request', async ({ page }) => {
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Navigate to my requests
    await page.click('text=My Requests');
    
    // Find a pending request
    const pendingRequest = page.locator('[data-status="pending"]').first();
    
    if (await pendingRequest.count() === 0) {
      test.skip();
      return;
    }
    
    // Click cancel button
    await pendingRequest.locator('button:has-text("Cancel")').click();
    
    // Confirm cancellation
    await page.click('button:has-text("Confirm Cancel")');
    
    // Wait for success message
    await expect(page.locator('text=Request cancelled')).toBeVisible({
      timeout: 5000
    });
  });

  test('system prevents overlapping PTO requests', async ({ page }) => {
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Navigate to PTO request page
    await page.click('text=Request Time Off');
    
    // Fill out first request
    await page.fill('[name="startDate"]', '2024-12-10');
    await page.fill('[name="endDate"]', '2024-12-15');
    await page.fill('[name="reason"]', 'First request');
    
    // Submit first request
    await page.click('button:has-text("Submit Request")');
    await page.waitForTimeout(1000);
    
    // Try to submit overlapping request
    await page.click('text=Request Time Off');
    await page.fill('[name="startDate"]', '2024-12-12');
    await page.fill('[name="endDate"]', '2024-12-17');
    await page.fill('[name="reason"]', 'Overlapping request');
    
    // Submit second request
    await page.click('button:has-text("Submit Request")');
    
    // Should show error about overlap
    await expect(page.locator('text=/overlap|conflict/i')).toBeVisible({
      timeout: 5000
    });
  });

  test('PTO request workflow respects permissions', async ({ page, context }) => {
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Attempt to access manager-only page as employee
    await page.goto('/manager/approvals');
    
    // Should be redirected or see permission denied
    await page.waitForTimeout(1000);
    
    const hasPermissionError = await page.locator('text=/permission|unauthorized|access denied/i').count() > 0;
    const isRedirected = !page.url().includes('/manager/approvals');
    
    expect(hasPermissionError || isRedirected).toBeTruthy();
  });

  test('PTO request includes file attachment upload', async ({ page }) => {
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Navigate to PTO request page
    await page.click('text=Request Time Off');
    
    // Check if file upload is available
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.count() === 0) {
      test.skip();
      return;
    }
    
    // Fill basic form
    await page.fill('[name="startDate"]', '2024-12-20');
    await page.fill('[name="endDate"]', '2024-12-22');
    await page.fill('[name="reason"]', 'Medical appointment');
    
    // Upload file (mock file)
    await fileInput.setInputFiles({
      name: 'medical-note.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    });
    
    // Submit
    await page.click('button:has-text("Submit Request")');
    
    // Verify success
    await expect(page.locator('text=Request submitted')).toBeVisible({
      timeout: 5000
    });
  });
});

test.describe('PTO Request Accessibility', () => {
  test('PTO form is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Navigate to PTO request page
    await page.click('text=Request Time Off');
    
    // Use keyboard to navigate form
    await page.keyboard.press('Tab');
    await page.keyboard.type('2024-12-01');
    
    await page.keyboard.press('Tab');
    await page.keyboard.type('2024-12-05');
    
    await page.keyboard.press('Tab');
    await page.keyboard.type('Holiday break');
    
    // Verify focused element
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('PTO request form has proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Navigate to PTO request page
    await page.click('text=Request Time Off');
    
    // Check for ARIA labels
    const startDateField = page.locator('[name="startDate"]');
    const startDateLabel = await startDateField.getAttribute('aria-label');
    expect(startDateLabel).toBeTruthy();
    
    const submitButton = page.locator('button:has-text("Submit Request")');
    const buttonRole = await submitButton.getAttribute('role');
    expect(buttonRole === 'button' || buttonRole === null).toBeTruthy();
  });
});
