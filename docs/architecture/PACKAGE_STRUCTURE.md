# ESTA Tracker Monorepo - Package Dependency Structure

This document provides visual representations of the monorepo package structure and dependencies.

---

## Current Package Structure

```
esta-tracker-clean/
│
├── packages/                           # Workspace packages
│   ├── frontend/                       # React SPA (Vite + TypeScript)
│   │   └── depends on: types, utils
│   │
│   ├── backend/                        # Express API server
│   │   └── depends on: types, utils, firebase (migrating)
│   │
│   ├── shared-types/                   # ✅ Core - Types & Zod schemas
│   │   └── depends on: NONE
│   │
│   ├── shared-utils/                   # ✅ Core - Common utilities
│   │   └── depends on: types
│   │
│   ├── firebase/                       # ✅ NEW - Firebase Admin service
│   │   └── depends on: NONE
│   │
│   ├── accrual-engine/                 # Business logic - ESTA calculations
│   │   └── depends on: types, utils
│   │
│   └── csv-processor/                  # CSV import/export
│       └── depends on: types, utils
│
├── api/                                # ✅ NEW in workspace - Vercel functions
│   └── depends on: firebase (migrating), types, utils
│
└── functions/                          # ✅ NEW in workspace - Firebase Cloud Functions
    └── depends on: firebase (migrating), types, utils
```

---

## Dependency Flow Diagram

### Layered Architecture (Top-down)

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│  (User-facing applications and API endpoints)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│   │   FRONTEND   │    │   BACKEND    │    │   API/       │    │
│   │   (React)    │    │   (Express)  │    │   FUNCTIONS  │    │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    │
│          │                   │                    │             │
└──────────┼───────────────────┼────────────────────┼─────────────┘
           │                   │                    │
           └─────────┬─────────┴────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                            │
│  (Domain-specific logic and processing)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────────┐           ┌──────────────────┐          │
│   │  ACCRUAL ENGINE  │           │  CSV PROCESSOR   │          │
│   │  (Calculations)  │           │  (Import/Export) │          │
│   └────────┬─────────┘           └────────┬─────────┘          │
│            │                               │                     │
└────────────┼───────────────────────────────┼─────────────────────┘
             │                               │
             └───────────┬───────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                    SERVICE LAYER                                 │
│  (External integrations and infrastructure)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────────────────────────────────────────┐          │
│   │       @esta-tracker/firebase  ✨ NEW             │          │
│   │  (Firebase Admin SDK - Auth, Firestore, Storage) │          │
│   └──────────────────────────────────────────────────┘          │
│                                                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                             │
│  (Core utilities, types, and configuration)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────────┐    ┌─────────────────┐    ┌────────────┐ │
│   │  SHARED-TYPES   │    │  SHARED-UTILS   │    │   CONFIG   │ │
│   │  (Types & Zod)  │    │  (Utilities)    │    │  (Planned) │ │
│   └─────────────────┘    └─────────────────┘    └────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Package Dependency Graph

### Detailed Package-to-Package Dependencies

```
                    ┌─────────────────┐
                    │  ROOT WORKSPACE │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌──────────────┐
│   FRONTEND    │    │    BACKEND    │    │  API/        │
│               │    │               │    │  FUNCTIONS   │
└───────┬───────┘    └───────┬───────┘    └──────┬───────┘
        │                    │                    │
        │                    │                    │
        │    ┌───────────────┴────────────────────┤
        │    │               │                    │
        │    ▼               │                    │
        │ ┌──────────────────▼────┐               │
        │ │  @esta-tracker/       │◄──────────────┘
        │ │  firebase ✨          │
        │ │  (Centralized)        │
        │ └───────────────────────┘
        │                    │
        └────────┬───────────┴────────────────────┐
                 │                                 │
                 ▼                                 ▼
        ┌────────────────┐              ┌─────────────────┐
        │  ACCRUAL       │              │  CSV            │
        │  ENGINE        │              │  PROCESSOR      │
        └────────┬───────┘              └────────┬────────┘
                 │                               │
                 └───────────┬───────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
        ┌────────────────┐      ┌───────────────┐
        │  SHARED-TYPES  │      │  SHARED-UTILS │
        │  (Foundation)  │◄─────┤  (Foundation) │
        └────────────────┘      └───────────────┘
```

