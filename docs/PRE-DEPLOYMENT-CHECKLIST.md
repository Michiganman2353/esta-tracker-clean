# Pre-Deployment Checklist

Use this checklist before deploying to production or creating a preview deployment.

## 🔐 Secrets & Configuration

### GitHub Secrets (Required for CI/CD)
- [ ] `VERCEL_TOKEN` is configured in GitHub repository secrets
- [ ] `VERCEL_ORG_ID` is configured in GitHub repository secrets
- [ ] `VERCEL_PROJECT_ID` is configured in GitHub repository secrets
- [ ] All secrets are valid and not expired
- [ ] No secrets are committed to source control

### Vercel Environment Variables
- [ ] All required Firebase environment variables are set in Vercel
- [ ] Environment variables are scoped correctly (Production/Preview/Development)
- [ ] Sensitive variables are marked as "Sensitive" in Vercel dashboard

### Firebase Configuration
- [ ] Firebase project is properly configured
- [ ] Firestore security rules are deployed
- [ ] Storage security rules are deployed
- [ ] Authentication providers are enabled

## 🏗️ Build Validation

### Local Build
```bash
# Run these commands and verify they complete successfully:
npm ci                          # ✓ Clean install
npm run lint                    # ✓ Linting passes
npm run typecheck               # ✓ Type checking passes
npm run test                    # ✓ Unit tests pass
npm run build                   # ✓ Build succeeds
npm run validate:deployment     # ✓ Deployment validation passes
```

- [ ] All commands above completed successfully
- [ ] No errors in build output
- [ ] Build artifacts exist in `packages/frontend/dist/`
- [ ] `packages/frontend/dist/index.html` exists
- [ ] Asset files are generated in `dist/assets/`

### Build Output Verification
```bash
# Check build output:
ls -lh packages/frontend/dist/
ls -lh packages/frontend/dist/assets/
```

- [ ] Total bundle size is reasonable (< 1MB gzipped recommended)
- [ ] No unexpected files in dist directory
- [ ] Source maps are present (`.map` files)

## 🧪 Testing

### Unit Tests
- [ ] All unit tests pass (`npm run test`)
- [ ] No skipped tests without justification
- [ ] Test coverage meets project standards
- [ ] No flaky tests

### E2E Tests (if applicable)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Critical user flows are covered
- [ ] No flaky E2E tests

### Manual Testing
- [ ] Registration flow works
- [ ] Login flow works
- [ ] Main features tested manually
- [ ] Mobile responsive design verified
- [ ] Browser compatibility checked (Chrome, Firefox, Safari)

## 📦 Dependencies

### Security
```bash
npm audit
```

- [ ] No critical or high severity vulnerabilities
- [ ] Moderate vulnerabilities are documented and accepted
- [ ] All dependencies are from trusted sources

### Updates
- [ ] No breaking changes in dependencies
- [ ] Lock file (`package-lock.json`) is committed
- [ ] No unnecessary dependencies added

## 🚀 Deployment Configuration

### vercel.json
- [ ] `outputDirectory` is correct (`packages/frontend/dist`)
- [ ] `buildCommand` is correct (`npm run build:frontend`)
- [ ] API functions are properly configured
- [ ] Security headers are in place
- [ ] Rewrites are configured correctly

### GitHub Actions
- [ ] Workflow file is valid YAML
- [ ] All required steps are present
- [ ] Node.js version matches project requirements (20.x)
- [ ] Caching is properly configured

## 🔍 Code Quality

### Linting
```bash
npm run lint
```

- [ ] No linting errors
- [ ] No linting warnings (or documented exceptions)
- [ ] Code follows project style guidelines

### Type Safety
```bash
npm run typecheck
```

- [ ] No TypeScript errors
- [ ] No use of `any` type without justification
- [ ] All imports are properly typed

### Code Review
- [ ] Code has been reviewed by at least one other developer (if team project)
- [ ] All review comments have been addressed
- [ ] No TODO comments left unresolved
- [ ] Documentation is updated if needed

