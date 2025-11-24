---
name: Pull Request
about: Submit changes to the ESTA Tracker codebase
title: ''
labels: ''
assignees: ''
---

## Description
<!-- Provide a clear and concise description of your changes -->

## Type of Change
<!-- Check all that apply -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update
- [ ] CI/CD improvement
- [ ] Performance improvement
- [ ] Security fix

## Related Issues
<!-- Link any related issues here -->
Fixes #
Related to #

## Changes Made
<!-- List the specific changes made in this PR -->
- 
- 
- 

## Testing
<!-- Describe the tests you ran to verify your changes -->
- [ ] Unit tests pass (`npm run test`)
- [ ] Integration tests pass (if applicable)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Lint checks pass (`npm run lint`)
- [ ] Type checks pass (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)

## Affected Projects
<!-- Check all Nx projects affected by this change -->
- [ ] Frontend (`apps/frontend`)
- [ ] Backend (`apps/backend`)
- [ ] Shared Types (`libs/shared-types`)
- [ ] Shared Utils (`libs/shared-utils`)
- [ ] Firebase Library (`libs/esta-firebase`)
- [ ] Accrual Engine (`libs/accrual-engine`)
- [ ] CSV Processor (`libs/csv-processor`)
- [ ] API Functions (`api`)

## Module Boundaries
<!-- Confirm that module boundaries are respected -->
- [ ] No unauthorized cross-scope dependencies (frontend ↔ backend)
- [ ] Only shared libraries are imported across scopes
- [ ] ESLint module boundary checks pass

## Security Considerations
<!-- Address any security implications -->
- [ ] No secrets or credentials committed
- [ ] Input validation implemented where needed
- [ ] Security audit passed (`npm audit`)
- [ ] CORS configuration reviewed (if applicable)
- [ ] Authentication/authorization reviewed (if applicable)

## Performance Impact
<!-- Describe any performance implications -->
- [ ] No significant performance degradation
- [ ] Bundle size impact reviewed (if frontend)
- [ ] Database query performance reviewed (if backend)

## Documentation
<!-- Ensure documentation is updated -->
- [ ] Code comments added/updated
- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] Type definitions updated (if applicable)

## Deployment Notes
<!-- Any special deployment considerations -->
- [ ] Environment variables documented
- [ ] Migration scripts included (if needed)
- [ ] Backward compatible (or breaking changes documented)

## Screenshots
<!-- If applicable, add screenshots to demonstrate changes -->

## Additional Context
<!-- Add any other context about the PR here -->

---

## Reviewer Checklist
<!-- For reviewers -->
- [ ] Code follows project conventions
- [ ] Module boundaries respected
- [ ] Tests are comprehensive
- [ ] Documentation is adequate
- [ ] Security considerations addressed
- [ ] Performance impact acceptable
