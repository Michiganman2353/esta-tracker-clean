# Quick Start: Vercel Deployment Setup

> **Note:** This is a quick reference guide. For comprehensive instructions, see [Vercel Deployment Guide](../deployment/deployment.md).

## Prerequisites

- Node.js 20.x (see `.nvmrc`)
- npm ≥10.0.0
- [Vercel Account](https://vercel.com/signup)

## Quick Setup Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link Your Project
```bash
cd /path/to/esta-tracker-clean
vercel link
```

Follow the prompts to connect to your Vercel project.

### 4. Configure GitHub Secrets

Get your organization and project IDs:
```bash
cat .vercel/project.json
```

Add these three secrets to your GitHub repository:
1. `VERCEL_TOKEN` - Your Vercel authentication token from [Account Tokens](https://vercel.com/account/tokens)
2. `VERCEL_ORG_ID` - The `orgId` from `.vercel/project.json`
3. `VERCEL_PROJECT_ID` - The `projectId` from `.vercel/project.json`

Navigate to: `Repository Settings > Secrets and variables > Actions`

### 5. Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## For More Information

- **[Complete Deployment Guide](../deployment/deployment.md)** - Comprehensive deployment instructions
- **[Vercel Token Setup](../deployment/VERCEL_TOKEN_SETUP.md)** - Detailed token configuration and troubleshooting
- **[Environment Variables](.env.example)** - All available environment variables

## Need Help?

For troubleshooting common issues, see:
- [Deployment Guide - Common Issues](../deployment/deployment.md#common-issues)
- [CI/CD Troubleshooting](../CI-CD-TROUBLESHOOTING.md)
