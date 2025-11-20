import { test, expect } from '@playwright/test';

test.describe('Manager Registration Flow', () => {
  test('should complete manager registration and auto-login to dashboard', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Click on "Register as Manager" button
    await page.getByRole('button', { name: /register as manager/i }).click();
    
    // Should navigate to manager registration
    await expect(page).toHaveURL(/\/register\/manager/);
    
    // Fill out Step 1: Account Information
    await page.locator('input[id="name"]').fill('Test Manager');
    await page.locator('input[id="email"]').fill(`testmanager${Date.now()}@example.com`);
    await page.locator('input[id="password"]').fill('TestPassword123');
    await page.locator('input[id="confirmPassword"]').fill('TestPassword123');
    
    // Click Next to go to Step 2
    await page.getByRole('button', { name: /next/i }).click();
    
    // Fill out Step 2: Company Information
    await page.locator('input[id="companyName"]').fill('Test Company LLC');
    await page.locator('input[id="employeeCount"]').fill('15');
    
    // Click Next to go to Step 3
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 3: Policy Setup (optional, can just click Next)
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 4: Review & Complete - Click "Complete Registration"
    await page.getByRole('button', { name: /complete registration/i }).click();
    
    // Wait for navigation to dashboard
    // The user should be auto-logged in and redirected to the main dashboard
    await page.waitForURL('/', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page.locator('h1')).toContainText(/ESTA Tracker/i);
    await expect(page.locator('h2')).toContainText(/Welcome back/i);
    
    // Verify user name appears
    await expect(page.locator('text=Test Manager')).toBeVisible();
    
    // Verify logout button is present
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/register/manager');
    
    // Try to proceed without filling any fields
    await page.getByRole('button', { name: /next/i }).click();
    
    // Should show validation error
    await expect(page.locator('text=/full name is required/i')).toBeVisible();
  });

  test('should validate password match', async ({ page }) => {
    await page.goto('/register/manager');
    
    await page.locator('input[id="name"]').fill('Test User');
    await page.locator('input[id="email"]').fill('test@example.com');
    await page.locator('input[id="password"]').fill('Password123');
    await page.locator('input[id="confirmPassword"]').fill('DifferentPassword');
    
    await page.getByRole('button', { name: /next/i }).click();
    
    // Should show password mismatch error
    await expect(page.locator('text=/passwords do not match/i')).toBeVisible();
  });
});

test.describe('Employee Registration Flow', () => {
  test('should complete employee registration and auto-login to dashboard', async ({ page }) => {
    await page.goto('/register');
    
    // Click on "Register as Employee" button
    await page.getByRole('button', { name: /register as employee/i }).click();
    
    // Should navigate to employee registration
    await expect(page).toHaveURL(/\/register\/employee/);
    
    // Fill out employee registration form
    await page.locator('input[name="name"], input[id="name"]').fill('Test Employee');
    await page.locator('input[name="email"], input[id="email"]').fill(`testemployee${Date.now()}@example.com`);
    await page.locator('input[name="password"], input[id="password"]').fill('TestPassword123');
    await page.locator('input[name="confirmPassword"], input[id="confirmPassword"]').fill('TestPassword123');
    await page.locator('input[name="tenantCode"], input[id="tenantCode"]').fill('TEST1234');
    
    // Submit the form
    await page.getByRole('button', { name: /register|sign up|create account/i }).click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('/', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page.locator('h1')).toContainText(/ESTA Tracker/i);
    await expect(page.locator('text=Test Employee')).toBeVisible();
  });
});
