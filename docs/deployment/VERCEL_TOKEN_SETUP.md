# Vercel Token Setup for GitHub Actions

This guide explains how to properly configure the Vercel authentication token for GitHub Actions CI/CD deployment.

## Issue Background

The Vercel CLI is strict about token format and will reject tokens that contain certain characters:
- Newlines (`\n`)
- Spaces (` `)
- Hyphens (`-`)
- Periods (`.`)
- Forward slashes (`/`)

**Error message you might see:**
```
Error! You defined "--token", but its contents are invalid. 
Must not contain: "\n", " ", "-", ".", "/"
```

## Solution

The CI/CD workflow automatically sanitizes the Vercel token before use to handle any formatting issues. This is implemented in `.github/workflows/ci.yml` for both preview and production deployments.

### How It Works

The workflow includes a "Sanitize Vercel Token" step that:

1. Removes newlines, carriage returns, tabs, and invalid characters from the token
2. Masks the cleaned token in GitHub Actions logs for security
3. Passes the sanitized token to the Vercel action

```yaml
- name: Sanitize Vercel Token
  id: sanitize-token
  run: |
    # Remove newlines, spaces, and invalid characters (-, ., /) from the token
    CLEAN_TOKEN=$(echo "${{ secrets.VERCEL_TOKEN }}" | tr -d '\n\r\t -./' | xargs)
    echo "::add-mask::$CLEAN_TOKEN"
    echo "token=$CLEAN_TOKEN" >> $GITHUB_OUTPUT
```

## Setting Up the Token

### Step 1: Generate a Vercel Token

1. Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Give it a descriptive name (e.g., "ESTA Tracker GitHub Actions")
4. Set the scope to your organization/account
5. Click **"Create"**
6. **Copy the token immediately** (you won't be able to see it again)

### Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `VERCEL_TOKEN`
5. Value: Paste the token you copied from Vercel
   - **Important**: Copy the token exactly as shown, without adding any extra spaces or newlines
   - If you accidentally added whitespace, the sanitization step will handle it, but it's best to avoid it
6. Click **"Add secret"**

### Step 3: Add Organization and Project IDs

You'll also need to add two more secrets:

1. **VERCEL_ORG_ID**:
   - Run `vercel link` in your project directory
   - Check `.vercel/project.json` for the `orgId` value
   - Add as a repository secret

2. **VERCEL_PROJECT_ID**:
   - Found in the same `.vercel/project.json` file as `projectId`
   - Add as a repository secret

Example `.vercel/project.json`:
```json
{
  "orgId": "team_xxxxxxxxxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxxxxxxxxx"
}
```

## Testing the Configuration

After adding the secrets:

1. Create a new branch
2. Make a small change (e.g., update a comment)
3. Push the branch and create a pull request
4. Watch the GitHub Actions workflow run
5. The "Deploy Preview" job should complete successfully
6. Check the PR for the Vercel preview deployment comment

## Troubleshooting

### Token Still Invalid After Setup

If you still see the invalid token error:

1. **Verify the token format**: Make sure you copied the full token without any trailing spaces
2. **Regenerate the token**: Create a new token in Vercel and update the GitHub secret
3. **Check for copied formatting**: If you pasted from a rich text editor, formatting characters may have been included

### Deployment Fails with "Forbidden" or "Unauthorized"

This means the token is valid but doesn't have the right permissions:

1. Verify the token scope includes your organization/team
2. Check that the `VERCEL_ORG_ID` matches your account
3. Ensure the `VERCEL_PROJECT_ID` is correct

### Preview Deployments Work but Production Fails

1. Check that the workflow has the correct branch trigger (`master` or `main`)
2. Verify the `needs: [test, e2e]` dependencies are passing
3. Check the permissions in the workflow file

## Security Best Practices

✅ **DO**:
- Store the token only in GitHub Secrets
- Use repository secrets (not environment secrets) for better security
- Rotate tokens periodically (every 90 days recommended)
- Use separate tokens for different repositories if needed
- Limit token scope to only the necessary organization/team

❌ **DON'T**:
- Commit tokens to git (even in `.env.local` files)
- Share tokens via email, chat, or other insecure channels
- Use personal tokens for team projects (use team tokens)
- Reuse tokens across multiple unrelated projects

## Token Sanitization Details

The sanitization step in the workflow:

```bash
CLEAN_TOKEN=$(echo "${{ secrets.VERCEL_TOKEN }}" | tr -d '\n\r\t -./' | xargs)
```

This command:
1. `echo "${{ secrets.VERCEL_TOKEN }}"` - Outputs the secret value
2. `tr -d '\n\r\t -./'` - Removes newlines, carriage returns, tabs, spaces, hyphens, periods, and slashes
3. `xargs` - Trims any remaining leading/trailing whitespace
4. `$()` - Captures the cleaned output

The cleaned token is then:
1. Masked with `echo "::add-mask::$CLEAN_TOKEN"` to prevent it from appearing in logs
2. Set as an output with `echo "token=$CLEAN_TOKEN" >> $GITHUB_OUTPUT`
3. Used by subsequent steps via `${{ steps.sanitize-token.outputs.token }}`

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)

---

**Last Updated**: November 2024
**Status**: Active - Token sanitization automatically applied in CI/CD
