# Quick Start: Vercel Secrets Setup

This is a quick reference for setting up Vercel secrets. For detailed information, see `VERCEL_TOKEN_SETUP.md`.

## Current Status

✅ **GitHub Secrets (Repository Owner Action)**
The repository owner has added to GitHub repository settings:
- `VERCEL_TOKEN`: cCWR9S3mirDVwI315SjRzTep

⚠️ **Still Needed**:
- `VERCEL_ORG_ID`: Must be obtained from `.vercel/project.json`
- `VERCEL_PROJECT_ID`: Must be obtained from `.vercel/project.json`

## How to Get ORG_ID and PROJECT_ID

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Link the Project
```bash
cd /path/to/esta-tracker-clean
vercel link
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your team/account
- **Link to existing project?** → Yes (if exists) or No (to create)
- **Project name** → esta-tracker-clean

### Step 4: Get the IDs
```bash
cat .vercel/project.json
```

You'll see something like:
```json
{
  "orgId": "team_abc123xyz789",
  "projectId": "prj_def456uvw012"
}
```

### Step 5: Add to GitHub Secrets

1. Go to: https://github.com/Michiganman2353/esta-tracker-clean/settings/secrets/actions
2. Click "New repository secret"
3. Add:
   - Name: `VERCEL_ORG_ID`, Value: (the orgId from project.json)
   - Name: `VERCEL_PROJECT_ID`, Value: (the projectId from project.json)

## Verify Setup

After adding the secrets, test by:
1. Creating a pull request
2. Check the "Deploy Preview" job in GitHub Actions
3. Verify the deployment succeeds

## For Local Development

Create `.env.local` (gitignored) with:
```bash
VERCEL_TOKEN=cCWR9S3mirDVwI315SjRzTep
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

Then you can deploy locally:
```bash
vercel           # Deploy to preview
vercel --prod    # Deploy to production
```

## Need More Help?

- Detailed guide: `VERCEL_TOKEN_SETUP.md`
- Setup instructions: `.vercel/README.md`
- Environment template: `.env.example`
- Full implementation details: `VERCEL_SECRETS_IMPLEMENTATION.md`

## Troubleshooting

**"Project not found"**
- Run `vercel link` first
- Make sure project exists in Vercel dashboard

**"Authentication failed"**
- Verify token is correct
- Try `vercel logout` then `vercel login`

**"Permission denied"**
- Check your Vercel account has access to the project
- Verify you're in the correct organization
