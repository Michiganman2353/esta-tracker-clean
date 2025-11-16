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
│   └── backend/           # Express API (not deployed - for local dev)
├── api/                   # Vercel Serverless Functions
│   └── hello.js          # Example API route at /api/hello
├── vercel.json           # Vercel configuration
├── package.json          # Root package with build scripts
└── .env.example          # Environment variable template
```

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

The project includes a `vercel.json` with:

- ✅ **Security headers** (CSP, X-Frame-Options, HSTS)
- ✅ **Cache control** for static assets
- ✅ **SPA routing** (all routes → index.html)
- ✅ **API rewrites** (/api/* → serverless functions)
- ✅ **Service worker** support

## Environment Variables

### Required Environment Variables

Configure these in the **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

#### Production Environment

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Auto-set by vercel.json |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | Required for API routes |
| `FIREBASE_SERVICE_ACCOUNT` | JSON service account | Entire Firebase service account JSON |
| `ALLOWED_ORIGIN` | `https://your-domain.com` | CORS configuration for API |
| `VITE_API_URL` | `/api` or full API URL | Frontend API endpoint |

#### Development/Preview Environment

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `development` | For preview deployments |
| `VITE_API_URL` | `/api` | Use relative path for preview |

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
5. Serverless functions: Deployed from `api/` directory

## Verifying Deployment

### Check Deployment Status

1. **Build Logs**: Vercel Dashboard → Deployments → [Your deployment] → View Build Logs
2. **Function Logs**: Vercel Dashboard → Functions → Select function → View logs

### Test Endpoints

After deployment:

```bash
# Test frontend
curl https://your-deployment.vercel.app

# Test API route
curl https://your-deployment.vercel.app/api/hello

# Test with authentication (if configured)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-deployment.vercel.app/api/hello
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

### Issue 3: API Routes Return 404

**Cause**: Incorrect API route setup or rewrites not working

**Solution**:
- Check `vercel.json` rewrites configuration
- Ensure API files are in `api/` directory at root
- API files must export default handler function

### Issue 4: Firebase Admin Initialization Fails

**Cause**: Invalid service account JSON or missing project ID

**Solution**:
```bash
# Validate JSON format
echo $FIREBASE_SERVICE_ACCOUNT | jq .

# Check required fields
- type: "service_account"
- project_id: "your-project"
- private_key: "-----BEGIN PRIVATE KEY-----..."
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

### 1. Enable Edge Runtime (Optional)

For faster API responses, use Edge Runtime:

```javascript
// In api/hello.js
export const config = {
  runtime: 'edge', // Change from nodejs
};
```

### 2. Configure Caching

Caching is already configured in `vercel.json`:

- **Static assets**: 1 year cache
- **Service worker**: No cache (must-revalidate)
- **HTML**: Handled by SPA routing

### 3. Image Optimization

If using images, leverage Vercel's automatic optimization:

```javascript
// In React components
<img src="/images/logo.png" alt="Logo" />
// Vercel automatically optimizes on-demand
```

## Monitoring & Debugging

### Enable Vercel Analytics

1. Dashboard → Project → Analytics
2. Add `@vercel/analytics` to frontend
3. Track Web Vitals and performance

### Check Function Logs

```bash
# Using Vercel CLI
vercel logs [deployment-url]

# Or in Dashboard
Project → Deployments → [Select] → Functions → Logs
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
4. **Update CORS**: Update `ALLOWED_ORIGIN` environment variable

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
✅ **Rate Limiting**: Implemented in API routes
✅ **CORS**: Configured per environment
✅ **Service Account**: Never committed to git
✅ **Dependencies**: Monitored via npm audit

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Firebase Admin Setup](https://firebase.google.com/docs/admin/setup)
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
