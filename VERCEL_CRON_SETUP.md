# Vercel Cron Jobs Deployment Guide

## Overview

This guide covers the setup and deployment of Vercel cron jobs for the ESTA Tracker application. These scheduled tasks automate compliance monitoring, data maintenance, and reporting.

## Prerequisites

- **Vercel Pro Subscription** ($20/month) - Required for cron jobs
- Firebase project with Admin SDK configured
- Vercel CLI installed (optional, for testing)

## Environment Variables Setup

### Required Environment Variables

Configure these in **Vercel Dashboard → Project Settings → Environment Variables**:

#### 1. Firebase Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | `esta-tracker-prod` |
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON (entire JSON object) | `{"type":"service_account",...}` |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `esta-tracker-prod.appspot.com` |

**Getting the Service Account JSON:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings → Service Accounts**
4. Click **Generate New Private Key**
5. Copy the **entire JSON content**
6. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT` in Vercel

⚠️ **Security Note**: Never commit this JSON to your repository!

#### 2. Cron Job Security

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `CRON_SECRET` | Secret token for cron authentication | Use a secure random string (32+ characters) |

**Generate a secure secret:**

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Setting Variables in Vercel

1. Go to your Vercel project
2. Click **Settings → Environment Variables**
3. Add each variable with appropriate scopes:
   - ✅ **Production** (required)
   - ✅ **Preview** (recommended for testing)
   - ⬜ **Development** (optional)

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Vercel Auto-Deploys**
   - Vercel detects the push
   - Builds the application
   - Deploys the frontend
   - Registers cron jobs from `vercel.json`

3. **Verify Cron Jobs**
   - Go to Vercel Dashboard → your project
   - Navigate to **Settings → Cron Jobs**
   - Confirm all 7 jobs are listed with correct schedules

### Option 2: Manual Deployment via CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Verify deployment
vercel ls
```

## Cron Jobs Configuration

The cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/accrual",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/recalculate-pto",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/audit",
      "schedule": "0 3 * * 0"
    },
    {
      "path": "/api/cron/ruleset-validator",
      "schedule": "0 3 * * 1"
    },
    {
      "path": "/api/cron/billing-reports",
      "schedule": "0 4 1 * *"
    },
    {
      "path": "/api/cron/compliance-packet",
      "schedule": "0 5 1 * *"
    }
  ]
}
```

### Schedule Format

Cron schedules use standard cron syntax: `minute hour day month weekday`

| Job | Schedule | Frequency | Time (EST) |
|-----|----------|-----------|------------|
| Accrual | `0 0 * * *` | Daily | 12:00 AM |
| Cleanup | `0 1 * * *` | Daily | 1:00 AM |
| Recalculate PTO | `0 2 * * *` | Daily | 2:00 AM |
| Audit | `0 3 * * 0` | Weekly (Sunday) | 3:00 AM |
| RuleSet Validator | `0 3 * * 1` | Weekly (Monday) | 3:00 AM |
| Billing Reports | `0 4 1 * *` | Monthly (1st) | 4:00 AM |
| Compliance Packet | `0 5 1 * *` | Monthly (1st) | 5:00 AM |

**Note**: Vercel cron jobs run in UTC by default. Adjust schedules if needed for your timezone.

## Monitoring & Verification

### 1. Check Cron Job Status

**In Vercel Dashboard:**
1. Go to your project
2. Click **Settings → Cron Jobs**
3. View scheduled jobs and their next run times

### 2. View Execution Logs

**In Vercel Dashboard:**
1. Go to **Deployments**
2. Click on the latest deployment
3. Navigate to **Functions**
4. Find your cron job function (e.g., `api/cron/accrual`)
5. Click to view logs

**Example log queries:**
```
# Filter by specific job
/api/cron/accrual

# Filter by error status
status:500

# Filter by time range
timestamp:[2024-01-01 TO 2024-01-31]
```

### 3. Check Firestore Logs

All cron executions are logged to Firestore in the `cronJobs` collection:

```typescript
{
  jobName: "accrual_update",
  success: true,
  details: {
    processedCount: 150,
    errorCount: 0
  },
  executedAt: "2024-11-18T05:00:00Z",
  timestamp: "2024-11-18T05:00:00.000Z"
}
```

**To view in Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Find the `cronJobs` collection
5. Review recent execution logs

### 4. Test Cron Jobs Manually

You can manually trigger cron jobs for testing:

```bash
# Using curl (requires CRON_SECRET)
curl -X GET https://your-app.vercel.app/api/cron/accrual \
  -H "Authorization: Bearer your-cron-secret"

