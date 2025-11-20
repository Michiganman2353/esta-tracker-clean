# ESTA Tracker Monorepo Guide

## Overview

ESTA Tracker uses **Turborepo** for efficient monorepo management with intelligent caching and parallel task execution. This guide explains the monorepo structure, how to work with shared packages, and best practices.

## Architecture

```
esta-tracker-clean/
├── packages/
│   ├── frontend/             # React + Vite application
│   ├── backend/              # Node + Express API
│   ├── shared-types/         # Shared TypeScript types and Zod schemas
│   ├── shared-utils/         # Common utilities (date, validation, formatting)
│   ├── accrual-engine/       # Michigan ESTA accrual calculation logic
│   └── csv-processor/        # CSV parsing and validation
├── api/                      # Vercel serverless functions
├── functions/                # Firebase Cloud Functions
├── docs/                     # Documentation
├── e2e/                      # Playwright E2E tests
├── turbo.json                # Turborepo configuration
└── package.json              # Root workspace configuration
```

## Shared Packages

### @esta-tracker/shared-types

**Purpose**: Type safety and data validation across the entire stack

**Contents**:
- TypeScript interfaces for all domain models
- Zod schemas for runtime validation
- Centralized type definitions

**Example Usage**:
```typescript
import { Employee, EmployeeSchema, AccrualBalance } from '@esta-tracker/shared-types';

// Type-safe employee object
const employee: Employee = {
  id: '123',
  email: 'john@company.com',
  firstName: 'John',
  lastName: 'Doe',
  // ...
};

// Runtime validation
const validatedEmployee = EmployeeSchema.parse(inputData);
```

### @esta-tracker/shared-utils

**Purpose**: Common utility functions used across frontend and backend

**Contents**:
- **Date utilities**: Date calculations, formatting, fiscal year logic
- **Validation utilities**: Email, phone, hours validation
- **Formatting utilities**: Display formatting for hours, currency, names
- **Constants**: Michigan ESTA rules, file size limits, error codes

**Example Usage**:
```typescript
import {
  formatDateISO,
  calculateDaysBetween,
  isValidEmail,
  formatHours,
  LARGE_EMPLOYER_RULES,
} from '@esta-tracker/shared-utils';

const daysDiff = calculateDaysBetween(startDate, endDate);
const formattedHours = formatHours(8.5); // "8.5 hours"
```

### @esta-tracker/accrual-engine

**Purpose**: Michigan ESTA accrual calculation business logic

**Contents**:
- **Calculator**: Core accrual calculations
- **Rules**: Employer size rules and caps
- **Carryover**: Year-end carryover logic
- **Validator**: Accrual validation functions

**Example Usage**:
```typescript
import {
  calculateAccrual,
  getAccrualCap,
  calculateCarryover,
} from '@esta-tracker/accrual-engine';

const accrual = calculateAccrual(hoursWorked, 'large', yearlyAccrued);
// { accrued: 2.67, cap: 72, remaining: 50.33, capped: false }
```

### @esta-tracker/csv-processor

**Purpose**: CSV parsing and validation for bulk imports

**Contents**:
- **Parser**: Parse CSV text into structured data
- **Validator**: Validate CSV data against schemas

**Example Usage**:
```typescript
import { parseCSV, validateCSVData } from '@esta-tracker/csv-processor';

const parsed = parseCSV(csvText);
const validation = validateCSVData(parsed.headers, parsed.rows, schema);
```

## Working with the Monorepo

### Installing Dependencies

```bash
# Install all dependencies across all packages
npm install

# Add a dependency to a specific package
npm install lodash --workspace=packages/frontend

# Add a dev dependency to root
npm install -D prettier
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --filter=@esta-tracker/frontend

# Build only changed packages
turbo run build --filter=[HEAD^1]
```

### Running Development Servers

```bash
# Run all dev servers
npm run dev

# Run frontend only
npm run dev:frontend

# Run backend only
npm run dev:backend
```

### Testing

```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test --filter=@esta-tracker/accrual-engine

# Run E2E tests
npm run test:e2e
```

### Linting and Type Checking

```bash
# Lint all packages
npm run lint

# Type check all packages
npm run typecheck

# Lint and auto-fix
turbo run lint -- --fix
```

## Turborepo Benefits

### 1. Intelligent Caching

Turborepo caches task outputs and only re-runs tasks when inputs change:

```bash
# First build (no cache)
$ npm run build
Tasks: 6 successful, 6 total
Time: 15.2s

# Second build (fully cached)
$ npm run build
Tasks: 6 successful, 6 total
Cached: 6 cached, 6 total
Time: 1.1s  ⚡
```

### 2. Parallel Execution

