# Vercel Configuration Directory

> **For complete deployment instructions, see [Vercel Deployment Guide](../docs/deployment/deployment.md)**

This directory contains the Vercel project configuration for deploy context integrity.

## Swiss Watch 2025: Immutable Infrastructure Contract

As part of the Production-Grade Architecture Overhaul, this directory now contains:

### `project.json` (Template)

The `project.json` file is committed to version control as an **immutable infrastructure contract**. This ensures:

- Deploy context integrity across all environments
- No reliance on environment secrets for project binding
- Reproducible and auditable deployment configuration

**Note**: The template file does not contain actual credentials. Actual `orgId` and `projectId` should be:
1. Configured via `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` environment variables in CI/CD
2. Or obtained by running `vercel link` locally (this will update the project.json)

## What's in this directory?

### `project.json`

Contains your Vercel project configuration template:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "settings": {
    "nodeVersion": "22.x"
  },
  "readme": {
    "note": "Configure via environment variables or vercel link"
  }
}
```

**These values are needed for:**
- GitHub Actions CI/CD deployments
- Vercel CLI deployments
- Project-specific configuration

## Quick Setup Guide

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate with your Vercel account.

### Step 3: Link the project

```bash
cd /path/to/ESTA-Logic
vercel link
```

You'll be asked:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your team/account
3. **Link to existing project?** → Yes (if project exists) or No (to create new)
4. **Project name** → Select or enter `esta-logic`

### Step 4: Extract the IDs

```bash
cat .vercel/project.json
```

Example output:
```json
{
  "orgId": "team_1234567890abcdef",
  "projectId": "prj_abcdef1234567890"
}
```

### Step 5: Add to GitHub Secrets

Go to your repository settings and add these as secrets:

1. **Repository Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret:
   - Name: `VERCEL_ORG_ID`, Value: `team_1234567890abcdef`
   - Name: `VERCEL_PROJECT_ID`, Value: `prj_abcdef1234567890`
   - Name: `VERCEL_TOKEN`, Value: Your Vercel API token from [Account Tokens](https://vercel.com/account/tokens)

## Verification

After linking, you can verify the connection:

```bash
# Check current project
vercel whoami

# List projects
vercel ls

# Deploy to preview
vercel
```

## Troubleshooting

### "No existing credentials found"

Run `vercel login` to authenticate.

### "Project not found"

Make sure you've created the project in Vercel Dashboard first, or let `vercel link` create it for you.

### ".vercel directory not created"

Ensure you ran `vercel link` in the project root directory and completed all prompts.

## Security Notes

- Never commit `.vercel/` directory to git (already in `.gitignore`)
- Never share `project.json` publicly
- Treat orgId and projectId as sensitive (though less critical than tokens)
- Rotate Vercel tokens if compromised

## For More Information

- **[Complete Deployment Guide](../docs/deployment/deployment.md)** - Comprehensive setup and deployment instructions
- **[Vercel Token Setup](../docs/deployment/VERCEL_TOKEN_SETUP.md)** - Detailed token configuration and troubleshooting
- **[Quick Start](../docs/setup/VERCEL_QUICK_START.md)** - Quick reference for setup
