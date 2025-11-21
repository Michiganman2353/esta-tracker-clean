# GitHub Secrets Setup Guide

This document provides step-by-step instructions for setting up the required GitHub Secrets for CI/CD deployment.

## Required Secrets

The following secrets must be configured in your GitHub repository for successful deployments:

### 1. `VERCEL_TOKEN`
- **Purpose:** Authenticates with Vercel for deployments
- **How to obtain:** Generate from Vercel Dashboard
- **Format:** Alphanumeric string (24-32 characters)
- **Example:** `AbCdEf123456789012345678`

### 2. `VERCEL_ORG_ID`
- **Purpose:** Identifies your Vercel organization/team
- **How to obtain:** From `.vercel/project.json` after running `vercel link`
- **Format:** Starts with `team_` followed by alphanumeric characters
- **Example:** `team_abcdefghijklmnop1234`

### 3. `VERCEL_PROJECT_ID`
- **Purpose:** Identifies your Vercel project
- **How to obtain:** From `.vercel/project.json` after running `vercel link`
- **Format:** Starts with `prj_` followed by alphanumeric characters
- **Example:** `prj_1234567890abcdefghijk`

## Step-by-Step Setup

### Step 1: Install Vercel CLI

```bash
# Install globally
npm install -g vercel

# Or use with npx (no installation needed)
npx vercel --version
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts:
1. Select your preferred authentication method (Email, GitHub, GitLab, or Bitbucket)
2. Complete the authentication flow in your browser
3. You'll see a confirmation message in your terminal

### Step 3: Link Your Project

Navigate to your project directory and link it to Vercel:

```bash
cd /path/to/esta-tracker-clean
vercel link
```

Answer the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your team/account
- **Link to existing project?** → Yes (if project exists) or No (to create new)
- **What's your project's name?** → `esta-tracker-clean`

After successful linking, a `.vercel` directory will be created.

### Step 4: Extract Project IDs

```bash
cat .vercel/project.json
```

You should see output like:
```json
{
  "orgId": "team_xxxxxxxxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxxxxxxxx"
}
```

**Copy these values** - you'll need them for GitHub Secrets.

### Step 5: Generate Vercel Token

1. Go to [Vercel Tokens Page](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Configure the token:
   - **Token Name:** `GitHub Actions - ESTA Tracker` (or your preferred name)
   - **Scope:** Select your team/account
   - **Expiration:** Choose based on your security policy (we recommend 1 year with rotation)
4. Click **"Create"**
5. **⚠️ IMPORTANT:** Copy the token immediately - it won't be shown again!

### Step 6: Add Secrets to GitHub

1. **Navigate to your repository on GitHub:**
   ```
   https://github.com/Michiganman2353/esta-tracker-clean
   ```

2. **Go to Settings:**
   - Click **Settings** tab
   - In the left sidebar, click **Secrets and variables** → **Actions**

3. **Add each secret:**

   #### Add VERCEL_TOKEN:
   - Click **"New repository secret"**
   - **Name:** `VERCEL_TOKEN`
   - **Secret:** Paste the token you generated in Step 5
   - Click **"Add secret"**

   #### Add VERCEL_ORG_ID:
   - Click **"New repository secret"**
   - **Name:** `VERCEL_ORG_ID`
   - **Secret:** Paste the `orgId` value from Step 4
   - Click **"Add secret"**

   #### Add VERCEL_PROJECT_ID:
   - Click **"New repository secret"**
   - **Name:** `VERCEL_PROJECT_ID`
   - **Secret:** Paste the `projectId` value from Step 4
   - Click **"Add secret"**

### Step 7: Verify Setup

After adding all secrets, you should see them listed (values are hidden):

```
VERCEL_TOKEN          Updated X minutes ago
VERCEL_ORG_ID         Updated X minutes ago
VERCEL_PROJECT_ID     Updated X minutes ago
```

## Testing the Setup

### Test Deployment Locally

Before relying on GitHub Actions, test the deployment locally:

```bash
# Pull Vercel environment (uses local .vercel/project.json)
vercel pull

# Build locally
npm run build

# Deploy to preview
vercel deploy

# Deploy to production
vercel deploy --prod
```

### Test GitHub Actions

1. **Create a test branch:**
   ```bash
   git checkout -b test-ci-deployment
   ```

2. **Make a small change:**
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test: CI/CD deployment"
   git push origin test-ci-deployment
   ```

3. **Create a Pull Request:**
   - Go to your repository on GitHub
   - Click "Pull requests" → "New pull request"
   - Select your test branch
   - Create the PR

4. **Monitor the Workflow:**
   - Click "Actions" tab
   - Watch the workflow execution
   - The "Deploy Preview" job should complete successfully

## Troubleshooting

### Issue: "Invalid token" error

**Error:**
```
Error! You defined "--token", but its contents are invalid
```

**Solutions:**
1. Verify the token has no extra spaces or newlines
2. Generate a new token and update the secret
3. Ensure you copied the entire token

### Issue: "Project not found"

**Error:**
```
Error: Project not found
```

**Solutions:**
1. Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
2. Run `vercel link` again to regenerate `.vercel/project.json`
3. Ensure the project exists in Vercel Dashboard

### Issue: "Permission denied"

**Error:**
```
Error: You don't have permission to access this project
```

**Solutions:**
1. Verify the token has access to the specified project
2. Check team/organization permissions in Vercel Dashboard
3. Generate a new token with proper scope

## Security Best Practices

### ✅ DO:
- Rotate tokens regularly (recommended: every 6-12 months)
- Use tokens with minimal required permissions
- Delete tokens that are no longer needed
- Keep `.vercel/` directory in `.gitignore`
- Use environment-specific secrets when possible

### ❌ DON'T:
- Commit tokens to source control
- Share tokens via insecure channels (email, Slack, etc.)
- Use the same token across multiple projects
- Store tokens in plain text files
- Share your `.vercel/project.json` file

## Token Rotation

When rotating tokens:

1. **Generate a new token** in Vercel Dashboard
2. **Update GitHub Secret** with the new token
3. **Test a deployment** to verify it works
4. **Revoke the old token** in Vercel Dashboard
5. **Document the rotation** (date, reason, who performed it)

## Emergency Access Recovery

If you lose access to secrets:

1. **Vercel Token:**
   - Generate a new token in Vercel Dashboard
   - Update GitHub Secret

2. **Project IDs:**
   - Run `vercel link` again
   - Extract IDs from `.vercel/project.json`
   - Update GitHub Secrets

3. **Complete Loss:**
   - Create a new Vercel project
   - Run `vercel link`
   - Update all three secrets in GitHub

## Support

For issues with:
- **Vercel CLI:** [Vercel Documentation](https://vercel.com/docs)
- **GitHub Actions:** [GitHub Actions Documentation](https://docs.github.com/en/actions)
- **This Project:** Create an issue in the repository

## Checklist

Before pushing to production, verify:

- [ ] All three secrets are configured in GitHub
- [ ] Test deployment completed successfully
- [ ] Preview deployments work for PRs
- [ ] Production deployments work for master branch
- [ ] No secrets are committed to source control
- [ ] Team members have documented access procedures
- [ ] Token rotation schedule is established
