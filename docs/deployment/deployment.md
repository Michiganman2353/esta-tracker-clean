# Vercel Deployment Guide

## Overview

This guide covers deploying the ESTA Tracker application to Vercel. The project is a monorepo with a React frontend (Vite) and Node.js backend (Express), configured for Vercel's serverless platform.

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/docs/cli) (optional, for local testing)
- Node.js 20.x (see `.nvmrc`)
- npm ≥10.0.0

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

**⚠️ Important: JSON Syntax Rules**

The `vercel.json` file must be valid JSON. Keep in mind:

- **No comments allowed**: JSON does not support `//` or `/* */` comments. If you need to document configuration options, add them to this documentation file instead.
- **No trailing commas**: The last item in an object or array must not have a trailing comma.
- **Proper quoting**: All keys and string values must use double quotes (`"`), not single quotes.
- **Valid escaping**: Special characters in strings must be properly escaped (e.g., `\\`, `\"`, `\n`).

To validate your `vercel.json` changes locally:

```bash
# Quick validation using Node.js
node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf-8'))"

# Or use an online validator like jsonlint.com
```

The CI workflow includes a JSON validation step that will fail-fast if `vercel.json` contains syntax errors.

**Note**: API routes and service workers are not currently configured. Future updates may add serverless functions.

## Environment Variables

### Vercel Token Setup

For CLI deployments and CI/CD integration, you'll need a Vercel token:

1. **Generate Token**: Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
2. **Create New Token**: Click "Create" and give it a descriptive name (e.g., "ESTA Tracker Deployment")
3. **Copy Token**: Save it securely - you won't be able to see it again
4. **Configure Token**:
   - **For GitHub Actions**: Add to repository secrets as `VERCEL` (authentication token)
   - **For Local CLI**: Add to `.env.local` as `VERCEL_TOKEN=your-token-here` (for local Vercel CLI usage)
   - **Never commit**: The token should never be committed to git

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

### Issue 1: "Could not parse File as JSON: vercel.json"

**Cause**: The `vercel.json` file contains invalid JSON syntax, such as:
- JavaScript-style comments (`//` or `/* */`)
- Trailing commas after the last item in objects/arrays
- Unquoted keys or values
- Single quotes instead of double quotes

**Solution**:
```bash
# Validate the JSON syntax locally
node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf-8'))"

# If it fails, check for:
# - Remove any // or /* */ comments (JSON doesn't support comments)
# - Remove trailing commas
# - Use double quotes for all strings
# - Properly escape special characters
```

**Prevention**: The CI workflow now includes a JSON validation step that will catch this issue early.

### Issue 2: Build Fails with "Module not found"

**Cause**: Missing dependencies or incorrect workspace setup

**Solution**:
```bash
# Ensure all dependencies are in package.json
npm install
npm run build
```

### Issue 3: Environment Variables Not Working

**Cause**: Variables not set in Vercel Dashboard or incorrect naming

**Solution**:
- Verify variable names match exactly (case-sensitive)
- For Vite variables, must start with `VITE_`
- Redeploy after adding variables

### Issue 4: Firebase Connection Issues

**Cause**: Missing or incorrect Firebase environment variables

**Solution**:
- Verify all `VITE_FIREBASE_*` variables are set in Vercel Dashboard
- Check Firebase console for correct values
- Ensure variables are prefixed with `VITE_` for Vite access
- Redeploy after adding/updating variables

### Issue 5: Build Fails with TypeScript Errors

**Cause**: Type errors in TypeScript code

**Solution**:
```bash
# Run type checking locally
npm run typecheck

# Fix any errors, then rebuild
npm run build
```

### Issue 6: Security Vulnerabilities in Dependencies

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

## CI/CD with GitHub Actions

The project includes comprehensive `.github/workflows/ci.yml` for automated testing and deployment:

### Workflow Jobs

1. **Test & Build**: Runs on all pushes and PRs
   - Linting
   - Type checking
   - Unit tests
   - Build verification

2. **E2E Tests**: Runs Playwright tests after build passes

3. **Deploy Preview**: Automatic preview deployments for pull requests

4. **Deploy to Production**: Automatic production deployments when code is merged to `master` branch

### Required GitHub Secrets

For automated deployments to work, configure these secrets in your GitHub repository settings:

1. Navigate to: `Repository Settings > Secrets and variables > Actions`
2. Add the following secrets:

| Secret Name | Purpose | Where to Get It |
|------------|---------|-----------------|
| `VERCEL_TOKEN` | Vercel authentication token | [Vercel Account Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel organization ID | Run `vercel link` and check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Run `vercel link` and check `.vercel/project.json` |

#### How to Obtain Vercel Organization and Project IDs

**Prerequisites:**
- Install Vercel CLI: `npm install -g vercel`
- Have a Vercel account with access to the project

**Step-by-Step Instructions:**

1. **Login to Vercel**
   ```bash
   vercel login
   ```
   Follow the prompts to authenticate.

2. **Link Your Project**
   ```bash
   cd /path/to/esta-tracker-clean
   vercel link
   ```
   
   You'll be prompted:
   - **Set up and deploy?** → Yes
   - **Which scope?** → Select your team/account
   - **Link to existing project?** → Yes (if exists) or No (to create)
   - **What's your project's name?** → esta-tracker-clean

3. **Extract the IDs**
   After linking, a `.vercel/project.json` file is created:
   
   ```bash
   cat .vercel/project.json
   ```
   
   Example output:
   ```json
   {
     "orgId": "team_abc123xyz789",
     "projectId": "prj_def456uvw012"
   }
   ```

4. **Add to GitHub Secrets**
   Go to your repository and add these values:
   
   - Navigate to: `https://github.com/Michiganman2353/esta-tracker-clean/settings/secrets/actions`
   - Click "New repository secret" for each:
     - Name: `VERCEL_ORG_ID`, Value: the orgId from project.json
     - Name: `VERCEL_PROJECT_ID`, Value: the projectId from project.json
     - Name: `VERCEL_TOKEN`, Value: your Vercel authentication token

**Important Notes**: 
- The CI/CD workflow automatically sanitizes the `VERCEL_TOKEN` to remove any invalid characters (newlines, spaces, hyphens, periods, slashes) that might cause deployment failures.
- The `.vercel/` directory is gitignored and should never be committed
- For detailed token setup instructions and troubleshooting, see [VERCEL_TOKEN_SETUP.md](VERCEL_TOKEN_SETUP.md).

### Production Deployment Workflow

When code is pushed to the `master` branch:

1. Tests and build jobs run automatically
2. E2E tests verify functionality
3. If all checks pass, deployment to Vercel production is triggered
4. The workflow sanitizes the `VERCEL_TOKEN` to ensure it's in the correct format
5. The workflow uses `${{ secrets.VERCEL_TOKEN }}` to securely reference the authentication token
6. Deployment URL is available in the GitHub Actions logs

**Security Notes**:
- Secrets are never exposed in logs or code
- The workflow has minimal permissions (`contents: read`)
- Setup is not considered complete until verified working in CI/CD pipeline

### Manual Verification Steps

After configuring secrets, verify the setup:

- [ ] Push a commit to `master` branch (or merge a PR)
- [ ] Check the "Actions" tab in GitHub
- [ ] Verify "Deploy to Production" job completes successfully
- [ ] Confirm deployment in Vercel dashboard
- [ ] Test the production URL

For more details on secret configuration, see [VERCEL_TOKEN_SETUP.md](VERCEL_TOKEN_SETUP.md).

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