### Key:
- `┌─┐` = Package
- `│` `└` `┬` `▼` = Dependency flow (top imports from bottom)
- `✨` = Newly created package
- `◄─` = Direct dependency

---

## Import Rules & Boundaries

### ✅ Allowed Imports

```
Frontend    CAN import →  shared-types, shared-utils, config (future)
Backend     CAN import →  shared-types, shared-utils, firebase, config (future)
API/Funcs   CAN import →  shared-types, shared-utils, firebase, config (future)
Accrual     CAN import →  shared-types, shared-utils
CSV Proc    CAN import →  shared-types, shared-utils
Firebase    CAN import →  NONE (no internal dependencies)
Shared-Utils CAN import →  shared-types
Shared-Types CAN import → NONE (no dependencies)
Config      CAN import →  NONE (no dependencies) (future)
```

### ❌ Prohibited Imports

```
Frontend    CANNOT import →  backend, api, functions, firebase
Shared-*    CANNOT import →  frontend, backend, api, functions
Firebase    CANNOT import →  ANY internal packages
Backend     CANNOT import →  frontend
API         CANNOT import →  backend, frontend
Functions   CANNOT import →  backend, frontend, api
```

### Rationale

1. **Frontend cannot import backend code:**
   - Prevents server-side code/secrets from leaking to client
   - Maintains clear server/client separation

2. **Shared packages cannot import applications:**
   - Prevents circular dependencies
   - Ensures shared packages remain truly shared

3. **Firebase package has zero dependencies:**
   - Can be used by any server-side package
   - No risk of circular dependencies
   - Pure infrastructure concern

4. **Foundation layer (types, utils) has minimal dependencies:**
   - shared-types: ZERO dependencies (most fundamental)
   - shared-utils: Only depends on shared-types
   - Ensures stable foundation for all other packages

---

## Build Order (Turborepo)

Turborepo automatically determines build order based on dependencies.

### Parallel Build Groups

**Group 1 (Parallel - No Dependencies):**
```
shared-types  ─┐
shared-utils  ─┼─► Build in parallel (2-3 seconds)
firebase      ─┘
```

**Group 2 (Parallel - Depends on Group 1):**
```
accrual-engine  ─┐
csv-processor   ─┼─► Build in parallel after Group 1 (1-2 seconds)
backend         ─┤
frontend        ─┤
api             ─┤
functions       ─┘
```

**Total Build Time:**
- **Cold build:** ~14-15 seconds
- **With cache:** ~7 seconds (50% faster)
- **With remote cache:** ~3 seconds (80% faster)

---

## Environment Variable Separation

### Frontend (Public - Bundled into Client)

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_API_URL

Access: import.meta.env.VITE_*
Location: Frontend only
Security: Public - visible in browser
```

### Backend (Private - Server-Only)

```
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_SERVICE_ACCOUNT
GOOGLE_APPLICATION_CREDENTIALS

GCP_PROJECT_ID
KMS_KEYRING_NAME
KMS_LOCATION
KMS_ENCRYPTION_KEY_NAME
KMS_KEY_VERSION

NODE_ENV
PORT
CORS_ORIGIN

Access: process.env.FIREBASE_*
Location: Backend, API, Functions
Security: Private - never exposed to client
```

### ⚠️ CRITICAL RULE

**NEVER mix VITE_* and process.env in the same package!**

- Frontend uses `VITE_*` prefix (Vite bundler convention)
- Backend uses NO prefix (standard Node.js)
- This prevents accidental exposure of secrets

---

## Package Sizes (Source Code)

```
Estimated Lines of Code (TypeScript):

