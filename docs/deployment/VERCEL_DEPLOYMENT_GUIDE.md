# Vercel Deployment Guide - ESTA Tracker

## 🚀 Quick Deployment Checklist

Follow these steps to deploy ESTA Tracker to Vercel:

### 1. Environment Variables Setup

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### Required for ALL Environments (Production, Preview, Development):

##### Frontend Variables (Public - Exposed to Browser)
```
VITE_FIREBASE_API_KEY=AIzaSyCWoqaXUc6ChNLQDBofkml_FgQsCmvAd-g
VITE_FIREBASE_AUTH_DOMAIN=esta-tracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=esta-tracker
VITE_FIREBASE_STORAGE_BUCKET=esta-tracker.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=718800554935
VITE_FIREBASE_APP_ID=1:718800554935:web:44e0da9f10c748848af632
VITE_FIREBASE_MEASUREMENT_ID=G-MRE9DR9ZPF
```

##### Backend Variables (Secret - Server-side Only)
```
FIREBASE_PROJECT_ID=esta-tracker
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"esta-tracker",...}
```
**Note**: For `FIREBASE_SERVICE_ACCOUNT`, paste the entire service account JSON as a single line string.

##### Optional Variables
```
VITE_API_URL=/api
EDGE_CONFIG=https://edge-config.vercel.com/your-edge-config-id?token=your-token
ALLOWED_ORIGIN=https://estatracker.com
```

##### GCP/KMS Variables (if using encryption)
```
GCP_PROJECT_ID=esta-tracker
KMS_KEYRING_NAME=esta-tracker-keyring
KMS_LOCATION=us-central1
KMS_ENCRYPTION_KEY_NAME=esta-encryption-key
KMS_KEY_VERSION=1
```

---

### 2. Build Settings

#### Project Settings
- **Framework Preset**: Other
- **Build Command**: `npx turbo run build --filter=@esta-tracker/frontend`
- **Output Directory**: `packages/frontend/dist`
- **Install Command**: `npm ci`

#### Root Directory
- **Root Directory**: `.` (repository root)
- Do NOT set this to `packages/frontend` - Turborepo needs access to the entire monorepo

#### Node.js Version
- Vercel will automatically use Node.js 20.x based on `package.json` engines field
- No manual configuration needed

---

### 3. Deployment Configuration

The repository includes a pre-configured `vercel.json` that handles:

✅ Build command for monorepo structure
✅ Output directory location
✅ API serverless functions
✅ SPA routing (all routes → index.html)
✅ Security headers (CSP, HSTS, etc.)
✅ CORS configuration

**You don't need to modify vercel.json** unless you're changing deployment behavior.

---

### 4. Deploy

#### Option A: GitHub Integration (Recommended)

1. Go to **Vercel Dashboard → Add New → Project**
2. Import your GitHub repository `Michiganman2353/esta-tracker-clean`
3. Select the repository
4. Configure environment variables (see Step 1)
5. Click **Deploy**

Vercel will:
- ✅ Automatically deploy on every push to `main`/`master`
- ✅ Create preview deployments for pull requests
- ✅ Run build with the configured settings

