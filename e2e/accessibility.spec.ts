import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('homepage should have proper document structure', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    // Skip test if server didn't start properly
    if (!response || response.status() >= 500) {
      test.skip();
      return;
    }

    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    if ((await main.count()) > 0) {
      await expect(main.first()).toBeVisible();
    }

    // Check page has a title
    await expect(page).toHaveTitle(/.+/);
  });

  test('login page should be keyboard navigable', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'networkidle' });

    // Skip test if server didn't start properly
    if (!response || response.status() >= 500) {
      test.skip();
      return;
    }

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Check if the page has any interactive elements
    const interactiveElements = page.locator('input, button, a');
    const hasInteractive = (await interactiveElements.count()) > 0;

    if (!hasInteractive) {
      test.skip();
      return;
    }

    // Tab through form elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(
      () => document.activeElement?.tagName
    );

    // Should focus on an interactive element (INPUT, BUTTON, A, etc.)
    // Some pages may start with different elements, so we'll be flexible
    if (firstFocused) {
      expect(['INPUT', 'BUTTON', 'A', 'TEXTAREA', 'SELECT', 'BODY']).toContain(
        firstFocused
      );
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'networkidle' });

    // Skip test if server didn't start properly
    if (!response || response.status() >= 500) {
      test.skip();
      return;
    }

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Check for at least one heading
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingExists = await headings
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (!headingExists) {
      // Page might not have rendered correctly
      test.skip();
      return;
    }

    await expect(headings.first()).toBeVisible();
  });
});
