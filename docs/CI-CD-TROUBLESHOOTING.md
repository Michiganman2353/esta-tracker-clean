# CI/CD Troubleshooting Guide

## Common GitHub Actions & Vercel Deployment Issues

### Issue 1: Invalid Vercel Token Error

**Error Message:**
```
Error! You defined "--token", but its contents are invalid. Must not contain: "\n", " ", "-", ".", "/"
```

**Cause:**
The `VERCEL_TOKEN` GitHub secret contains invalid characters or formatting issues.

**Solution:**

1. **Obtain a fresh Vercel token:**
   ```bash
   # Login to Vercel CLI
   vercel login
   
   # Generate a new token in Vercel Dashboard
   # Go to: https://vercel.com/account/tokens
   # Click "Create" and copy the token
   ```

2. **Update GitHub Secret:**
   - Go to: `https://github.com/Michiganman2353/esta-tracker-clean/settings/secrets/actions`
   - Delete the old `VERCEL_TOKEN` secret
   - Click "New repository secret"
   - Name: `VERCEL_TOKEN`
   - Value: Paste the token (ensure no extra spaces or newlines)
   - Click "Add secret"

3. **Verify the token format:**
   - Should be alphanumeric only
   - No spaces, hyphens, dots, or slashes
   - Typically starts with a letter
   - Length: ~24-32 characters

### Issue 2: Missing Vercel Organization or Project ID

**Error Message:**
```
Error: Missing required parameter VERCEL_ORG_ID
Error: Missing required parameter VERCEL_PROJECT_ID
```

**Solution:**

1. **Link your project locally:**
   ```bash
   cd /path/to/esta-tracker-clean
   vercel link
   ```

2. **Extract the IDs:**
   ```bash
   cat .vercel/project.json
   ```
   
   You'll see something like:
   ```json
   {
     "orgId": "team_xxxxxxxxxxxxxxxxxxxx",
     "projectId": "prj_xxxxxxxxxxxxxxxxxxxx"
   }
   ```

3. **Add to GitHub Secrets:**
   - `VERCEL_ORG_ID` → the `orgId` value
   - `VERCEL_PROJECT_ID` → the `projectId` value

### Issue 3: Build Output Directory Not Found

**Error Message:**
```
Error: Build output directory not found
```

**Cause:**
The build process failed or the output directory is misconfigured.

**Solution:**

1. **Verify local build works:**
   ```bash
   npm ci
   npm run build
   ls -la packages/frontend/dist
   ```

2. **Check vercel.json configuration:**
   ```json
   {
     "outputDirectory": "packages/frontend/dist"
   }
   ```

3. **Ensure turbo.json has correct outputs:**
   ```json
   {
     "tasks": {
       "build": {
         "outputs": ["dist/**", "build/**", ".next/**"]
       }
     }
   }
   ```

### Issue 4: Node Version Mismatch

**Error Message:**
```
Error: The engine "node" is incompatible with this module
```

**Solution:**

1. **Check required Node version in package.json:**
   ```json
   {
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

2. **Update GitHub Actions workflow:**
   ```yaml
   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       node-version: 20.x
   ```

3. **Update .nvmrc file:**
   ```
   20
   ```

### Issue 5: API Functions Not Deploying

**Cause:**
API routes in `/api` directory are not being recognized by Vercel.

**Solution:**

1. **Verify vercel.json functions configuration:**
   ```json
   {
     "functions": {
       "api/background/*.ts": {
         "maxDuration": 300,
         "memory": 1024
       },
       "api/secure/*.ts": {
         "maxDuration": 60,
         "memory": 512
       },
       "api/*.ts": {
         "maxDuration": 30,
         "memory": 512
       }
     }
   }
   ```

2. **Check API file structure:**
   ```
   api/
   ├── health.ts          ✅ Valid
   ├── secure/
   │   └── endpoint.ts    ✅ Valid
   └── background/
       └── job.ts         ✅ Valid
   ```

3. **Ensure TypeScript exports are correct:**
   ```typescript
   // api/health.ts
   import type { VercelRequest, VercelResponse } from '@vercel/node';
   
   export default function handler(req: VercelRequest, res: VercelResponse) {
     res.status(200).json({ status: 'ok' });
   }
   ```

### Issue 6: Environment Variables Not Available

**Cause:**
Environment variables are not properly configured in Vercel or GitHub Actions.

**Solution:**

1. **For Vercel:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all required variables (FIREBASE_*, VITE_*, etc.)
   - Set appropriate scopes (Production, Preview, Development)

2. **For GitHub Actions:**
   - Add secrets in GitHub repository settings
   - Reference them in workflow:
     ```yaml
     env:
       FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
     ```

### Issue 7: Turbo Cache Issues

**Symptoms:**
- Builds fail with "cache miss" repeatedly
- Inconsistent build results
- Missing dependencies

**Solution:**

1. **Clear Turbo cache:**
   ```bash
   rm -rf .turbo
   npm run build
   ```

2. **Verify turbo.json task dependencies:**
   ```json
   {
     "tasks": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["dist/**"]
       }
     }
   }
   ```

3. **Check workspace dependencies:**
   - Ensure all internal package dependencies are listed in package.json
   - Verify `^build` dependency chain is correct

### Issue 8: Deprecated Package Warnings

**Warnings:**
```
npm warn deprecated eslint@8.57.1: This version is no longer supported
npm warn deprecated inflight@1.0.6: This module is not supported
```

**Solution:**

1. **Update deprecated packages:**
   ```bash
   npm update eslint
   npm audit fix
   ```

2. **For major version updates:**
   ```bash
   npm install eslint@latest --save-dev
   ```

3. **Check for breaking changes:**
   - Review migration guides for each package
   - Update configuration files as needed

## Quick Validation Checklist

Before pushing changes, run:

```bash
# 1. Clean install
npm ci

# 2. Run linting
npm run lint

# 3. Run type checking
npm run typecheck

# 4. Run tests
npm run test

# 5. Build the project
npm run build

# 6. Validate deployment readiness
./scripts/validate-deployment.sh
```

## Getting Help

1. **Check GitHub Actions logs:**
   - Go to Actions tab in GitHub
   - Click on failed workflow run
   - Expand failed step to see detailed error

2. **Check Vercel deployment logs:**
   - Go to Vercel Dashboard
   - Click on your project
   - Navigate to Deployments
   - Click on failed deployment for logs

3. **Test locally:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login
   vercel login
   
   # Test deployment locally
   vercel dev
   ```

## Emergency Rollback

If a deployment fails in production:

1. **Via Vercel Dashboard:**
   - Go to Deployments
   - Find last working deployment
   - Click three dots → "Promote to Production"

2. **Via CLI:**
   ```bash
   vercel rollback [deployment-url]
   ```

## Contact

For persistent issues:
- Create a GitHub issue with logs attached
- Include output from `./scripts/validate-deployment.sh`
- Include relevant sections from GitHub Actions logs