#### Option B: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link to project (first time only)
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod
```

---

## 🔍 Verifying Deployment

### Check Build Logs

After deployment, verify:

1. **Build succeeded**: Check Vercel deployment logs
2. **No missing env var warnings**: Look for `⚠️ Warning: Missing environment variables`
3. **Assets generated**: Confirm `dist/` directory contains all files
4. **No 404 errors**: Test navigation to various routes

### Test Checklist

After deployment, test these key features:

- [ ] Homepage loads correctly
- [ ] Login page accessible
- [ ] Registration page accessible
- [ ] Firebase authentication initializes (check browser console)
- [ ] API routes work (test `/api/hello`)
- [ ] All routes work (no 404s due to SPA routing)
- [ ] Static assets load (CSS, JS, icons)

---

## 🐛 Troubleshooting

### Build Fails with "Cannot find module"

**Cause**: Turborepo can't find dependencies

**Solution**:
1. Verify `Root Directory` is set to `.` (repository root)
2. Ensure `Install Command` is `npm ci`
3. Check `package-lock.json` is committed

### Build Succeeds but Firebase Errors in Production

**Cause**: Missing Firebase environment variables

**Solution**:
1. Check all `VITE_FIREBASE_*` variables are set in Vercel Dashboard
2. Ensure variables are set for the correct environment (Production/Preview)
3. Redeploy after adding variables

### API Routes Return 404

**Cause**: API directory not found or misconfigured

**Solution**:
1. Verify `api/` directory exists in repository root
2. Check `vercel.json` has correct function configuration
3. Ensure API files are TypeScript (`.ts`) and exported correctly

### SPA Routes Return 404 (e.g., /dashboard)

**Cause**: Vercel not redirecting all routes to index.html

**Solution**:
1. Check `vercel.json` has this rewrite rule:
   ```json
   { "source": "/(.*)", "destination": "/index.html" }
   ```
2. Ensure this rule comes AFTER API route rewrites

### CSS Not Loading / Broken Styles

**Cause**: Incorrect asset paths or CSP blocking resources

**Solution**:
1. Check `Content-Security-Policy` header in `vercel.json`
2. Verify `style-src` includes `'self'` and `'unsafe-inline'`
3. Check browser console for CSP violations

### "node-domexception" Deprecation Warning

**Cause**: Transitive dependency from Google Cloud SDK

**Solution**:
- This is a **known non-blocking issue**
- Warning does NOT affect build or runtime
- Safe to ignore (see `BUILD_SYSTEM_FIXES.md` for details)

---

## 📊 Performance Optimization

### Enable Caching

Turborepo remote caching is enabled by default. To link to Vercel's remote cache:

1. Run `npx turbo login` locally
2. Run `npx turbo link` to connect to your Vercel project
3. Add `TURBO_TOKEN` and `TURBO_TEAM` to GitHub Secrets (for CI/CD)

### Monitor Bundle Size

Current bundle sizes:
- Main bundle: ~736 KB (166 KB gzipped)
- React vendor: ~164 KB (54 KB gzipped)
- CSS: ~58 KB (8 KB gzipped)

Monitor for increases and consider:
- Code splitting for large features
- Lazy loading routes
- Tree-shaking unused exports

---

## 🔒 Security Checklist

Before going to production:

- [ ] All sensitive env vars marked as "Secret" in Vercel
- [ ] `FIREBASE_SERVICE_ACCOUNT` is secret (not exposed to browser)
- [ ] CSP headers configured correctly
- [ ] HSTS header enabled (`Strict-Transport-Security`)
- [ ] No API keys or secrets committed to repository
- [ ] Firebase rules restrict unauthorized access
- [ ] CORS configured for production domain only

---

## 📞 Support Resources

### Official Documentation
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Turborepo Deployment with Vercel](https://turbo.build/repo/docs/handbook/deploying-with-vercel)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

### Project-Specific Docs
- `BUILD_SYSTEM_FIXES.md` - Build configuration details
- `DEPLOYMENT_TROUBLESHOOTING.md` - Common issues and fixes
- `.env.example` - All available environment variables

### Quick Commands

```bash
# Test build locally (simulates Vercel)
npm ci
npx turbo run build --filter=@esta-tracker/frontend

# Validate deployment requirements
npm run validate:deployment

# Run full CI validation
npm run ci:validate
```

---

## ✅ Deployment Success Criteria

Your deployment is successful when:

1. ✅ Build completes without errors
2. ✅ All tests pass in CI/CD
3. ✅ Homepage loads correctly
4. ✅ Firebase initializes (no console errors)
5. ✅ Login/registration flows work
6. ✅ API routes respond correctly
7. ✅ All environment variables set
8. ✅ Security headers present
9. ✅ No CSP violations
10. ✅ Performance metrics acceptable

---

## 🎯 Next Steps After Deployment

1. **Set up custom domain** (if not using vercel.app)
2. **Configure Edge Config** for feature flags
3. **Enable Web Analytics** in Vercel Dashboard
4. **Set up monitoring** (Sentry, LogRocket, etc.)
5. **Configure Firebase Auth** email templates
6. **Test with real users** in staging environment
7. **Set up CI/CD** for automated deployments
8. **Enable Vercel Speed Insights**

---

## 📝 Changelog

### 2024-11-21 - Initial Deployment Configuration
- Configured turbo.json with explicit environment variables
- Enhanced vite.config.ts with env validation
- Optimized vercel.json for monorepo structure
- Documented all deployment requirements
- Validated full build pipeline

---

**Need help?** Check `BUILD_SYSTEM_FIXES.md` for detailed technical information or open an issue in the repository.
