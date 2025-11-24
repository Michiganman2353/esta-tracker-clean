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
- Standardized on VITE_ prefix for environment variables

---

[Unreleased]: https://github.com/Michiganman2353/ESTA-Logic/compare/main...HEAD
[2.0.0]: https://github.com/Michiganman2353/ESTA-Logic/releases/tag/v2.0.0
