# ESTA Tracker - Build System Documentation

## Overview

ESTA Tracker uses an Nx-powered monorepo build system that ensures correct build order, caching, and efficient parallel execution.

## Monorepo Structure

```
esta-tracker-monorepo/
├── apps/
│   ├── frontend/          # React + Vite frontend application
│   └── backend/           # Node.js backend server
├── libs/
│   ├── shared-types/      # Shared TypeScript types (foundational)
│   ├── shared-utils/      # Shared utility functions
│   ├── esta-firebase/     # Centralized Firebase service
│   ├── accrual-engine/    # Sick time accrual calculation engine
│   └── csv-processor/     # CSV import/export utilities
├── api/                   # Vercel serverless API functions
├── functions/             # Firebase Cloud Functions
└── e2e/                   # End-to-end tests (Playwright)
```

## Build Order

Nx automatically enforces the correct build order based on dependencies:

### Phase 1: Foundation Libraries (Built First)
- `shared-types` - Core TypeScript types and schemas
- `shared-utils` - Date/time utilities

### Phase 2: Dependent Libraries
- `esta-firebase` - Depends on `shared-types`
- `accrual-engine` - Depends on `shared-types`, `shared-utils`
- `csv-processor` - Depends on `shared-types`, `shared-utils`

### Phase 3: Applications
- `backend` - Independent application
- `frontend` - Depends on `esta-firebase` (built)
- `api` - Vercel serverless functions
- `functions` - Firebase Cloud Functions

### Phase 4: Testing
- `e2e` - End-to-end tests

## Build Commands

### Build Everything
```bash
npm run build
```
Runs `nx run-many --target=build --all` which:
- Builds all packages in correct dependency order
- Uses Nx caching to skip unchanged packages
- Runs builds in parallel where possible

### Build Specific Package
```bash
# Build frontend only (and its dependencies)
npm run build:frontend

# Build backend only
npm run build:backend

# Build specific library
npx nx build shared-types
```

### Build with Nx Cache Reset
```bash
# Clear Nx cache and rebuild
npm run clean
npm run build
```

## Environment Variables

### Frontend Build Requirements
The frontend build requires 6 Firebase environment variables. Without them, the build will fail:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**For local builds:** Create `.env` from `.env.example`
**For CI/CD:** Set as GitHub Secrets
**For Vercel:** Set in Project Settings → Environment Variables

### Validation
The build includes automatic environment validation:
```bash
# Validate manually
node scripts/check-envs.js
```

## Module Resolution

### TypeScript Path Aliases
Workspace packages use path aliases defined in `tsconfig.base.json`:
```json
{
  "paths": {
    "@esta/shared-types": ["libs/shared-types/dist"],
    "@esta/shared-types/*": ["libs/shared-types/dist/*"]
  }
}
```

**Important:** Path aliases point to the `dist` output directory, not the source. This ensures:
- Clean separation between packages
- Proper build order enforcement
- No cross-compilation issues

### Package Dependencies
Packages declare dependencies using `file:` protocol in `package.json`:
```json
{
  "dependencies": {
    "@esta/shared-types": "file:../shared-types",
    "@esta/firebase": "file:../../libs/esta-firebase"
  }
}
```

## Nx Configuration

### Build Targets (`nx.json`)
```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],  // Build dependencies first
      "outputs": ["{projectRoot}/dist", "{projectRoot}/build"],
      "cache": true
    }
  }
}
```

The `"dependsOn": ["^build"]` ensures that all dependencies are built before the current package.

### Caching
Nx caches build outputs based on:
- Source file changes
- package.json changes
- tsconfig changes
- Input file hashes

Cached builds are reused when nothing has changed, dramatically speeding up builds.

## Common Build Issues & Solutions

### Issue: "Cannot read properties of null (reading 'package')"
**Cause:** Missing or malformed `package.json` in a workspace directory
**Solution:** Ensure all workspace directories have valid `package.json` with `name` and `version` fields

### Issue: "Cannot find module '@esta/shared-types'"
**Cause:** Shared types not built before dependent package
**Solution:** 
- Run `npm run build` from root (Nx handles order automatically)
- Or manually: `npx nx build shared-types` then build dependent package

### Issue: "Module not found" during Vite build
**Cause:** Vite cannot resolve workspace packages
**Solution:** Ensure all dependencies are built first (handled automatically by Nx)

### Issue: Frontend build fails with env var errors
**Cause:** Missing required Firebase environment variables
**Solution:** 
1. Copy `.env.example` to `.env`
2. Fill in all 6 `VITE_FIREBASE_*` variables
3. Verify with: `node scripts/check-envs.js`

### Issue: TypeScript errors in api/ package
**Cause:** Cross-package imports or strict null checks
**Solution:** 
- API package now has local copies of required utilities
- All TypeScript strict mode errors have been addressed

## Vercel Deployment

### Build Configuration (`vercel.json`)
```json
{
  "buildCommand": "npx nx build frontend",
  "outputDirectory": "apps/frontend/dist",
  "installCommand": "npm install"
}
```

**Key Points:**
- Vercel runs `nx build frontend` which automatically builds dependencies first
- Nx ensures shared-types, esta-firebase, etc. are built before frontend
- The workspace installation is handled automatically by npm

### Environment Variables in Vercel
All 6 Firebase variables must be set in:
**Vercel Dashboard** → **Project Settings** → **Environment Variables**

Set for all environments: Production, Preview, Development

## CI/CD Pipeline

### GitHub Actions
The CI pipeline runs:
1. Install dependencies: `npm install`
2. Lint: `npm run lint`
3. Type check: `npm run typecheck`
4. Test: `npm run test`
5. Build: `npm run build`
6. Validate: `npm run validate:deployment`

Environment variables are provided via GitHub Secrets.

## Performance Tips

### Parallel Builds
Nx runs independent builds in parallel:
```bash
# Build all libs in parallel (since they don't depend on each other at same level)
npx nx run-many --target=build --projects=shared-types,shared-utils --parallel=2
```

### Selective Builds
Build only affected packages:
```bash
# Build only packages changed since main branch
npx nx affected --target=build --base=main
```

### Watch Mode for Development
```bash
# Watch and rebuild on changes
npm run dev
```

## Troubleshooting

### Reset Everything
```bash
# Nuclear option - clean and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Check Build Graph
```bash
# Visualize the build dependency graph
npx nx graph
```

### Check What Will Build
```bash
# See what will be built (dry run)
npx nx run-many --target=build --all --dry-run
```

## Additional Resources

- [Nx Documentation](https://nx.dev)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Vite Build Options](https://vitejs.dev/config/build-options.html)
- [Vercel Monorepo Guide](https://vercel.com/docs/concepts/monorepos)

## Summary

✅ Nx automatically handles build order
✅ Caching speeds up repeated builds
✅ Environment variables must be configured for frontend builds
✅ TypeScript path aliases point to dist/ directories
✅ All workspace packages have valid package.json files
✅ Build system is reliable and deterministic
