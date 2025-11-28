# Vercel Configuration Directory

> **For complete deployment instructions, see [Vercel Deployment Guide](../docs/deployment/deployment.md)**

This directory contains the Vercel project configuration template for deploy context integrity.

## Swiss Watch 2025: Immutable Infrastructure Contract

As part of the Production-Grade Architecture Overhaul, this directory now contains:

### `project.json` (Template)

The `project.json` file is committed to version control as an **immutable infrastructure contract**. This ensures:

- Deploy context integrity across all environments
- Consistent Node.js version configuration
- Reproducible and auditable deployment settings

**Important**: The template file does not contain `orgId` or `projectId` values. These must be:

1. **For CI/CD**: Configured via `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` GitHub Secrets
2. **For local development**: Obtained by running `vercel link` (this will create/update `.vercel/project.json` locally with your credentials)

The `.gitignore` is configured to preserve only the template structure (`project.json` and this `README.md`) while ignoring any locally-generated credentials.

## Required GitHub Secrets

For CI/CD deployments, configure these secrets in your GitHub repository:

| Secret             | Description                | How to Obtain                                              |
| ------------------ | -------------------------- | ---------------------------------------------------------- |
| `VERCEL_TOKEN`     | API authentication token   | [Vercel Account Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID`    | Organization/team ID       | Run `vercel link` → check `.vercel/project.json`           |
| `VERCEL_PROJECT_ID`| Project ID                 | Run `vercel link` → check `.vercel/project.json`           |

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

After linking, a local `.vercel/project.json` file will be created with your credentials:

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

**Note**: Your local `project.json` with actual credentials is gitignored. Only the template is committed.

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

### Token Format Issues

The CI/CD workflows include automatic token sanitization to handle common formatting issues (newlines, spaces, etc.). If you still encounter token errors:

1. Generate a new token in Vercel Dashboard
2. Copy it carefully without extra whitespace
3. Update the `VERCEL_TOKEN` secret in GitHub

## Security Notes

- The `.vercel/` directory template is committed, but local credentials are gitignored
- Never share `VERCEL_TOKEN` via insecure channels
- Treat `orgId` and `projectId` as semi-sensitive (they identify your project but can't authorize actions)
- Rotate Vercel tokens periodically (recommended: every 6-12 months)
- CI/CD workflows automatically mask and sanitize tokens for security

## For More Information

- **[Complete Deployment Guide](../docs/deployment/deployment.md)** - Comprehensive setup and deployment instructions
- **[Vercel Token Setup](../docs/deployment/VERCEL_TOKEN_SETUP.md)** - Detailed token configuration and troubleshooting
- **[GitHub Secrets Setup](../docs/GITHUB-SECRETS-SETUP.md)** - Step-by-step secrets configuration