shared-types:      ~500 LOC
shared-utils:      ~300 LOC
firebase:          ~350 LOC  ✨ NEW
config:            ~400 LOC  (planned)
accrual-engine:   ~800 LOC
csv-processor:    ~400 LOC
backend:         ~2000 LOC
frontend:        ~3500 LOC
api:             ~1200 LOC
functions:        ~700 LOC
───────────────────────────
Total:          ~10,150 LOC
```

---

## Future Package Structure (6-12 Months)

```
packages/
│
├── Core Infrastructure (Current)
│   ├── shared-types/              ✅ Exists
│   ├── shared-utils/              ✅ Exists
│   ├── config/                    🔄 Planned (Sprint 2)
│   └── firebase/                  ✅ Exists (NEW)
│
├── Applications (Current)
│   ├── frontend/                  ✅ Exists
│   ├── backend/                   ✅ Exists
│   ├── api/                       ✅ Exists
│   └── functions/                 ✅ Exists
│
├── Business Logic (Current)
│   ├── accrual-engine/            ✅ Exists
│   └── csv-processor/             ✅ Exists
│
├── UI Components (Future - Month 3)
│   └── ui/                        📅 Component library with Storybook
│
├── Rules Engine (Future - Month 5)
│   ├── rules-engine/              📅 State-agnostic rule abstraction
│   ├── rules-michigan/            📅 Michigan ESTA rules
│   ├── rules-california/          📅 California sick leave rules
│   └── rules-oregon/              📅 Oregon sick leave rules
│
├── Platform Services (Future - Month 8)
│   ├── analytics/                 📅 Analytics & reporting
│   ├── notifications/             📅 Email/SMS service
│   ├── audit/                     📅 Enhanced audit trail
│   ├── api-gateway/               📅 Rate limiting & monitoring
│   └── queue/                     📅 Background job queue (Bull)
│
└── Data Layer (Future - Month 11)
    └── db/                        📅 Database abstraction (Prisma/TypeORM)
```

---

## Testing Strategy by Package

```
Package          | Test Type       | Coverage Target | Status
─────────────────┼─────────────────┼─────────────────┼────────────
shared-types     | Unit            | 100%            | ❌ Add tests
shared-utils     | Unit            | 90%             | ❌ Add tests
firebase         | Unit + Int      | 80%             | ❌ Add tests
config           | Unit            | 100%            | 📅 Future
accrual-engine   | Unit            | 95% (critical!) | ❌ Add tests
csv-processor    | Unit            | 85%             | ❌ Add tests
backend          | Unit + Int      | 75%             | ✅ Has tests
frontend         | Unit + E2E      | 70%             | ✅ Has tests
api              | Unit + Int      | 75%             | ⚠️ Partial
functions        | Unit + Int      | 80%             | ⚠️ Minimal

E2E Tests        | Integration     | Core flows      | ✅ Exists
```

---

## Monorepo Management Commands

### Workspace Operations

```bash
# Install all dependencies
npm install

# Add dependency to specific package
npm install --workspace=@esta-tracker/frontend react-query

# Run command in all workspaces
npm run build --workspaces

# Run command in specific workspace
npm run dev --workspace=@esta-tracker/backend
```

### Turborepo Operations

```bash
# Build all packages
turbo run build

# Build with cache
turbo run build --cache-dir=.turbo

# Build specific package and dependencies
turbo run build --filter=@esta-tracker/frontend

# Force rebuild (ignore cache)
turbo run build --force

# Show what will be run (dry run)
turbo run build --dry-run
```

### Development Workflow

```bash
# Start all dev servers
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Run tests in watch mode
npm run test -- --watch

# Run E2E tests
npm run test:e2e
```

---

## Key Architectural Decisions

### 1. ESM (ECMAScript Modules)
- All packages use `"type": "module"`
- Modern JavaScript standard
- Better tree-shaking in bundlers
- Future-proof

### 2. TypeScript Everywhere
- Shared `tsconfig.base.json`
- Strict mode enabled
- Consistent configuration

### 3. Turborepo for Orchestration
- Smart caching
- Parallel execution
- Remote cache ready
- Clear task dependencies

### 4. Monorepo with npm Workspaces
- Single `package-lock.json`
- Hoisted dependencies
- Fast installs
- No lerna/yarn needed

### 5. Clear Layered Architecture
- Foundation → Service → Business Logic → Application
- Prevents circular dependencies
- Easy to understand and maintain

---

## Success Indicators

✅ **Current State (Phase 1 Complete):**
- All 8 packages build successfully
- Firebase Admin centralized
- Turbo configuration optimized
- Workspace properly configured

🔄 **Target State (End of Phase 2):**
- All server code uses @esta-tracker/firebase
- Config package operational
- No environment variable misuse
- TypeScript path aliases working

🎯 **Final Goal (End of Phase 4):**
- >80% test coverage on business logic
- <3s build time with remote cache
- Clear migration documentation
- ESLint enforcing boundaries
- Developer onboarding <4 hours

---

**Last Updated:** November 21, 2025  
**Maintained By:** Architecture Team  
**Related Documents:**
- [Monorepo Audit Report](./MONOREPO_AUDIT_REPORT.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
