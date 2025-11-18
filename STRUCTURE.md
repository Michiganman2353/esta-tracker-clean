# Repository Structure Guide

## Overview
This repository follows Vercel best practices for monorepo structure, optimizing for performance, scalability, and maintainability.

## Directory Structure

```
esta-tracker-clean/
├── public/                    # Static assets served by Vercel
│   ├── favicon.ico
│   ├── manifest.json
│   └── vite.svg
│
├── lib/                       # Shared business logic
│   ├── firebase/              # Firebase initialization & config
│   ├── auth/                  # Authentication service
│   ├── api/                   # API client
│   ├── accrual/               # ESTA accrual calculations
│   └── documents/             # Document upload service
│
├── types/                     # Shared TypeScript types
│   └── index.ts
│
├── packages/
│   ├── frontend/              # React application (Vite)
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── pages/        # Page components
│   │   │   ├── contexts/     # React contexts
│   │   │   ├── lib/          # Re-exports from root /lib
│   │   │   └── types/        # Re-exports from root /types
│   │   ├── vite.config.ts    # Vite configuration
│   │   └── vitest.config.ts  # Test configuration
│   │
│   └── backend/               # Backend services
│       └── src/
│
├── functions/                 # Firebase Cloud Functions
│
├── .env.example               # Example environment variables
├── .env.development           # Development environment template
├── .env.production            # Production environment template
├── .env.preview               # Preview environment template
│
└── vercel.json                # Vercel deployment configuration
```

## Key Benefits

### 1. Vercel Optimization
- **Root `/public` directory**: Enables Vercel's CDN caching and static asset optimization
- **Automatic asset serving**: All files in `/public` are served from the domain root

### 2. Code Reusability
- **Shared `/lib` directory**: Business logic can be used by both frontend and backend
- **Modular organization**: Each lib module has a clear, single responsibility
- **Path aliases**: `@lib/*` and `@types` make imports clean and consistent

### 3. Type Safety
- **Centralized `/types`**: Single source of truth for TypeScript definitions
- **Shared across packages**: Backend and frontend use the same type definitions
- **Compile-time safety**: TypeScript catches type mismatches early

### 4. Environment Management
- **Stage-specific configs**: Separate templates for development, production, and preview
- **Security**: Templates are tracked in git, actual secrets are gitignored
- **Easy onboarding**: New developers can quickly set up their environment

### 5. Scalability
- **Monorepo structure**: Easy to add new packages (mobile app, admin portal, etc.)
- **Independent deployments**: Each package can be deployed separately if needed
- **Clear boundaries**: Well-defined module boundaries prevent tight coupling

## Path Aliases

The project uses TypeScript path aliases for clean imports:

```typescript
// Instead of relative paths:
import { User } from '../../../types';
import { auth } from '../../../lib/firebase';

// Use clean aliases:
import { User } from '@types';
import { auth } from '@lib/firebase';
```

### Configured in:
- `packages/frontend/tsconfig.json` - TypeScript compilation
- `packages/frontend/vite.config.ts` - Vite bundling
- `packages/frontend/vitest.config.ts` - Test imports

## Migration Strategy

### Backward Compatibility
To ensure zero breaking changes, the original file locations serve as re-exports:

```typescript
// packages/frontend/src/lib/firebase.ts
export * from '@lib/firebase';

// packages/frontend/src/types/index.ts
export * from '@types';
```

This means all existing imports continue to work:
```typescript
// Both work identically:
import { auth } from '../lib/firebase';  // Old style
import { auth } from '@lib/firebase';    // New style
```

### Recommended Migration
For new code, use the path aliases (`@lib/*`, `@types`) for consistency and clarity.

## Environment Variables

### Templates Provided
- `.env.development` - Local development configuration
- `.env.production` - Production deployment configuration  
- `.env.preview` - Preview/staging deployment configuration

### Usage
1. Copy the appropriate template to `.env.local`
2. Fill in your actual values
3. Never commit `.env.local` or files with actual secrets

### Vercel Deployment
Set environment variables in the Vercel dashboard for each environment:
- Production environment uses values from `.env.production` as a guide
- Preview deployments use values from `.env.preview` as a guide

## Firebase Configuration

Firebase initialization is centralized in `/lib/firebase`:

```typescript
import { auth, db, storage, functions } from '@lib/firebase';
```

All Firebase services are initialized once and exported for use throughout the application.

## ESTA Compliance Logic

Michigan ESTA-specific business logic is in `/lib/accrual`:

```typescript
import {
  calculateAccrual,
  validateUsageRequest,
  getComplianceRules,
  USAGE_CATEGORIES
} from '@lib/accrual';
```

This module contains:
- Accrual calculation rules
- Carryover logic
- Usage validation
- Compliance constants

## Best Practices

1. **Keep `/lib` pure**: Business logic should not depend on UI frameworks
2. **Use path aliases**: Always use `@lib/*` and `@types` in new code
3. **Single responsibility**: Each lib module should have one clear purpose
4. **Type everything**: Export types from `/types` for shared definitions
5. **Environment security**: Never commit actual secrets, use templates

## Future Expansion

The current structure supports easy addition of:
- Mobile app package (`packages/mobile`)
- Admin portal package (`packages/admin`)
- Shared utilities (`lib/utils`)
- State-specific compliance modules (`lib/accrual/california`, etc.)
- Additional API integrations (`lib/integrations/*`)

## Questions?

Refer to the main README.md for the full project vision and technical details.
