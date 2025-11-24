# ESTA Tracker Workspace Architecture

This document describes the architecture, structure, and development practices for the ESTA Tracker monorepo.

## Table of Contents

1. [Workspace Structure](#workspace-structure)
2. [Module Boundaries](#module-boundaries)
3. [Development Workflow](#development-workflow)
4. [Nx Commands](#nx-commands)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Security](#security)
7. [Testing Strategy](#testing-strategy)
8. [Deployment](#deployment)

## Workspace Structure

The ESTA Tracker monorepo follows a canonical Nx workspace structure:

```
ESTA-Logic/
├── apps/                    # Application projects
│   ├── frontend/           # React web application (scope:frontend)
│   └── backend/            # Express API server (scope:backend)
├── libs/                    # Shared libraries
│   ├── shared-types/       # Shared TypeScript types (scope:shared)
│   ├── shared-utils/       # Shared utilities (scope:shared)
│   ├── esta-firebase/      # Firebase service layer (scope:shared)
│   ├── accrual-engine/     # ESTA accrual logic (scope:shared)
│   └── csv-processor/      # CSV operations (scope:shared)
├── api/                     # Serverless functions
├── functions/               # Firebase functions
├── e2e/                     # End-to-end tests
├── scripts/                 # Utility scripts
├── .github/                 # CI/CD workflows
│   └── workflows/
│       ├── ci.yml          # Legacy CI workflow
│       └── ci-elite.yml    # Enhanced CI with Nx affected
├── nx.json                  # Nx workspace configuration
├── lerna.json              # Lerna configuration
└── package.json            # Root workspace configuration
```

## Module Boundaries

Module boundaries are enforced using Nx tags and ESLint rules.

### Scope Tags

Every project is tagged with a scope:

- **`scope:frontend`** - Frontend-only code
- **`scope:backend`** - Backend-only code  
- **`scope:shared`** - Code shared between frontend and backend

### Dependency Rules

The `.eslintrc.json` enforces these constraints:

```typescript
// ✅ VALID
// Frontend can depend on:
apps/frontend → libs/shared-types
apps/frontend → libs/shared-utils
apps/frontend → libs/esta-firebase
apps/frontend → libs/accrual-engine

// Backend can depend on:
apps/backend → libs/shared-types
apps/backend → libs/shared-utils
apps/backend → libs/accrual-engine
apps/backend → libs/csv-processor

// Shared libs can depend on other shared libs:
libs/accrual-engine → libs/shared-types
libs/esta-firebase → libs/shared-types

// ❌ INVALID
apps/frontend → apps/backend  // Cannot import between apps
apps/backend → apps/frontend   // Cannot import between apps
libs/esta-firebase → apps/frontend  // Libs cannot depend on apps
```

### Verifying Module Boundaries

```bash
# Lint will check module boundaries
npm run lint

# Or specifically check with Nx
npx nx run-many --target=lint --all
```

## Development Workflow

### Installing Dependencies

```bash
# Install all dependencies
npm ci

# Install for a specific project
cd apps/frontend && npm install <package>
```

### Running Projects

```bash
# Frontend development server
npx nx dev frontend

# Backend development server
npx nx dev backend

# Run multiple projects concurrently
npx nx run-many --target=dev --projects=frontend,backend
```

### Building Projects

```bash
# Build a specific project
npx nx build frontend

# Build all projects
npm run build

# Build only affected projects
npx nx affected --target=build

# Build with dependencies
npx nx build frontend --with-deps
```

### Testing

```bash
# Run all tests
npm run test

# Test a specific project
npx nx test frontend

# Test with coverage
npx nx test frontend --coverage

# Test only affected projects
npx nx affected --target=test

# E2E tests
npm run test:e2e
```

### Linting and Type Checking

```bash
# Lint all projects
npm run lint

# Lint affected projects
npx nx affected --target=lint

# Type check all projects
npm run typecheck

# Type check affected projects
npx nx affected --target=typecheck
```

## Nx Commands

### Common Commands

```bash
# Show all projects
npx nx show projects

# Show project graph
npx nx graph

# Show affected projects
npx nx affected:graph

# Run target for all projects
npx nx run-many --target=build --all

# Run target in parallel
npx nx run-many --target=test --all --parallel=3

# Clear Nx cache
npx nx reset
```

### Affected Commands

Nx can intelligently determine which projects are affected by changes:

```bash
# Build only affected
npx nx affected --target=build

# Test only affected
npx nx affected --target=test

# Lint only affected
npx nx affected --target=lint

# Show what's affected
npx nx affected:apps
npx nx affected:libs
```

## CI/CD Pipeline

### Workflow Files

- **`ci.yml`** - Legacy comprehensive CI workflow
- **`ci-elite.yml`** - Enhanced CI with Nx affected and parallel jobs

### Enhanced CI Features

The new `ci-elite.yml` workflow includes:

1. **Security Audit** - npm audit, dependency checks
2. **Workspace Validation** - Structure and module boundaries
3. **Parallel Jobs** - Lint, typecheck, test run in parallel
4. **Nx Affected** - Only builds/tests changed projects
5. **Smart Caching** - Nx cache with file-based keys
6. **Build Validation** - Smoke tests and output validation
7. **E2E Tests** - Playwright tests
8. **Deployment** - Preview (PRs) and Production (master)

### Key CI Improvements

**Before (ci.yml):**
```yaml
- run: npm run lint          # Lints everything
- run: npm run test          # Tests everything
- run: npm run build         # Builds everything
```

**After (ci-elite.yml):**
```yaml
- run: npx nx affected --target=lint    # Only affected projects
- run: npx nx affected --target=test    # Only affected projects
- run: npx nx affected --target=build   # Only affected projects
```

### Nx Cache Strategy

Caching is configured for optimal performance:

```yaml
- uses: actions/cache@v4
  with:
    path: .nx/cache
    key: ${{ runner.os }}-nx-${{ hashFiles('**/package-lock.json', '**/project.json', 'nx.json') }}
    restore-keys: |
      ${{ runner.os }}-nx-
```

## Security

### Environment Variables

All environment variables follow strict conventions:

**Frontend (Vite):**
- Must use `VITE_` prefix
- Exposed to client-side code
- Configured in GitHub Secrets and Vercel

```bash
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

**Backend:**
- No prefix required
- Server-side only
- Never exposed to client

### Security Best Practices

1. **No secrets in code** - Use environment variables
2. **Input validation** - Use Zod schemas
3. **Helmet middleware** - Security headers on backend
4. **CORS configuration** - Properly configured origins
5. **npm audit** - Regular dependency audits
6. **Module boundaries** - Prevent unauthorized access

### Security Scanning

```bash
# Run security audit
npm audit

# Fix vulnerabilities automatically
npm audit fix

# CI runs audit on every push
```

## Testing Strategy

### Test Types

1. **Unit Tests** - Vitest for all projects
2. **Integration Tests** - Cross-library integration
3. **E2E Tests** - Playwright for user workflows
4. **Module Boundary Tests** - ESLint enforcement

### Test Commands

```bash
# Unit tests
npx nx test <project>

# With coverage
npx nx test <project> --coverage

# E2E tests
npm run test:e2e

# Interactive mode
npx nx test frontend --ui
```

### Coverage Requirements

- **Minimum 70%** coverage for business logic
- **100%** coverage for critical paths (accrual calculations)
- Coverage reports generated in `<project>/coverage/`

## Deployment

### Frontend Deployment (Vercel)

**Preview Deployments:**
- Automatically deployed for every PR
- Preview URL posted as PR comment
- Uses preview environment variables

**Production Deployment:**
- Automatically deployed on merge to `master`
- Uses production environment variables
- Requires all CI checks to pass

### Backend Deployment

Backend can be deployed to any Node.js hosting:
- Built to `apps/backend/dist`
- Requires database configuration
- Environment variables must be configured

### Deployment Commands

```bash
# Build for production
NODE_ENV=production npm run build

# Validate deployment
npm run validate:deployment
```

## Workspace Maintenance

### Adding New Projects

**Adding an Application:**
```bash
# Create directory
mkdir -p apps/new-app/src

# Add package.json, project.json, tsconfig.json
# Update apps/README.md
# Add appropriate scope tag
```

**Adding a Library:**
```bash
# Create directory
mkdir -p libs/new-lib/src

# Add package.json, project.json, tsconfig.json
# Update libs/README.md
# Add appropriate scope tag
```

### Updating Dependencies

```bash
# Update all dependencies
npm update

# Update specific package
npm update <package-name>

# Check for outdated packages
npm outdated
```

### Workspace Scripts

Located in `scripts/`:
- `check-envs.js` - Validate environment variables
- `smoke-test-employer-code.mjs` - Smoke test for builds
- `validate-deployment.sh` - Validate build output
- `setup-kms.js` - Setup Google Cloud KMS

## Resources

- [Nx Documentation](https://nx.dev)
- [Lerna Documentation](https://lerna.js.org)
- [Monorepo Best Practices](https://nx.dev/concepts/more-concepts/why-monorepos)
- [Module Boundaries Guide](https://nx.dev/core-features/enforce-project-boundaries)

## Questions?

For questions or issues:
1. Check this documentation
2. Review project READMEs (`apps/README.md`, `libs/README.md`)
3. Open an issue on GitHub
4. Check Nx documentation
