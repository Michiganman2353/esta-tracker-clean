# 🚀 Deployment Readiness Checklist

Use this checklist to verify the build system is ready for Vercel deployment.

## ✅ Build System Validation

Run these commands to verify everything works:

### 1. Clean Build Test
```bash
npm run clean
npm ci
npm run build
```
**Expected**: All packages build successfully with no errors

### 2. Linting Check
```bash
npm run lint
```
**Expected**: 0 errors, 0 warnings

### 3. Type Checking
```bash
npm run typecheck
```
**Expected**: 0 TypeScript errors

### 4. Test Suite
```bash
npm run test
```
**Expected**: 272 tests passing

### 5. Complete CI Validation
```bash
npm run ci:validate
```
**Expected**: All checks pass, build outputs verified

---

## �� Vercel Configuration Checklist

### Environment Variables (Required)

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Set these for **ALL environments** (Production, Preview, Development):

#### Frontend (Public)
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_FIREBASE_MEASUREMENT_ID` (optional)

#### Backend (Secret)
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_SERVICE_ACCOUNT` (JSON string)

#### Optional (but Recommended)
- [ ] `EDGE_CONFIG` (for feature flags)
- [ ] `ALLOWED_ORIGIN` (production domain)
- [ ] GCP/KMS variables (if using encryption)

### Build Settings

Verify these in Vercel Dashboard:

- [ ] Framework Preset: **Other**
- [ ] Build Command: `npx turbo run build --filter=@esta-tracker/frontend`
- [ ] Output Directory: `packages/frontend/dist`
- [ ] Install Command: `npm ci`
- [ ] Root Directory: `.` (repository root)
- [ ] Node.js Version: Auto (will use 20.x from package.json)

---

## 🔍 Pre-Deployment Verification

### Local Build Simulation
```bash
# Simulate Vercel build locally
npm ci
npx turbo run build --filter=@esta-tracker/frontend

# Verify output
ls -la packages/frontend/dist/
```

### Expected Output Files
- [ ] `dist/index.html` exists
- [ ] `dist/assets/*.js` exist (at least 2-3 bundles)
- [ ] `dist/assets/*.css` exists
- [ ] `dist/icon.svg` exists
- [ ] `dist/manifest.json` exists

### Configuration Files
- [ ] `vercel.json` exists in repository root
- [ ] `turbo.json` exists in repository root
- [ ] `package.json` has correct engines field
- [ ] `.nvmrc` specifies Node 20.x

---

## 🐛 Common Issues to Check

### Issue: Build fails with "Cannot find module"
- [ ] Verify `Root Directory` is set to `.` (repository root)
- [ ] Check `installCommand` is `npm ci`
- [ ] Ensure `package-lock.json` is committed

### Issue: Firebase errors in production
- [ ] All `VITE_FIREBASE_*` variables set in Vercel
- [ ] Variables set for correct environment
- [ ] No typos in variable names

### Issue: API routes return 404
- [ ] `api/` directory exists in repository root
- [ ] `vercel.json` has function configuration
- [ ] API files are `.ts` and properly exported

### Issue: App routes return 404
- [ ] `vercel.json` has SPA rewrite rule
- [ ] Rewrite rule: `{ "source": "/(.*)", "destination": "/index.html" }`

---

## ✅ Deployment Steps

### Step 1: GitHub Integration Setup
1. [ ] Go to Vercel Dashboard → Add New → Project
2. [ ] Import GitHub repository `Michiganman2353/esta-tracker-clean`
3. [ ] Configure environment variables (see checklist above)
4. [ ] Verify build settings
5. [ ] Click **Deploy**

### Step 2: Initial Deployment
1. [ ] Monitor build logs for errors
2. [ ] Verify build completes successfully
3. [ ] Check deployment URL works
4. [ ] Test homepage loads

### Step 3: Functional Testing
Test these on the deployed URL:
- [ ] Homepage loads correctly
- [ ] Login page accessible
- [ ] Registration page accessible
- [ ] Firebase initializes (no console errors)
- [ ] API routes work (test `/api/hello`)
- [ ] Navigation works (no 404s)
- [ ] Static assets load (CSS, JS, icons)

---

## 📊 Success Criteria

Your deployment is successful when:

1. [ ] ✅ Build completes without errors
2. [ ] ✅ All tests pass in CI/CD
3. [ ] ✅ Homepage loads correctly
4. [ ] ✅ Firebase initializes (no console errors)
5. [ ] ✅ Login/registration flows work
6. [ ] ✅ API routes respond correctly
7. [ ] ✅ All environment variables set
8. [ ] ✅ Security headers present
9. [ ] ✅ No CSP violations
10. [ ] ✅ Performance metrics acceptable

---

## 🆘 If Something Goes Wrong

### 1. Check Build Logs
- Go to Vercel Dashboard → Deployments → [Your Deployment]
- Look for specific error messages
- Search for "Error:" or "Failed:"

### 2. Verify Environment Variables
- Go to Settings → Environment Variables
- Ensure all required vars are set
- Check for typos in variable names

### 3. Test Locally
```bash
# Run same build command as Vercel
npm ci
npx turbo run build --filter=@esta-tracker/frontend
```

### 4. Check Documentation
- `BUILD_SYSTEM_FIXES.md` - Technical details
- `VERCEL_DEPLOYMENT_GUIDE.md` - Deployment guide
- `DEPLOYMENT_TROUBLESHOOTING.md` - Common issues

---

## 📞 Quick Reference

### Validation Commands
```bash
npm run lint              # Check code quality
npm run typecheck         # Check TypeScript
npm run test              # Run all tests
npm run build             # Build all packages
npm run ci:validate       # Complete validation
```

### Build Commands
```bash
# Clean everything
npm run clean

# Install dependencies
npm ci

# Build frontend only
npm run build:frontend

# Build all packages
npm run build
```

### Debugging Commands
```bash
# Check Node version
node --version    # Should be v20.x

# Check npm version
npm --version     # Should be 10.x

# Validate deployment requirements
npm run validate:deployment
```

---

## ✨ Final Checklist

Before clicking "Deploy" in Vercel:

- [ ] All validation commands pass locally
- [ ] Environment variables documented and ready
- [ ] Build settings configured correctly
- [ ] Repository is up to date
- [ ] Team members notified
- [ ] Monitoring/alerting ready (optional)

**If all checkboxes are checked**: You're ready to deploy! 🚀

---

**Last Updated**: 2024-11-21
**Status**: ✅ ALL SYSTEMS GO
