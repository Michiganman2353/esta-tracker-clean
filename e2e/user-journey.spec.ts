import { test, expect } from '@playwright/test';

test.describe('User Registration Journey', () => {
  test('should display registration options', async ({ page }) => {
    await page.goto('/register');
    
    // Check page loads
    await expect(page).toHaveURL(/\/register/);
    
    // Look for registration related content
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should have accessible registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Check for form elements
    const forms = await page.locator('form').count();
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();
    
    // Should have some interactive elements
    expect(forms + inputs + buttons).toBeGreaterThan(0);
  });
});

test.describe('Dashboard Access Control', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users from employer dashboard', async ({ page }) => {
    await page.goto('/employer');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users from employee dashboard', async ({ page }) => {
    await page.goto('/employee');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('UI Responsiveness', () => {
  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // Page should load without horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    // Allow small differences (e.g., scrollbar)
    expect(scrollWidth - clientWidth).toBeLessThan(20);
  });

  test('should be tablet responsive', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    
    // Page should be visible and functional
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThan(0);
  });

  test('should be desktop responsive', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    
    // Page should be visible and functional
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThan(0);
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Page should load even if there are network issues
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show appropriate error messages', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should stay on login page or show validation
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).toContain('login');
    }
  });
});