# Or using Vercel CLI (in development)
vercel dev
# Then visit: http://localhost:3000/api/cron/accrual
```

## Troubleshooting

### Issue 1: Cron Jobs Not Appearing in Dashboard

**Possible Causes:**
- Not on Vercel Pro plan
- `vercel.json` syntax error
- Deployment failed

**Solutions:**
1. Verify Vercel Pro subscription
2. Validate `vercel.json` syntax
3. Check deployment logs for errors
4. Redeploy the application

### Issue 2: "Unauthorized" Error

**Possible Causes:**
- `CRON_SECRET` not set
- Incorrect secret value
- Secret not applied to production

**Solutions:**
1. Set `CRON_SECRET` in Vercel environment variables
2. Ensure it's added to **Production** scope
3. Redeploy after adding the variable

### Issue 3: Firebase Authentication Failed

**Possible Causes:**
- Invalid `FIREBASE_SERVICE_ACCOUNT` JSON
- Missing Firebase permissions
- Incorrect project ID

**Solutions:**
1. Verify the service account JSON is complete and valid
2. Check Firebase IAM permissions for the service account
3. Ensure `FIREBASE_PROJECT_ID` matches your Firebase project
4. Regenerate the service account key if needed

### Issue 4: Function Timeout

**Possible Causes:**
- Large dataset processing
- Slow Firebase queries
- Complex calculations

**Solutions:**
1. Vercel Pro: 60-second timeout (cannot be increased)
2. Optimize queries (add indexes, use pagination)
3. Process in batches
4. Consider splitting into multiple jobs

### Issue 5: Job Runs But No Changes

**Possible Causes:**
- No data to process
- Filters excluding all records
- Logic errors

**Solutions:**
1. Check Firestore for expected data
2. Review job execution logs in `cronJobs` collection
3. Verify filters and date ranges
4. Test queries in Firebase Console

## Cost Considerations

### Vercel Pricing

| Plan | Cron Jobs | Function Execution | Bandwidth |
|------|-----------|-------------------|-----------|
| **Hobby** | ❌ Not available | 100GB-hours/month | 100GB/month |
| **Pro** ($20/month) | ✅ Unlimited | 1,000GB-hours/month | 1TB/month |
| **Enterprise** | ✅ Unlimited | Custom | Custom |

### Estimating Costs

**For ESTA Tracker with 100 tenants, 2,000 employees:**

- Daily jobs (3): ~3 executions/day = 90/month
- Weekly jobs (2): ~2 executions/week = 8/month
- Monthly jobs (2): 2 executions/month
- **Total**: ~100 executions/month

**Execution time per job**: 5-30 seconds average

This usage fits comfortably within the Pro plan limits.

## Security Best Practices

1. ✅ **Never commit secrets** to your repository
2. ✅ **Use environment variables** for all sensitive data
3. ✅ **Rotate CRON_SECRET** periodically (every 90 days)
4. ✅ **Monitor execution logs** for suspicious activity
5. ✅ **Limit Firebase service account permissions** to minimum required
6. ✅ **Enable Vercel's Security features** (HTTPS, DDoS protection)
7. ✅ **Review Firestore security rules** regularly

## Maintenance

### Regular Tasks

- **Weekly**: Review cron job execution logs
- **Monthly**: Check for failed executions in Firestore
- **Quarterly**: Rotate CRON_SECRET
- **Annually**: Review and optimize job schedules

### Updating Cron Schedules

1. Edit `vercel.json`
2. Update the `schedule` field for the desired job
3. Commit and push changes
4. Vercel will automatically update the schedule on next deployment

### Adding New Cron Jobs

1. Create new function in `api/cron/`
2. Add entry to `vercel.json` `crons` array
3. Deploy to Vercel
4. Verify in Vercel Dashboard

## Support & Resources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Cron Expression Generator](https://crontab.guru/)
- Project README: `api/README.md`

## Quick Reference

```bash
# View Vercel project info
vercel ls

# View function logs
vercel logs [deployment-url]

# Pull environment variables
vercel env pull

# Check cron job status (in Vercel Dashboard)
Settings → Cron Jobs

# Manual trigger (testing)
curl https://your-app.vercel.app/api/cron/[job-name] \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

**Last Updated**: November 2024
**Vercel Cron API Version**: v1
**Required Plan**: Vercel Pro ($20/month)