Turborepo runs independent tasks in parallel:

```bash
# These run in parallel:
- @esta-tracker/shared-types:build
- @esta-tracker/shared-utils:build

# These wait for dependencies:
- @esta-tracker/accrual-engine:build (waits for shared-types, shared-utils)
- @esta-tracker/frontend:build (waits for all shared packages)
```

### 3. Remote Caching

Share build caches across team and CI/CD:

```bash
# Configure remote cache (Vercel)
export TURBO_TOKEN="your-token"
export TURBO_TEAM="your-team"

# Subsequent builds use remote cache
$ npm run build
Tasks: 6 successful, 6 total
Cached: 6 cached (REMOTE), 6 total
Time: 0.8s  🚀
```

## Creating a New Shared Package

1. **Create directory structure**:
```bash
mkdir -p packages/my-package/src
```

2. **Create `package.json`**:
```json
{
  "name": "@esta-tracker/my-package",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest"
  },
  "dependencies": {
    "@esta-tracker/shared-types": "file:../shared-types"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

3. **Create `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

4. **Install dependencies**:
```bash
npm install
```

5. **Add to frontend/backend**:
```json
{
  "dependencies": {
    "@esta-tracker/my-package": "file:../my-package"
  }
}
```

## Dependency Management

### Adding Internal Dependencies

Always use `file:` protocol for internal packages:

```json
{
  "dependencies": {
    "@esta-tracker/shared-types": "file:../shared-types",
    "@esta-tracker/shared-utils": "file:../shared-utils"
  }
}
```

### Updating Dependencies

```bash
# Update all dependencies
npm update

# Update specific package
npm update lodash --workspace=packages/frontend

# Check for outdated packages
npm outdated
```

## Best Practices

### 1. Keep Shared Packages Focused

- **shared-types**: Only types and schemas
- **shared-utils**: Only pure utility functions
- **accrual-engine**: Only business logic
- Avoid mixing concerns

### 2. Build Shared Packages First

Turborepo handles this automatically via `dependsOn` in `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 3. Use Barrel Exports

Export everything through `index.ts`:

```typescript
// packages/shared-types/src/index.ts
export * from './employee.js';
export * from './accrual.js';
export * from './api.js';
```

### 4. Document Public APIs

Add JSDoc comments to all exported functions:

```typescript
/**
 * Calculate accrual for hours worked
 * 
 * @param hoursWorked - Hours worked in the period
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Accrual calculation with capping information
 */
export function calculateAccrual(
  hoursWorked: number,
  employerSize: EmployerSize
): AccrualCalculation {
  // ...
}
```

### 5. Version Shared Packages Together

Keep all shared packages at the same version:

```json
{
  "@esta-tracker/shared-types": "1.0.0",
  "@esta-tracker/shared-utils": "1.0.0",
  "@esta-tracker/accrual-engine": "1.0.0"
}
```

## Troubleshooting

### Build Errors

**Problem**: TypeScript can't find types from shared package

**Solution**: Ensure the package is built first:
```bash
npm run build --filter=@esta-tracker/shared-types
```

**Problem**: "Cannot find module" error

**Solution**: Install dependencies:
```bash
npm install
```

### Cache Issues

**Problem**: Stale cache causing incorrect builds

**Solution**: Clear Turborepo cache:
```bash
rm -rf .turbo
npm run clean
npm run build
```

### Import Errors

**Problem**: Import not resolving

**Solution**: Use `.js` extensions in TypeScript imports:
```typescript
// ✅ Correct
import { Employee } from './employee.js';

// ❌ Wrong
import { Employee } from './employee';
```

## CI/CD Integration

Turborepo is integrated into GitHub Actions for fast CI/CD:

```yaml
- name: Build
  run: npm run build
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

Benefits:
- Remote caching speeds up CI builds by 70%+
- Only affected packages are rebuilt
- Parallel execution across multiple runners

## Migration from npm workspaces

We've successfully migrated from basic npm workspaces to Turborepo:

**Before**:
- Manual build ordering
- No caching
- Slow CI/CD builds
- Duplicate code across packages

**After**:
- Automatic dependency ordering
- Local and remote caching
- 50%+ faster CI/CD
- Shared code packages
- Type-safe APIs

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Turborepo Handbook](https://turbo.build/repo/docs/handbook)
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos/turborepo)
- [ADR 001: Monorepo Strategy](../architecture/adr/001-monorepo-strategy.md)

## Getting Help

- Check [Turborepo Docs](https://turbo.build/repo/docs)
- Search [GitHub Issues](https://github.com/vercel/turbo/issues)
- Ask in team Slack channel

---

**Last Updated**: 2025-11-20
