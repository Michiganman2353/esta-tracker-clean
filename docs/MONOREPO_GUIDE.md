# Monorepo Architecture Guide

## Overview

ESTA Tracker uses a modern monorepo architecture powered by:
- **Nx** - Build orchestration and caching
- **Lerna** - Package management with Nx integration
- **npm Workspaces** - Dependency management

This setup provides:
- ✅ Fast, incremental builds
- ✅ Intelligent task caching
- ✅ Dependency graph awareness
- ✅ Consistent tooling across packages
- ✅ Parallel task execution

## Project Structure

```
ESTA-Logic/
├── packages/
│   ├── frontend/          # React + Vite frontend application
│   ├── backend/           # Node.js Express backend
│   ├── accrual-engine/    # ESTA accrual calculation logic
│   ├── csv-processor/     # CSV import/export utilities
│   ├── firebase/          # Firebase Admin SDK service
│   ├── shared-types/      # Shared TypeScript type definitions
│   └── shared-utils/      # Shared utility functions
├── api/                   # Vercel serverless functions
├── functions/             # Firebase Cloud Functions
├── lerna.json            # Lerna configuration
├── nx.json               # Nx configuration
└── package.json          # Root workspace configuration
```

## Key Concepts

### Nx Task Runner

Nx orchestrates all build tasks and provides:
- **Caching**: Skips tasks that haven't changed
- **Parallelization**: Runs independent tasks simultaneously
- **Dependency Detection**: Builds dependencies before dependents

### Project Configuration

Each package has a `project.json` file that defines its targets:

```json
{
  "name": "frontend",
  "targets": {
    "build": { ... },
    "test": { ... },
    "lint": { ... }
  }
}
```

### Task Dependencies

Nx automatically handles build order based on package dependencies:
- `shared-types` builds first (no dependencies)
- `accrual-engine` builds after `shared-types` (depends on it)
- `frontend` builds after all its dependencies

## Common Commands

### Development

```bash
# Run all packages in dev mode (parallel where possible)
npm run dev

# Run specific package
npm run dev:frontend
npm run dev:backend

# Or use Nx directly
npx nx dev frontend
npx nx dev backend
```

### Building

```bash
# Build all packages
npm run build

# Build specific package and its dependencies
npx nx build frontend

# Build multiple packages
npx nx run-many --target=build --projects=frontend,backend

# Build all packages in parallel
npx nx run-many --target=build --all
```

### Testing

```bash
# Test all packages
npm run test

# Test specific package
npm run test:frontend
npx nx test frontend

# Test with coverage
npm run test:coverage
npx nx run-many --target=test:coverage --all
```

### Code Quality

```bash
# Lint all packages
npm run lint

# Typecheck all packages
npm run typecheck

# Run all validation checks
npm run ci:validate
```

## Advanced Nx Features

### Project Graph

Visualize dependencies between packages:

```bash
npx nx graph
```

This opens an interactive visualization showing how packages depend on each other.

### Affected Commands

Build/test only what changed:

```bash
# Build only affected packages since main branch
npx nx affected --target=build --base=main

# Test only affected packages
npx nx affected --target=test --base=main
```

### Cache Management

Nx caches task outputs to speed up subsequent runs:

```bash
# View cache location
ls -la .nx/cache

# Clear cache if needed (automatic in most cases)
npx nx reset
```

### Running Specific Packages

```bash
# Show all available projects
npx nx show projects

# Show project details
npx nx show project frontend

# List available targets for a project
npx nx show project frontend --web
```

## Lerna Integration

Lerna manages package versions and uses Nx for task execution:

```bash
# List all packages
npx lerna list

# Run command in all packages
npx lerna run build

# Run command in specific package
npx lerna run build --scope=@esta-tracker/frontend

# Check which packages changed
npx lerna changed
```

## Environment Requirements

### Node.js Version

**Required**: Node.js 22.x

The project enforces this through:
- `package.json` engines field
- `.nvmrc` file
- GitHub Actions configuration
- Vercel deployment settings

