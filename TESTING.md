# Testing Documentation

This document describes the testing infrastructure for ESTA Tracker.

## Overview

ESTA Tracker uses a comprehensive testing approach:

- **Unit Tests**: Vitest for fast unit and integration tests
- **E2E Tests**: Playwright for end-to-end browser testing
- **CI/CD**: GitHub Actions for automated testing on every PR and push

## Unit Testing

### Framework

We use [Vitest](https://vitest.dev/) for unit testing. Vitest is a fast, modern test runner built on top of Vite.

### Running Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests for specific workspace
npm run test:frontend
npm run test:backend

# Run tests in watch mode
npm run test:frontend -- --watch

# Run tests with UI
npm run test:frontend -- --ui

# Run tests with coverage
npm run test:frontend -- --coverage
npm run test:backend -- --coverage
```

### Writing Unit Tests

Unit tests should be placed next to the code they test with the `.test.ts` or `.test.tsx` extension:

```
src/
  lib/
    compliance.ts
    compliance.test.ts  ← test file
```

Example unit test:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateAccrual } from './compliance';

describe('calculateAccrual', () => {
  it('should calculate accrual correctly', () => {
    const result = calculateAccrual(30);
    expect(result).toBe(1);
  });
});
```

## E2E Testing

### Framework

We use [Playwright](https://playwright.dev/) for end-to-end testing across multiple browsers.

### Running E2E Tests

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Writing E2E Tests

E2E tests are located in the `e2e/` directory at the root of the project:

```
e2e/
  auth.spec.ts
  navigation.spec.ts
  accessibility.spec.ts
```

Example E2E test:

```typescript
import { test, expect } from '@playwright/test';

test('should load login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('h1')).toContainText('Login');
});
```

### Configuration

Playwright configuration is in `playwright.config.ts`. Key settings:

- **baseURL**: `http://localhost:5173` (Vite dev server)
- **Browsers**: Chromium, Firefox, and WebKit
- **Retries**: 2 retries on CI, 0 locally
- **Auto-start**: Development server starts automatically for tests

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline runs on every push and pull request. It includes:

1. **Lint**: ESLint checks for code quality
2. **Type Check**: TypeScript compilation check
3. **Unit Tests**: Vitest tests for frontend and backend
4. **Build**: Production build
5. **E2E Tests**: Playwright tests (runs after build succeeds)
6. **Vercel Preview**: Automatic preview deployment for PRs

### Workflow File

See `.github/workflows/ci.yml` for the complete workflow configuration.

### Required Secrets

For Vercel preview deployments, the following secrets must be configured in GitHub:

- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

To get these values:

1. **Install Vercel CLI**: `npm i -g vercel`
2. **Login to Vercel**: `vercel login`
3. **Link Project**: `vercel link` in your project directory
4. **Find IDs**: Check `.vercel/project.json` for `orgId` and `projectId`
5. **Generate Token**: 
   - Visit [Vercel Account Tokens](https://vercel.com/account/tokens)
   - Click "Create" and name it appropriately
   - Set expiration (optional, recommended for security)
   - Copy the token immediately (can't be viewed again)
6. **Add to GitHub Secrets**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add each secret with the exact names above
   - Paste the token value for `VERCEL_TOKEN`

**Security Note**: Never commit tokens or IDs directly to the repository. Always use GitHub Secrets for CI/CD or local `.env.local` files (gitignored) for development.

## Best Practices

### Unit Tests

- Test business logic and utility functions
- Mock external dependencies (Firebase, API calls)
- Keep tests focused and fast
- Aim for high coverage of critical paths

### E2E Tests

- Test critical user journeys
- Test authentication flows
- Test navigation and routing
- Keep E2E tests stable and reliable
- Use data-testid attributes for stable selectors
- Avoid testing implementation details

### General Guidelines

- Write tests alongside new features
- Fix failing tests immediately
- Run tests locally before pushing
- Keep test output clean and readable
- Document complex test scenarios

## Debugging

### Unit Tests

```bash
# Run single test file
npm run test:frontend src/lib/compliance.test.ts

# Run tests matching pattern
npm run test:frontend -- -t "calculateAccrual"

# Run with debugger
node --inspect-brk ./node_modules/.bin/vitest
```

### E2E Tests

```bash
# Debug mode (opens inspector)
npm run test:e2e:debug

# Run with trace enabled
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Coverage Reports

### Frontend Coverage

```bash
npm run test:frontend -- --coverage
```

Coverage reports are generated in `packages/frontend/coverage/`.

### Backend Coverage

```bash
npm run test:backend -- --coverage
```

Coverage reports are generated in `packages/backend/coverage/`.

## Continuous Improvement

- Review and update tests regularly
- Add tests for bug fixes
- Monitor CI/CD pipeline performance
- Keep testing dependencies up to date
- Collect and act on test metrics

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