## 📝 Documentation

### Code Documentation
- [ ] New features are documented
- [ ] Complex logic has comments
- [ ] API endpoints are documented
- [ ] README is up to date

### Deployment Documentation
- [ ] Changes are noted in CHANGELOG (if applicable)
- [ ] Breaking changes are clearly documented
- [ ] Migration steps are provided (if needed)

## 🔄 Version Control

### Git
```bash
git status
git log --oneline -5
```

- [ ] All changes are committed
- [ ] Commit messages are clear and descriptive
- [ ] No sensitive data in commit history
- [ ] Branch is up to date with main/master

### Pull Request (if applicable)
- [ ] PR title is descriptive
- [ ] PR description explains the changes
- [ ] All CI checks pass
- [ ] No merge conflicts
- [ ] Required approvals received

## 🌐 Vercel Deployment

### Before Deployment
- [ ] Vercel project is linked (`vercel link` has been run)
- [ ] `.vercel/project.json` exists locally (but not committed)
- [ ] Project is configured in Vercel dashboard

### Preview Deployment (PR)
```bash
# This should happen automatically via GitHub Actions, but you can test locally:
vercel deploy
```

- [ ] Preview deployment succeeds
- [ ] Preview URL is accessible
- [ ] Preview environment works correctly
- [ ] No console errors in browser

### Production Deployment (Master)
Only proceed if:
- [ ] Preview deployment is successful
- [ ] All tests pass
- [ ] Code has been reviewed
- [ ] User acceptance testing is complete (if applicable)

## 🛡️ Security

### Security Review
- [ ] No API keys or secrets in code
- [ ] Environment variables are used for sensitive data
- [ ] CORS is properly configured
- [ ] Authentication is working
- [ ] Authorization is enforced
- [ ] Input validation is in place
- [ ] SQL injection prevention (if applicable)
- [ ] XSS prevention measures in place

### Security Headers (vercel.json)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Referrer-Policy` is set
- [ ] `Content-Security-Policy` is configured
- [ ] `Strict-Transport-Security` is set

## 📊 Performance

### Build Performance
- [ ] Build time is acceptable (< 2 minutes)
- [ ] Bundle size is optimized
- [ ] Code splitting is working
- [ ] Tree shaking is enabled

### Runtime Performance
- [ ] Initial page load is fast (< 3 seconds)
- [ ] No memory leaks detected
- [ ] API endpoints respond quickly
- [ ] Images are optimized

## 🔧 Monitoring & Rollback

### Monitoring Setup
- [ ] Error tracking is configured (if applicable)
- [ ] Analytics are working (if applicable)
- [ ] Logging is in place for debugging

### Rollback Plan
- [ ] Know how to rollback in Vercel dashboard
- [ ] Have backup of working version
- [ ] Team is aware of deployment

## ✅ Final Verification

### Pre-Deployment Command
```bash
# Run this comprehensive check:
npm run ci:validate
```

- [ ] All checks pass without errors
- [ ] Ready to deploy

### Deployment Trigger
For Preview (Pull Request):
- [ ] Push to feature branch
- [ ] Create PR to main/master
- [ ] GitHub Actions will deploy automatically

For Production (Master):
- [ ] Merge PR to master
- [ ] GitHub Actions will deploy automatically
- [ ] Monitor deployment in Vercel dashboard

## 🚨 Emergency Contacts

If deployment fails:
1. Check GitHub Actions logs
2. Check Vercel deployment logs
3. Consult `docs/CI-CD-TROUBLESHOOTING.md`
4. Rollback if necessary (Vercel dashboard → Deployments → Promote previous version)

## 📞 Support Resources

- [GitHub Actions Logs](https://github.com/Michiganman2353/esta-tracker-clean/actions)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [CI/CD Troubleshooting Guide](./CI-CD-TROUBLESHOOTING.md)
- [GitHub Secrets Setup Guide](./GITHUB-SECRETS-SETUP.md)

---

**✅ Once all items are checked, you're ready to deploy!**