To check your version:
```bash
node --version  # Should show v22.x.x
```

To install Node 22:
```bash
# Using nvm (recommended)
nvm install 22
nvm use 22

# Or using the .nvmrc file
nvm install
nvm use
```

## CI/CD Integration

### GitHub Actions

Workflows use Nx for efficient CI:

```yaml
- name: Cache Nx
  uses: actions/cache@v4
  with:
    path: .nx/cache
    key: ${{ runner.os }}-nx-${{ hashFiles('**/package-lock.json') }}

- name: Build
  run: npm run build  # Uses Nx internally

- name: Test
  run: npm run test  # Uses Nx internally
```

### Vercel Deployment

Vercel is configured to use Nx:

```json
{
  "buildCommand": "npx nx build frontend",
  "nodeVersion": "22.x"
}
```

## Troubleshooting

### Build Issues

**Problem**: "Cannot find module '@esta-tracker/shared-types'"

**Solution**: Build dependency packages first:
```bash
npx nx build shared-types
# or build everything
npm run build
```

### Cache Issues

**Problem**: Changes not reflected in build

**Solution**: Clear Nx cache:
```bash
npx nx reset
npm run build
```

### Performance Issues

**Problem**: Builds are slow

**Solutions**:
1. Use affected commands for incremental builds
2. Enable Nx Cloud for distributed caching (optional)
3. Check that caching is enabled in `nx.json`

### Node Version Mismatch

**Problem**: Build fails with engine mismatch

**Solution**:
```bash
# Check current version
node --version

# Switch to Node 22
nvm use 22

# Or install if not available
nvm install 22
```

## Best Practices

### 1. Run Affected Tasks in CI

Instead of testing everything, test only what changed:
```bash
npx nx affected --target=test --base=origin/main
```

### 2. Use Nx for All Commands

Prefer `npx nx` over direct package scripts for better caching:
```bash
# Good
npx nx build frontend

# Also good (uses Nx internally)
npm run build:frontend
```

### 3. Keep Dependencies Updated

The monorepo benefits from consistent dependency versions:
```bash
npm outdated
npm update
```

### 4. Check Project Graph

Before major changes, visualize dependencies:
```bash
npx nx graph
```

### 5. Clean Builds When Needed

If you encounter weird issues:
```bash
npm run clean
npm ci
npm run build
```

## Package-Specific Notes

### Frontend (`packages/frontend`)
- Uses Vite for fast dev server and builds
- Requires Firebase environment variables
- Build output: `packages/frontend/dist`

### Backend (`packages/backend`)
- Express server with TypeScript
- Not deployed on Vercel (uses serverless functions instead)
- Build output: `packages/backend/dist`

### Accrual Engine (`packages/accrual-engine`)
- Core ESTA calculation logic
- Zero external dependencies (intentional)
- Used by frontend, backend, and serverless functions

### Shared Types (`packages/shared-types`)
- TypeScript type definitions
- No runtime code
- Dependency for most other packages

## Migration Notes

### From Turborepo to Nx

This project was migrated from Turborepo to Nx + Lerna for:
- Better caching strategies
- More flexible configuration
- Stronger ecosystem and plugin support
- Better integration with modern tools

Key changes:
- `turbo.json` → `nx.json` + `project.json` files
- `turbo run build` → `nx run-many --target=build --all`
- `.turbo/` cache → `.nx/cache/`

All existing functionality remains the same, just faster and more reliable.

## Additional Resources

- [Nx Documentation](https://nx.dev)
- [Lerna Documentation](https://lerna.js.org)
- [npm Workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [Project README](../README.md)
- [Contributing Guide](../CONTRIBUTING.md)

## Need Help?

If you encounter issues with the monorepo setup:
1. Check this guide first
2. Review the [Nx Documentation](https://nx.dev)
3. Check `.github/workflows/ci.yml` for working examples
4. Create an issue with the `build` or `monorepo` label
