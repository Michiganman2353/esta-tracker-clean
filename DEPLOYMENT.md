# Vercel Deployment Guide

## Overview

This guide covers deploying the ESTA Tracker application to Vercel. The project is a monorepo with a React frontend (Vite) and Node.js backend (Express), configured for Vercel's serverless platform.

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/docs/cli) (optional, for local testing)
- Node.js ≥18.0.0
- npm ≥9.0.0

## Project Structure

```
esta-tracker-clean/
├── packages/
│   ├── frontend/          # React + Vite application (builds to dist/)
│   └── backend/           # Express API (for local dev and future deployment)
├── scripts/              # Utility scripts
├── vercel.json           # Vercel configuration
├── package.json          # Root package with build scripts
└── .env.example          # Environment variable template
```

**Note**: The current deployment configuration is frontend-only. The backend Express API in `packages/backend/` is set up for future deployment or local development.

## Deployment Configuration

### Build Settings in Vercel Dashboard

The `vercel.json` file configures these automatically, but verify in your project settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Other (or Vite) |
| **Build Command** | `npm install && npm run build:frontend` |
| **Output Directory** | `packages/frontend/dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 20.x (specified in .nvmrc) |

### vercel.json Configuration

The project uses a modern `vercel.json` configuration with:

- ✅ **Security headers** (CSP, X-Frame-Options, HSTS)
- ✅ **SPA routing** (rewrites all routes → index.html)
- ✅ **Build settings** explicitly defined
- ✅ **Output directory** pointing to `packages/frontend/dist`

The configuration uses the latest Vercel format without deprecated `builds` or `routes` properties.

**Note**: API routes and service workers are not currently configured. Future updates may add serverless functions.

## Environment Variables

### Required Environment Variables

Configure these in the **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

#### Production Environment

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Auto-set by vercel.json |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key | Required for Firebase Auth |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain | Required for Firebase Auth |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID | Required for Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket | Required for Firebase Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your messaging sender ID | Required for Firebase |
| `VITE_FIREBASE_APP_ID` | Your Firebase app ID | Required for Firebase |

**Note**: All frontend environment variables must be prefixed with `VITE_` to be accessible in the Vite build.

#### Development/Preview Environment

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `development` | For preview deployments |
| `VITE_FIREBASE_*` | Same as production | Use development Firebase project for testing |

### Setting Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with appropriate scope:
   - **Production**: Live deployment
   - **Preview**: Pull request previews
   - **Development**: Local development (optional)

### Firebase Service Account Setup

For `FIREBASE_SERVICE_ACCOUNT`:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Copy the **entire JSON content**
6. In Vercel, paste the JSON as the environment variable value

**⚠️ Security Note**: Never commit service account keys to git!

## Deployment Steps

### Option 1: Deploy via GitHub Integration (Recommended)

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **Add New** → **Project**
   - Import your GitHub repository
   - Vercel auto-detects `vercel.json` configuration

3. **Configure Environment Variables**
   - Add required environment variables (see above)
   - Deploy!

4. **Automatic Deployments**
   - Every push to `main` triggers production deployment
   - Pull requests get preview deployments

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Build Process

The build process defined in `vercel.json`:

```json
{
  "buildCommand": "npm install && npm run build:frontend",
  "outputDirectory": "packages/frontend/dist"
}
```

**What happens:**

1. `npm install` - Installs all dependencies (root + workspaces)
2. `npm run build:frontend` - Runs `npm run build --workspace=packages/frontend`
3. Frontend build: `tsc && vite build`
4. Output: Static files in `packages/frontend/dist`
5. Vercel serves these files with configured security headers and SPA routing

## Verifying Deployment

### Check Deployment Status

1. **Build Logs**: Vercel Dashboard → Deployments → [Your deployment] → View Build Logs

### Test Endpoints

After deployment:

```bash
# Test frontend
curl https://your-deployment.vercel.app

# Visit in browser to test the React app
open https://your-deployment.vercel.app
```

## Common Issues

### Issue 1: Build Fails with "Module not found"

**Cause**: Missing dependencies or incorrect workspace setup

**Solution**:
```bash
# Ensure all dependencies are in package.json
npm install
npm run build
```

### Issue 2: Environment Variables Not Working

**Cause**: Variables not set in Vercel Dashboard or incorrect naming

**Solution**:
- Verify variable names match exactly (case-sensitive)
- For Vite variables, must start with `VITE_`
- Redeploy after adding variables

### Issue 3: Firebase Connection Issues

**Cause**: Missing or incorrect Firebase environment variables

**Solution**:
- Verify all `VITE_FIREBASE_*` variables are set in Vercel Dashboard
- Check Firebase console for correct values
- Ensure variables are prefixed with `VITE_` for Vite access
- Redeploy after adding/updating variables

### Issue 4: Build Fails with TypeScript Errors

**Cause**: Type errors in TypeScript code

**Solution**:
```bash
# Run type checking locally
npm run typecheck

# Fix any errors, then rebuild
npm run build
```

### Issue 5: Security Vulnerabilities in Dependencies

**Current Status**: 5 moderate vulnerabilities in esbuild/vite (dev dependencies)

**Solution**:
```bash
# These are dev dependencies and don't affect production
# Monitor for updates:
npm audit

# Update when non-breaking versions available:
npm update vite vitest
```

**Note**: The vulnerabilities are in development tooling (esbuild in vite) and do not affect the production build output.

## Performance Optimization

### 1. Vite Build Optimizations

Vite automatically provides:
- Code splitting
- Tree shaking
- Minification
- Asset optimization

### 2. Image Optimization

If using images, leverage Vercel's automatic optimization:

```javascript
// In React components
<img src="/images/logo.png" alt="Logo" />
// Vercel automatically optimizes on-demand
```

### 3. Caching Strategy

Static assets are automatically cached by Vercel's CDN with optimal cache headers.

## Monitoring & Debugging

### Enable Vercel Analytics

1. Dashboard → Project → Analytics
2. Add `@vercel/analytics` to frontend package
3. Track Web Vitals and performance

### Check Deployment Logs

```bash
# Using Vercel CLI
vercel logs [deployment-url]

# Or in Dashboard
Project → Deployments → [Select] → Logs
```

## Rollback Deployments

If something goes wrong:

1. Dashboard → Deployments
2. Find previous working deployment
3. Click **•••** → **Promote to Production**

## Custom Domain Setup

1. **Add Domain**: Dashboard → Project → Settings → Domains
2. **Add DNS Records**: Follow Vercel instructions
3. **SSL**: Automatically provisioned
4. **Update Firebase**: Update authorized domains in Firebase Console

## CI/CD with GitHub Actions (Optional)

The project includes `.github/workflows` for additional CI checks before Vercel deployment:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## Security Considerations

✅ **CSP Headers**: Configured in vercel.json
✅ **HSTS**: Enforces HTTPS
✅ **Firebase Auth**: Client-side authentication
✅ **Environment Variables**: Secured in Vercel Dashboard
✅ **Dependencies**: Monitored via npm audit

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Project Repository](https://github.com/Michiganman2353/esta-tracker-clean)

## Quick Reference

```bash
# Local development
npm install
npm run dev

# Test build locally
npm run build
cd packages/frontend/dist && python3 -m http.server 8080

# Deploy to Vercel
vercel --prod

# Check deployment logs
vercel logs [url]

# List deployments
vercel ls
```

---

**Last Updated**: November 2024
**Vercel Configuration Version**: vercel.json v2
**Node.js Version**: 20.x (LTS)
**Architecture**: Frontend-only deployment (static site)
