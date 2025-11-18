import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-123456');
    
    // Should either show a 404 page or redirect to login/home
    // For SPAs, they often show the app with a not found component
    expect([200, 404]).toContain(response?.status());
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('browser back button should work', async ({ page }) => {
    await page.goto('/login');
    await page.goto('/register');
    
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });
});
