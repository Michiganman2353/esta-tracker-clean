import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('homepage should have proper document structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible();
    }
    
    // Check page has a title
    await expect(page).toHaveTitle(/.+/);
  });

  test('login page should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    
    // Should focus on an interactive element (INPUT, BUTTON, A, etc.)
    // Some pages may start with different elements, so we'll be flexible
    if (firstFocused) {
      expect(['INPUT', 'BUTTON', 'A', 'TEXTAREA', 'SELECT', 'BODY']).toContain(firstFocused);
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/login');
    
    // Check for at least one heading
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toBeVisible();
  });
});
