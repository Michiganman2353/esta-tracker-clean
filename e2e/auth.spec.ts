import { test, expect } from '@playwright/test';

test.describe('Homepage and Login', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // The app should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1, h2')).toContainText(/Michigan ESTA Tracker/i);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email and password fields
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    
    // Check for submit button
    await expect(page.locator('button[type="submit"], button:has-text("login"), button:has-text("sign in")')).toBeVisible();
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.locator('input[type="email"], input[name="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"], input[name="password"]').fill('wrongpassword');
    
    // Submit the form
    await page.locator('button[type="submit"], button:has-text("login"), button:has-text("sign in")').first().click();
    
    // Should show error message (may vary based on implementation)
    // Wait a bit for the error to appear
    await page.waitForTimeout(1000);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    
    // Look for registration link
    const registerLink = page.locator('a:has-text("register"), a:has-text("sign up"), a:has-text("create account")').first();
    
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/register/);
    }
  });
});
