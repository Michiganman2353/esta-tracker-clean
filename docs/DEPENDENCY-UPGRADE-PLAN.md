# Dependency Upgrade Plan

## Overview

This document outlines the upgrade path for deprecated and outdated dependencies in the ESTA Tracker monorepo.

## Current Status

### Security Vulnerabilities
- **5 moderate severity vulnerabilities** detected by `npm audit`
- Primary issues: `esbuild`, `vite`, `vitest`, and `@vitest/ui`

### Deprecated Packages
The following packages are showing deprecation warnings:
- `eslint@8.57.1` → Superseded by eslint@9
- `inflight@1.0.6` → Use lru-cache instead
- `rimraf@3.0.2` → Update to rimraf@4+
- `glob@7.2.3` → Update to glob@9+
- `npmlog@5.0.1` → No longer supported
- `@humanwhocodes/config-array` → Use @eslint/config-array
- `@humanwhocodes/object-schema` → Use @eslint/object-schema
- `are-we-there-yet@2.0.0` → No longer supported
- `gauge@3.0.2` → No longer supported

## Priority 1: Security Fixes (Critical)

### Fix esbuild vulnerability in vite

**Issue:** CVE affecting esbuild ≤0.24.2 (development server security)
**Severity:** Moderate (CVSS 5.3)
**Impact:** Development only (not production)

**Solution Options:**

1. **Option A: Upgrade vite (Breaking Changes)**
   ```bash
   # In packages/frontend/package.json
   npm install vite@7 --workspace=@esta-tracker/frontend
   ```
   **Risk:** Major version change may require code updates
   **Testing Required:** Extensive

2. **Option B: Accept Risk (Recommended)**
   - Vulnerability only affects development server
   - Production builds are unaffected
   - Monitor for vite@6 stable release

**Recommendation:** Accept risk and document. Monitor vite@6 and vite@7 releases.

### Upgrade vitest (Lower Risk)

**Current:** vitest@1.6.1
**Latest:** vitest@4.0.12

**Solution:**
```bash
# Update vitest in all workspaces
npm install vitest@latest --workspaces
npm install @vitest/ui@latest --workspace=@esta-tracker/frontend
```

**Testing Required:**
- Run `npm test` in all packages
- Verify test coverage still works
- Check vitest UI functionality

## Priority 2: Major Version Upgrades (Breaking Changes)

These upgrades require careful testing and may break existing functionality.

### ESLint 9 Migration

**Current:** eslint@8.57.1
**Target:** eslint@9.39.1

**Breaking Changes:**
- New flat config format (eslint.config.js)
- Some plugins may need updates
- @typescript-eslint needs v8+

