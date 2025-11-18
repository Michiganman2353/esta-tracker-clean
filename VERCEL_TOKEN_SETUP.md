# Vercel Secrets Configuration Guide

This document explains how to properly configure Vercel secrets for the ESTA Tracker project, including the authentication token, organization ID, and project ID.

## Required Secrets

The following secrets are required for Vercel deployment and CI/CD:

### 1. VERCEL_TOKEN
- **Purpose**: Authentication token for Vercel CLI and API access
- **Where to get it**: [Vercel Account Tokens](https://vercel.com/account/tokens)
- **Required for**: CLI deployments, GitHub Actions, CI/CD

### 2. VERCEL_ORG_ID
- **Purpose**: Identifies your Vercel organization/team
- **Where to get it**: Run `vercel link` and check `.vercel/project.json`
- **Required for**: GitHub Actions deployments

### 3. VERCEL_PROJECT_ID
- **Purpose**: Identifies your specific Vercel project
- **Where to get it**: Run `vercel link` and check `.vercel/project.json`
- **Required for**: GitHub Actions deployments

## Where These Secrets Are Used

### 1. GitHub Repository Secrets
**Status**: ✅ Configured by repository owner
**Location**: Repository Settings → Secrets and variables → Actions
**Purpose**: Used by GitHub Actions CI/CD workflow

The following secrets should be added to GitHub:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

These are already referenced in `.github/workflows/ci.yml`:
```yaml
vercel-token: ${{ secrets.VERCEL_TOKEN }}
vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 2. `.env.example` (Documentation)
**Status**: ✅ Contains placeholders and instructions
**Location**: `/esta-tracker-clean/.env.example`
**Purpose**: Template for developers to know what variables are needed
**Git Status**: Tracked (committed, safe)

Contains placeholders with detailed instructions:
- `VERCEL_TOKEN=your-vercel-token-here`
- `VERCEL_ORG_ID=your-vercel-org-id`
- `VERCEL_PROJECT_ID=your-vercel-project-id`

### 3. Local `.env.local` (For Development)
**Status**: ⚠️ Must be created by each developer
**Location**: `/esta-tracker-clean/.env.local`
**Purpose**: Local development and Vercel CLI deployments
**Git Status**: ✅ Gitignored (will never be committed)

Developers should create this file locally and add:
```env
VERCEL_TOKEN=your-actual-token-here
VERCEL_ORG_ID=your-actual-org-id
VERCEL_PROJECT_ID=your-actual-project-id
```

## How to Obtain Vercel Organization and Project IDs

### Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Have a Vercel account with access to the project

### Step-by-Step Instructions

#### 1. Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate.

#### 2. Link Your Project
```bash
cd /path/to/esta-tracker-clean
vercel link
```

You'll be prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your team/account
- **Link to existing project?** → Yes (if exists) or No (to create)
- **What's your project's name?** → esta-tracker-clean

#### 3. Extract the IDs
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

#### 4. Add to GitHub Secrets
Go to your repository and add these values:

1. Navigate to: `https://github.com/Michiganman2353/esta-tracker-clean/settings/secrets/actions`
2. Click "New repository secret" for each:
   - Name: `VERCEL_ORG_ID`, Value: the orgId from project.json
   - Name: `VERCEL_PROJECT_ID`, Value: the projectId from project.json
   - Name: `VERCEL_TOKEN`, Value: your Vercel authentication token

## Vercel Configuration Files

### `.vercel/` Directory
**Status**: ✅ Created with README
**Location**: `/esta-tracker-clean/.vercel/`
**Purpose**: Contains local Vercel configuration after running `vercel link`
**Git Status**: ✅ Gitignored (contains sensitive data)

See `.vercel/README.md` for detailed information about:
- What files are created by `vercel link`
- How to extract organization and project IDs
- Troubleshooting common issues

### `vercel.json`
**Status**: ✅ Already properly configured
**Location**: `/esta-tracker-clean/vercel.json`
**Purpose**: Vercel deployment configuration
**Git Status**: Tracked (contains no secrets)

This file configures build settings, security headers, and routing.

## Security Best Practices

### ✅ What's Properly Secured:

1. **GitHub Secrets** (Encrypted storage)
   - VERCEL_TOKEN stored in repository secrets
   - VERCEL_ORG_ID stored in repository secrets
   - VERCEL_PROJECT_ID stored in repository secrets
   - Only accessible to GitHub Actions workflows
   - Never visible in logs or to contributors

2. **Local Development** (Gitignored files)
   - Actual values go in `.env.local`
   - This file is in `.gitignore`
   - Never committed to repository
   - Each developer creates their own copy

3. **Documentation** (Safe placeholders)
   - `.env.example` has placeholder values only
   - No actual secrets in committed code
   - Safe to share publicly

4. **CI/CD Workflow** (Secure references)
   - `.github/workflows/ci.yml` uses `${{ secrets.* }}` syntax
   - No hardcoded values in workflow files
   - Secrets injected at runtime by GitHub

### ⚠️ Important Security Notes:

- **Never commit** actual token values to git
- **Never share** tokens in public issues or PRs
- **Rotate tokens** immediately if compromised
- **Use separate tokens** for different environments when possible
- **Review GitHub Actions logs** to ensure secrets aren't exposed

## Verification Checklist

After configuring all secrets, verify:

### For GitHub Actions (CI/CD)
- [ ] `VERCEL_TOKEN` added to GitHub repository secrets
- [ ] `VERCEL_ORG_ID` added to GitHub repository secrets
- [ ] `VERCEL_PROJECT_ID` added to GitHub repository secrets
- [ ] Create a test pull request
- [ ] Check "Deploy Preview" job in Actions tab
- [ ] Verify deployment succeeds without errors

### For Local Development
- [ ] Created `.env.local` file (gitignored)
- [ ] Added `VERCEL_TOKEN` to `.env.local`
- [ ] Added `VERCEL_ORG_ID` to `.env.local`
- [ ] Added `VERCEL_PROJECT_ID` to `.env.local`
- [ ] Run `vercel whoami` to verify authentication
- [ ] Run `vercel ls` to list projects
- [ ] Test deployment with `vercel` command

## Usage Instructions

### For Local Vercel CLI Deployments

Once secrets are in `.env.local`:

```bash
# Deploy to preview environment
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

### For GitHub Actions Deployments

When you create or update a pull request:
1. GitHub Actions automatically runs
2. The "Deploy Preview" job triggers
3. Uses secrets from repository settings
4. Deploys a preview to Vercel
5. Comments on PR with deployment URL

## Troubleshooting

### "Vercel token is invalid"
- Verify token is correctly copied from Vercel dashboard
- Check for extra spaces or newlines
- Generate a new token if needed

### "Project not found"
- Ensure you've run `vercel link` locally
- Verify ORG_ID and PROJECT_ID are correct
- Check that project exists in Vercel dashboard

### "Permission denied"
- Verify your Vercel account has access to the project
- Check that token has appropriate permissions
- Ensure you're using the correct organization ID

### GitHub Actions deployment fails
- Check that all three secrets are added to GitHub
- Verify secret names match exactly (case-sensitive)
- Review GitHub Actions logs for specific errors

## Token Rotation

If you need to rotate the Vercel token:

1. **Generate new token**: Visit [Vercel Account Tokens](https://vercel.com/account/tokens)
2. **Update GitHub Secrets**: 
   - Go to repository Settings → Secrets and variables → Actions
   - Edit `VERCEL_TOKEN` with new value
3. **Update local `.env.local`**: Replace old token
4. **Notify team members**: Share new token securely
5. **Revoke old token**: In Vercel account settings
6. **Test deployments**: Verify both local and CI/CD work

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Environment Variables Best Practices](https://vercel.com/docs/concepts/projects/environment-variables)

## Summary

✅ **GitHub Secrets**: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID configured in repository settings  
✅ **Documentation**: `.env.example` contains placeholders and instructions  
✅ **CI/CD Workflow**: `.github/workflows/ci.yml` properly references secrets  
✅ **Local Setup**: Instructions provided for creating `.env.local`  
✅ **Security**: No secrets committed to repository  
✅ **Verification**: `.vercel/README.md` provides detailed setup guide  

## Next Steps

1. **If not done yet**: Add the three secrets to GitHub repository settings
2. **Run `vercel link`**: To generate `.vercel/project.json` and obtain IDs
3. **Update GitHub Secrets**: Add ORG_ID and PROJECT_ID from project.json
4. **Test deployment**: Create a test PR to verify CI/CD works
5. **Share instructions**: Team members can follow this guide for local setup
