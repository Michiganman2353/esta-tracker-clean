# Monorepo Governance

This document describes the governance model and role assignment for the ESTA Tracker monorepo.

## Role Assignment

### Nx — Chief Executive Officer (CEO)

Nx is the **single executive authority** for task orchestration in this monorepo:

- **Task Execution**: All commands (build, test, lint, typecheck, dev) are executed through Nx's task runner
- **Project Graph**: Nx manages package interdependencies, task order, and project boundaries
- **Task Orchestration**: Nx coordinates parallelization, caching, incremental builds, and affected computations
- **Dev Server Orchestration**: All dev environment entry points are Nx targets
- **Firebase Integration**: Firebase tasks (deploy, emulators) are Nx targets in the graph
- **Vercel Integration**: Vercel uses Nx commands instead of raw npm scripts

### npm Workspaces — Chief Financial Officer (CFO)

npm Workspaces is the **single source for dependency management**:

- **Linking Local Packages**: Uses the `file:` protocol for workspace references
- **Installing Dependencies**: All dependency resolution flows through npm at the root
- **Hoisting**: Root `node_modules` is the consolidated dependency layer
- **Workspace Resolution**: Defines app/lib boundaries and dependency isolation

### Lerna — The Auditor

Lerna operates in a **strictly restricted manner**:

**Lerna DOES:**

- Versioning with conventional commits
- Changelog creation
- Publishing to npm (if needed)
- Uses `useWorkspaces: true` to align with npm Workspaces

**Lerna DOES NOT:**

- Bootstrapping
- Linking
- Installing dependencies
- Running scripts
- Building or coordinating tasks

## Project Structure

```
esta-tracker-monorepo/
├── apps/                 # Application-facing code
│   ├── frontend/         # React web application
│   └── backend/          # Express API server
├── libs/                 # Reusable logic packages
│   ├── shared-types/     # Shared TypeScript types
│   ├── shared-utils/     # Shared utility functions
│   ├── esta-firebase/    # Firebase service abstraction
│   ├── accrual-engine/   # ESTA accrual calculations
│   └── csv-processor/    # CSV processing utilities
├── packages/             # Core logic packages
│   ├── esta-core/        # Core ESTA logic
│   └── esta-firebase-adapter/  # Firebase adapter
├── functions/            # Firebase Cloud Functions
├── api/                  # Vercel API functions
└── infra/                # Infrastructure configurations
    └── firebase/         # Firebase infrastructure management
```

## Available Commands

### Primary Commands (via Nx)

```bash
# Development
npm run dev               # Run all dev servers
npm run dev:frontend      # Run frontend dev server
npm run dev:backend       # Run backend dev server

# Building
npm run build             # Build all projects
npm run build:frontend    # Build frontend
npm run build:backend     # Build backend
npm run build:functions   # Build Firebase functions
npm run build:affected    # Build only affected projects

# Testing
npm run test              # Run all tests
npm run test:affected     # Test only affected projects
npm run test:e2e          # Run E2E tests

# Linting
npm run lint              # Lint all projects
npm run lint:affected     # Lint only affected projects

# Type Checking
npm run typecheck         # Type check all projects
npm run typecheck:affected # Type check only affected projects
```

### Firebase Commands (via Nx)

```bash
npm run firebase:emulators    # Start Firebase emulators
npm run firebase:deploy       # Deploy all Firebase resources
npm run firebase:deploy:rules # Deploy Firestore/Storage rules
```

### Nx-specific Commands

```bash
npm run graph                 # Visualize project dependency graph
npm run affected              # Show affected projects
npm run validate:workspace    # Validate Nx workspace integrity
```

## Project Tags and Boundaries

Projects are tagged for dependency enforcement:

| Tag              | Description              |
| ---------------- | ------------------------ |
| `type:app`       | Application projects     |
| `type:lib`       | Library projects         |
| `type:firebase`  | Firebase Cloud Functions |
| `type:api`       | Vercel API functions     |
| `type:infra`     | Infrastructure projects  |
| `scope:frontend` | Frontend-specific code   |
| `scope:backend`  | Backend-specific code    |
| `scope:shared`   | Shared across apps       |
| `scope:firebase` | Firebase-related code    |
| `platform:web`   | Browser platform         |
| `platform:node`  | Node.js platform         |

### Boundary Rules

- **Apps** can only depend on libs, firebase, and api projects
- **Frontend** can only depend on frontend, shared, and firebase scopes
- **Backend** can only depend on backend, shared, and firebase scopes
- **Shared** libs can only depend on other shared libs
- **Firebase functions** cannot depend on frontend or web platform code
- **Web platform** code cannot depend on Node.js platform code

## CI/CD Integration

### GitHub Actions

- Uses Nx affected commands to minimize build time
- Validates workspace integrity on every PR
- Validates Nx project graph coherence
- Caches Nx and node_modules

### Vercel

- Builds invoke Nx's build target for frontend
- Output paths match Nx project definitions
- Respects Nx dependency graph for builds

## Governance Rules

1. **No tool may perform work outside its assigned domain**
2. **No package may define scripts that conflict with Nx**
3. **All builds, tests, and lints must go through Nx**
4. **Lerna is only used for versioning and publishing**
5. **npm is only used for dependency management**
