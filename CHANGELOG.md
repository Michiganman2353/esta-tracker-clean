# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **@esta/core package**: Pure business logic for Michigan ESTA compliance calculations
  - `calculateAccruedHours()` - Calculate sick time accrual (1 hour per 30 hours worked)
  - `calculateCappedAccrual()` - Apply employer size caps (40h small, 72h large)
  - `calculateBalance()` - Calculate remaining sick time balance
  - Comprehensive unit tests for all functions
- **@esta/firebase-adapter package**: Firebase integration layer
  - Isolates Firebase/Firestore interactions from core logic
  - Provides `initAdmin()`, `getEmployeeHours()`, `computeAndStoreAccrual()` functions
- **Security scanning workflows**:
  - Secret scanning with Gitleaks (weekly scheduled + on PR)
  - CodeQL static analysis (weekly scheduled + on PR)
  - Dependabot for automated dependency updates
- **SECURITY.md**: Vulnerability reporting guidelines
- **CHANGELOG.md**: This changelog file
- **SBOM generation**: CycloneDX SBOM generation script

### Changed

- Updated root package.json to include `packages/*` workspace
- Extended tsconfig.base.json with paths for @esta/core and @esta/firebase-adapter

### Security

- Added Gitleaks configuration for secret scanning
- Added CodeQL analysis for JavaScript/TypeScript
- Added Dependabot configuration for automated security updates

## [2.1.0] - 2025-11-28

### Production-Grade Architecture & CI/CD Overhaul (Swiss Watch 2025)

This release converts ESTA-Logic from prototype to production-grade platform with deterministic, replayable builds, emulator-backed acceptance testing, and strict dependency contract enforcement.

### Added

- **Deterministic CI Pipeline**:
  - Zero-entropy builds with `nx reset` + cache directory cleanup
  - Lockfile validation (`npm ci --dry-run`) before every build step
  - Workflow concurrency control to prevent race conditions
- **Immutable Vercel Infrastructure Contract**:
  - `.vercel/project.json` template committed for deploy context integrity
  - Updated `.gitignore` to allow `project.json` while excluding credentials
- **Contract-Driven Monorepo (2025 ESM Standard)**:
  - Explicit `exports` fields added to all packages
  - Unified `type: module` across all workspaces

### Changed

- **CI Workflow Improvements**:
  - All `nx reset` calls now include explicit cache directory cleanup
  - Added Zero-Entropy Build comments for clarity
  - Both ci.yml and ci-elite.yml follow same deterministic patterns
- **Package Exports Standardization**:
  - `functions/package.json`: Added `type: module` and `exports`
  - `api/package.json`: Added explicit `exports` field
  - `apps/backend/package.json`: Added explicit `exports` field
  - `apps/frontend/package.json`: Added explicit `exports` field
  - `apps/marketing/package.json`: Added explicit `exports` field

### Architecture

- **Swiss Watch 2025 Doctrine**:
  - Deterministic, replayable builds enforced
  - Strict package contract compliance
  - Emulator-driven acceptance tests (via global-setup.ts)
  - Zero warnings, zero drift policy
  - No unstable secrets in critical paths
  - Verified deploy context integrity

### Rollback Plan

In case of deployment issues:

1. Revert to previous commit: `git revert HEAD`
2. Force redeploy from Vercel dashboard
3. Check workflow run logs for specific failures

## [2.0.0] - Previous Release

### Added

- Monorepo structure with Nx and npm workspaces
- Frontend (React + Vite) and Backend (Node.js + Express) applications
- Shared types library (@esta/shared-types)
- Accrual engine library (@esta-tracker/accrual-engine)
- Firebase integration for authentication and data storage
- Playwright E2E testing infrastructure
- CI/CD pipeline with GitHub Actions
- Vercel deployment integration

### Changed

- Migrated from single app to monorepo architecture
- Standardized on VITE\_ prefix for environment variables

---

[Unreleased]: https://github.com/Michiganman2353/ESTA-Logic/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/Michiganman2353/ESTA-Logic/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Michiganman2353/ESTA-Logic/releases/tag/v2.0.0