**Migration Steps:**
1. Read [ESLint v9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
2. Update eslint and related plugins:
   ```bash
   npm install eslint@9 --workspaces
   npm install @typescript-eslint/eslint-plugin@8 --workspaces
   npm install @typescript-eslint/parser@8 --workspaces
   ```
3. Convert `.eslintrc.*` to `eslint.config.js`
4. Test: `npm run lint`

**Estimated Effort:** 2-4 hours

### React 19 Upgrade

**Current:** react@18.3.1, react-dom@18.3.1
**Target:** react@19.2.0, react-dom@19.2.0

**Breaking Changes:**
- New JSX transform (may affect build)
- Some deprecated APIs removed
- Type definitions updated

**Migration Steps:**
1. Read [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19)
2. Update React packages:
   ```bash
   npm install react@19 react-dom@19 --workspace=@esta-tracker/frontend
   npm install @types/react@19 @types/react-dom@19 --workspace=@esta-tracker/frontend
   ```
3. Test thoroughly (all components)
4. Run E2E tests

**Estimated Effort:** 4-8 hours

### Vite 7 Upgrade

**Current:** vite@5.4.21
**Target:** vite@7.2.4

**Breaking Changes:**
- Node.js 18 minimum (already met)
- Plugin API changes
- Some configuration changes

**Migration Steps:**
1. Read [Vite 7 Migration Guide](https://vitejs.dev/guide/migration.html)
2. Update:
   ```bash
   npm install vite@7 @vitejs/plugin-react@5 --workspace=@esta-tracker/frontend
   ```
3. Update vite.config.ts if needed
4. Test build and dev server

**Estimated Effort:** 1-2 hours

### Express 5 Upgrade

**Current:** express@4.21.2
**Target:** express@5.1.0

**Breaking Changes:**
- Promise rejection handling changed
- Some middleware APIs updated
- Route parameter parsing changed

**Migration Steps:**
1. Read [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)
2. Update:
   ```bash
   npm install express@5 --workspace=@esta-tracker/backend
   npm install @types/express@5 --workspace=@esta-tracker/backend
   ```
3. Update middleware error handling
4. Test all API endpoints

**Estimated Effort:** 3-5 hours

## Priority 3: Safe Minor Updates (Low Risk)

These can be updated with minimal risk:

```bash
# Safe updates
npm install concurrently@latest --save-dev
npm install firebase-admin@latest
npm install helmet@latest --workspace=@esta-tracker/backend
npm install dotenv@latest --workspace=@esta-tracker/backend
```

## Priority 4: Deprecated Transitive Dependencies

These are dependencies of dependencies and will be resolved when parent packages are updated:

- `inflight` → Will be resolved when updating packages that depend on glob
- `rimraf@3` → Will be resolved by updates to packages using it
- `glob@7` → Will be resolved by package updates
- `npmlog` → Will be resolved by package updates
- `@humanwhocodes/*` → Will be resolved by eslint@9 upgrade

**Action:** No direct action needed. These will resolve automatically.

## Recommended Upgrade Schedule

### Phase 1: Immediate (This Sprint)
1. ✅ Fix CI/CD deployment issues (DONE)
2. Document upgrade plan (THIS FILE)
3. Add `.vercelignore` (DONE)

### Phase 2: Next Sprint (1-2 weeks)
1. Safe minor updates (Priority 3)
2. vitest upgrade (Priority 1)
3. Testing and validation

### Phase 3: Future Sprint (1 month)
1. ESLint 9 migration
2. Vite 7 upgrade
3. React 19 upgrade (if needed)

### Phase 4: Long-term (3-6 months)
1. Express 5 migration
2. Tailwind 4 upgrade
3. React Router 7 upgrade

## Testing Strategy

For each upgrade:

### 1. Pre-upgrade Checklist
- [ ] Create feature branch
- [ ] Document current behavior
- [ ] Run full test suite
- [ ] Capture baseline metrics

### 2. Upgrade Process
- [ ] Update package.json
- [ ] Run `npm install`
- [ ] Fix any immediate errors
- [ ] Update configuration if needed

### 3. Validation
- [ ] Run `npm run lint`
- [ ] Run `npm run typecheck`
- [ ] Run `npm run test`
- [ ] Run `npm run build`
- [ ] Run `npm run test:e2e`
- [ ] Manual smoke testing

### 4. Rollback Plan
```bash
# If upgrade fails:
git checkout package.json package-lock.json
npm ci
npm run build
```

## Monitoring Upgrades

Track package updates:
```bash
# Check for updates
npm outdated

# Check for security issues
npm audit

# Check for deprecated packages
npm list --depth=0 | grep -i deprecated
```

## Decision: Current Approach

**For this PR:**
- ✅ Fix critical CI/CD deployment issues (DONE)
- ✅ Document upgrade path (THIS FILE)
- ✅ Add validation and troubleshooting tools (DONE)
- ❌ Skip dependency upgrades (separate effort)

**Rationale:**
1. CI/CD fixes are critical and urgent
2. Dependency upgrades are time-consuming
3. Major version upgrades require extensive testing
4. Current deprecation warnings are non-blocking
5. Security vulnerabilities are development-only

**Next Steps:**
- User should test CI/CD fixes first
- Schedule dependency upgrade sprint separately
- Prioritize based on actual impact

## Resources

- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [ESLint migration guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [React 19 release notes](https://react.dev/blog/2024/04/25/react-19)
- [Vite migration guide](https://vitejs.dev/guide/migration.html)
- [Express 5 migration](https://expressjs.com/en/guide/migrating-5.html)
