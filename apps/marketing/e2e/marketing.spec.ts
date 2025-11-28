import { test, expect } from '@playwright/test';

test.describe('Marketing Pages', () => {
  test.describe('Home Page', () => {
    test('should render the home page with correct content', async ({
      page,
    }) => {
      await page.goto('/home');

      // Check page title
      await expect(page).toHaveTitle(/ESTA Tracker/);

      // Check Hero section
      await expect(
        page.getByRole('heading', {
          name: /Effortless Michigan ESTA Compliance/i,
        })
      ).toBeVisible();
      await expect(
        page.getByText(/Stop worrying about sick time calculations/i)
      ).toBeVisible();

      // Check CTA buttons
      await expect(
        page.getByRole('link', { name: /Start Free Trial/i }).first()
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /See How It Works/i })
      ).toBeVisible();

      // Check Feature Grid
      await expect(
        page.getByText(/Built for Michigan Employers/i)
      ).toBeVisible();
      await expect(
        page.getByText(/Automatic Accrual Calculations/i)
      ).toBeVisible();

      // Check data attributes
      const main = page.locator('[data-testid="marketing-page"]');
      await expect(main).toHaveAttribute('data-slug', 'home');
    });

    test('should take a visual snapshot of the home page', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');

      // Take full page screenshot
      await expect(page).toHaveScreenshot('home-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('Features Page', () => {
    test('should render the features page with correct content', async ({
      page,
    }) => {
      await page.goto('/features');

      // Check page title
      await expect(page).toHaveTitle(/Features - ESTA Tracker/);

      // Check Hero section
      await expect(
        page.getByRole('heading', {
          name: /Everything You Need for ESTA Compliance/i,
        })
      ).toBeVisible();

      // Check Feature sections
      await expect(page.getByText(/Core Features/i)).toBeVisible();
      await expect(page.getByText(/For Employers/i)).toBeVisible();
      await expect(page.getByText(/For Employees/i)).toBeVisible();

      // Check specific features
      await expect(page.getByText(/Smart Accrual Engine/i)).toBeVisible();
      await expect(page.getByText(/Employer Dashboard/i)).toBeVisible();
      await expect(page.getByText(/Mobile-Friendly Portal/i)).toBeVisible();

      // Check data attributes
      const main = page.locator('[data-testid="marketing-page"]');
      await expect(main).toHaveAttribute('data-slug', 'features');
    });

    test('should take a visual snapshot of the features page', async ({
      page,
    }) => {
      await page.goto('/features');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('features-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('Pricing Page', () => {
    test('should render the pricing page with correct content', async ({
      page,
    }) => {
      await page.goto('/pricing');

      // Check page title
      await expect(page).toHaveTitle(/Pricing - ESTA Tracker/);

      // Check Hero section
      await expect(
        page.getByRole('heading', { name: /Simple, Transparent Pricing/i })
      ).toBeVisible();

      // Check pricing plans - use heading role to avoid matching feature list items
      await expect(page.getByText(/Choose Your Plan/i)).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /Starter/i })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /Professional/i })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /Enterprise/i })
      ).toBeVisible();

      // Check price details
      await expect(page.getByText(/\$4\.99/)).toBeVisible();
      await expect(page.getByText(/employee\/month/)).toBeVisible();

      // Check CTAs
      await expect(
        page.getByRole('link', { name: /Start Free Trial/i })
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Get Started/i })
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Contact Sales/i })
      ).toBeVisible();

      // Check data attributes
      const main = page.locator('[data-testid="marketing-page"]');
      await expect(main).toHaveAttribute('data-slug', 'pricing');
    });

    test('should take a visual snapshot of the pricing page', async ({
      page,
    }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('pricing-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between pages using CTA links', async ({ page }) => {
      await page.goto('/home');

      // Click "See How It Works" to go to features
      await page.getByRole('link', { name: /See How It Works/i }).click();
      await expect(page).toHaveURL('/features');

      // Verify features page loaded
      await expect(
        page.getByRole('heading', { name: /Everything You Need/i })
      ).toBeVisible();
    });
  });

  test.describe('SEO & Meta', () => {
    test('should have correct meta tags on home page', async ({ page }) => {
      await page.goto('/home');

      // Check meta description
      const metaDesc = page.locator('meta[name="description"]');
      await expect(metaDesc).toHaveAttribute(
        'content',
        /Michigan ESTA compliance/i
      );

      // Check OG tags
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveAttribute('content', /ESTA Tracker/);
    });
  });
});
