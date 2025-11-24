# ESTA Tracker Libraries

This directory contains shared libraries used across the ESTA Tracker monorepo.

## Structure

```
libs/
├── shared-types/      # TypeScript types and schemas shared across all projects
├── shared-utils/      # Utility functions shared across all projects
├── esta-firebase/     # Centralized Firebase service and configuration
├── accrual-engine/    # ESTA sick time accrual calculation logic
└── csv-processor/     # CSV import/export functionality
```

## Libraries

### Shared Types (`libs/shared-types`)

TypeScript types, interfaces, and Zod schemas used across the entire monorepo.

**Purpose:**
- Define data models and types
- Provide runtime validation with Zod
- Ensure type consistency across frontend and backend

**Module Scope:** `scope:shared`

**Key Exports:**
- `EmployerProfile` - Employer profile data structure
- `Employee` - Employee data structure
- `AccrualRecord` - Sick time accrual record
- Validation schemas for all models

**Usage:**
```typescript
import type { EmployerProfile } from '@esta-tracker/shared-types';
import { employerProfileSchema } from '@esta-tracker/shared-types';
```

### Shared Utils (`libs/shared-utils`)

Common utility functions used across multiple projects.

**Purpose:**
- Date/time utilities
- String manipulation
- Common calculations
- Helper functions

**Module Scope:** `scope:shared`

**Key Features:**
- Pure functions (no side effects)
- Fully typed with TypeScript
- Unit tested

**Usage:**
```typescript
import { formatDate, calculateDuration } from '@esta-tracker/shared-utils';
```

### Firebase Library (`libs/esta-firebase`)

Centralized Firebase initialization and service layer.

**Purpose:**
- Single source of truth for Firebase configuration
- Encapsulate Firebase SDK usage
- Provide consistent Firebase operations

**Module Scope:** `scope:shared` (with frontend-specific usage)

**Key Features:**
- Firebase app initialization
- Authentication helpers
- Firestore operations
- Storage operations
- Employer profile management
- Employee management

**Usage:**
```typescript
// Frontend
import { getAuth, getFirestore } from '@esta/firebase';
import { createEmployerProfile } from '@esta/firebase';

// Backend (admin)
import { getAdminFirestore } from '@esta/firebase/admin';
```

### Accrual Engine (`libs/accrual-engine`)

Core business logic for calculating ESTA sick time accruals.

**Purpose:**
- Implement Michigan ESTA Act requirements
- Calculate accrual rates based on employer size
- Handle carryover rules
- Enforce usage limits

**Module Scope:** `scope:shared`

**Key Features:**
- Employer size-based logic (< 10 employees vs ≥ 10 employees)
- Hourly accrual calculations
- Annual limits and carryover
- Maximum usage enforcement
- Compliant with Michigan law

**Usage:**
```typescript
import { calculateAccrual, getMaximumUsage } from '@esta-tracker/accrual-engine';

const accrual = calculateAccrual({
  hoursWorked: 40,
  employerSize: 'large', // ≥ 10 employees
  currentAccrued: 32
});
```

### CSV Processor (`libs/csv-processor`)

CSV import and export functionality for bulk operations.

**Purpose:**
- Import employee data from CSV
- Export reports to CSV
- Validate CSV data
- Transform data between formats

**Module Scope:** `scope:shared`

**Key Features:**
- Type-safe CSV parsing
- Data validation
- Error reporting
- Format conversion

**Usage:**
```typescript
import { parseEmployeeCsv, exportToCsv } from '@esta-tracker/csv-processor';
```

## Development Guidelines

### Creating New Libraries

To create a new library:

1. **Create the directory structure:**
```bash
mkdir -p libs/my-library/src
cd libs/my-library
```

2. **Add package.json:**
```json
{
  "name": "@esta-tracker/my-library",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

3. **Add project.json with appropriate tags:**
```json
{
  "name": "my-library",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/my-library/src",
  "projectType": "library",
  "tags": ["type:lib", "scope:shared"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc",
        "cwd": "libs/my-library"
      },
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

4. **Add tsconfig.json**

5. **Update this README**

### Module Scope Tags

Libraries should be tagged with appropriate scope:

- `scope:shared` - Can be used by both frontend and backend
- `scope:frontend` - Frontend-specific utilities (rare)
- `scope:backend` - Backend-specific utilities (rare)

### Best Practices

1. **Keep libraries focused** - Each library should have a single, clear purpose

2. **Export through index.ts** - Always export through a barrel file:
```typescript
// libs/my-library/src/index.ts
export * from './myModule';
export type { MyType } from './types';
```

3. **Maintain backward compatibility** - Libraries are shared dependencies

4. **Write tests** - All library code should be well-tested

5. **Document exports** - Add JSDoc comments for public APIs:
```typescript
/**
 * Calculates sick time accrual based on hours worked
 * @param hoursWorked - Number of hours worked in the period
 * @param employerSize - Size classification of employer
 * @returns Accrued sick time in hours
 */
export function calculateAccrual(/* ... */) { }
```

6. **Avoid side effects** - Libraries should be pure when possible

7. **Type everything** - Use TypeScript strictly

### Building Libraries

Libraries are built using TypeScript compiler:

```bash
# Build a specific library
npx nx build shared-types

# Build all libraries
npx nx run-many --target=build --projects=tag:type:lib

# Build affected libraries
npx nx affected --target=build
```

### Testing Libraries

```bash
# Test a specific library
npx nx test accrual-engine

# Test all libraries
npx nx run-many --target=test --projects=tag:type:lib

# Test affected libraries
npx nx affected --target=test
```

### Dependency Management

Libraries can depend on other libraries, but must respect module boundaries:

**Valid:**
- `shared-types` ← any library (everyone can use types)
- `shared-utils` ← any library (everyone can use utilities)
- `accrual-engine` ← `shared-types`, `shared-utils`

**Invalid:**
- Libraries cannot depend on applications
- `scope:frontend` libraries cannot use `scope:backend` libraries
- Circular dependencies are not allowed

## CI/CD

Libraries are built and tested as part of the Nx affected pipeline:

```bash
# Build only affected libraries
npx nx affected --target=build

# Test only affected libraries
npx nx affected --target=test
```

## Publishing

Currently, all libraries are private and used only within the monorepo. If you need to publish a library to npm:

1. Remove `"private": true` from package.json
2. Add a `publish` target to project.json
3. Configure npm registry authentication
4. Update version using Lerna

## Resources

- [Nx Library Documentation](https://nx.dev/concepts/more-concepts/library-types)
- [TypeScript Library Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/library-structures.html)
- [Zod Documentation](https://zod.dev)
