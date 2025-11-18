# Vercel Configuration Directory

This directory is automatically created when you run `vercel link` to connect your local project to a Vercel project.

## ⚠️ Important: This directory is gitignored

The `.vercel/` directory contains sensitive project configuration and should never be committed to version control.

## What's in this directory?

After running `vercel link`, you'll find:

### `project.json`

Contains your Vercel project configuration:

```json
{
  "orgId": "team_xxxxxxxxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxxxxxxxx"
}
```

**These values are needed for:**
- GitHub Actions CI/CD deployments
- Vercel CLI deployments
- Project-specific configuration

## How to obtain these IDs

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
cd /path/to/esta-tracker-clean
vercel link
```

You'll be asked:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your team/account
3. **Link to existing project?** → Yes (if project exists) or No (to create new)
4. **Project name** → Select or enter `esta-tracker-clean`

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
   - Name: `VERCEL_TOKEN`, Value: Your Vercel API token

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
