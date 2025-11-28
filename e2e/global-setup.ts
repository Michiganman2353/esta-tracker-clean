/**
 * Global Setup for Playwright E2E Tests
 *
 * This file handles Firebase Auth Emulator login before tests run.
 * It saves authenticated state to storageState.json so all tests
 * can start already logged in as a test employee.
 */

import { chromium, FullConfig } from '@playwright/test';

// Test credentials - can be overridden via environment variables
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'employee@test.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'password123';

async function globalSetup(config: FullConfig) {
  // Skip auth setup if we're not in CI and just want quick local tests
  if (process.env.SKIP_AUTH_SETUP === 'true') {
    console.log('Skipping auth setup (SKIP_AUTH_SETUP=true)');
    return;
  }

  console.log('Starting global setup for authenticated E2E tests...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto('http://localhost:5173/login', { timeout: 30000 });
    console.log('Navigated to login page');

    // Wait for login form to be ready
    const emailField = page.locator(
      '[data-testid="email"], input[type="email"], input[name="email"]'
    );
    const emailExists = await emailField
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (!emailExists) {
      console.log('Login form not found - skipping auth setup');
      await browser.close();
      return;
    }

    // Fill in test credentials
    await emailField.fill(TEST_EMAIL);
    await page
      .locator(
        '[data-testid="password"], input[type="password"], input[name="password"]'
      )
      .fill(TEST_PASSWORD);

    // Click sign in button
    await page
      .locator('button[type="submit"], button:has-text("Sign In")')
      .first()
      .click();

    // Wait for navigation to dashboard
    await page
      .waitForURL('**/dashboard', { timeout: 15000 })
      .catch(async () => {
        // If we don't get redirected, auth might have failed
        console.log('Dashboard redirect did not occur - auth may have failed');
      });

    // Save authenticated state for use in tests
    await context.storageState({ path: 'e2e/storageState.json' });
    console.log('Saved authenticated storage state to e2e/storageState.json');
  } catch (error) {
    console.log(
      'Global setup encountered an error - tests may run without auth:',
      error
    );
  } finally {
    await browser.close();
  }
}

export default globalSetup;
