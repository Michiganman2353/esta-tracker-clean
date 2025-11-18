# Vercel Cron Jobs - Testing Guide

## Quick Testing Checklist

Use this guide to verify that the cron jobs are working correctly after deployment.

## Pre-Deployment Verification

### ✅ Code Review Checklist

- [x] All TypeScript files compile without errors
- [x] vercel.json includes all 7 cron job configurations
- [x] Environment variables documented in .env.example
- [x] Comprehensive documentation created
- [x] Error handling implemented in all jobs
- [x] Firebase Admin SDK properly initialized
- [x] Authentication mechanism in place

### ✅ Build Verification

```bash
# From project root
npm run typecheck    # Should pass with no errors
npm run build       # Should complete successfully
cd api && npm run typecheck  # Should pass
```

## Post-Deployment Testing

### 1. Verify Cron Jobs Are Registered

**In Vercel Dashboard:**
1. Go to your project
2. Click **Settings → Cron Jobs**
3. Verify all 7 jobs appear:
   - `/api/cron/accrual` - `0 0 * * *`
   - `/api/cron/cleanup` - `0 1 * * *`
   - `/api/cron/recalculate-pto` - `0 2 * * *`
   - `/api/cron/audit` - `0 3 * * 0`
   - `/api/cron/ruleset-validator` - `0 3 * * 1`
   - `/api/cron/billing-reports` - `0 4 1 * *`
   - `/api/cron/compliance-packet` - `0 5 1 * *`

### 2. Test Manual Cron Job Trigger

**Prerequisites:**
- `CRON_SECRET` must be set in Vercel environment variables
- Deployment must be complete

**Test Command:**

```bash
# Replace with your actual deployment URL and CRON_SECRET
export DEPLOYMENT_URL="https://your-app.vercel.app"
export CRON_SECRET="your-cron-secret"

# Test accrual job
curl -X GET "$DEPLOYMENT_URL/api/cron/accrual" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -v

# Expected: HTTP 200 with JSON response
# {
#   "success": true,
#   "message": "Accrual update completed",
#   "data": { ... },
#   "timestamp": "..."
# }
```

### 3. Verify Firestore Logging

**Check cronJobs Collection:**

1. Go to Firebase Console → Firestore Database
2. Find the `cronJobs` collection
3. Look for recent documents with structure:
   ```javascript
   {
     jobName: "accrual_update",
     success: true,
     details: { processedCount: X, errorCount: Y },
     executedAt: Timestamp,
     timestamp: "ISO-8601 string"
   }
   ```

### 4. Test Each Cron Job

#### Daily Jobs

**Accrual Update:**
```bash
curl "$DEPLOYMENT_URL/api/cron/accrual" \
  -H "Authorization: Bearer $CRON_SECRET"
```
- Should process work logs
- Check `balances` collection for updated values
- Check `auditLogs` for `accrual_updated` entries

**Cleanup:**
```bash
curl "$DEPLOYMENT_URL/api/cron/cleanup" \
  -H "Authorization: Bearer $CRON_SECRET"
```
- Should delete unverified users (if any exist)
- Check `auditLogs` for `unverified_account_deleted` entries

**Recalculate PTO:**
```bash
curl "$DEPLOYMENT_URL/api/cron/recalculate-pto" \
  -H "Authorization: Bearer $CRON_SECRET"
```
- Should recalculate all balances
- Check `auditLogs` for `balance_corrected` entries (if discrepancies found)

#### Weekly Jobs

**Compliance Audit:**
```bash
curl "$DEPLOYMENT_URL/api/cron/audit" \
  -H "Authorization: Bearer $CRON_SECRET"
```
- Should create compliance audit reports
- Check `complianceAudits` collection for new documents
- Check `notifications` for high-severity issues

**RuleSet Validator:**
```bash
curl "$DEPLOYMENT_URL/api/cron/ruleset-validator" \
  -H "Authorization: Bearer $CRON_SECRET"
```
- Should validate rule integrity
- Check `ruleSetValidations` collection for new documents
- Check `notifications` for critical issues

#### Monthly Jobs

**Billing Reports:**
```bash
curl "$DEPLOYMENT_URL/api/cron/billing-reports" \
  -H "Authorization: Bearer $CRON_SECRET"
```
- Should generate billing reports
- Check `billingReports` collection for new documents
- Check `notifications` for billing notifications

**Compliance Packet:**
```bash
curl "$DEPLOYMENT_URL/api/cron/compliance-packet" \
  -H "Authorization: Bearer $CRON_SECRET"
```
- Should generate compliance packets
- Check `compliancePackets` collection for new documents
- Check `notifications` for compliance status

### 5. Monitor Execution Logs

**In Vercel Dashboard:**

1. Go to **Deployments**
2. Click your deployment
3. Navigate to **Functions**
4. Click on a cron function (e.g., `api/cron/accrual`)
5. View logs for:
   - Successful executions
   - Error messages
   - Processing details

**Sample Log Output (Success):**
```
Starting daily accrual update job...
Processed tenant: tenant-123
Generated billing report for Company ABC: $350.00
Accrual update completed. Processed: 150, Errors: 0
```

**Sample Log Output (Error):**
```
Error processing tenant tenant-456: Permission denied
Cron job error: Failed to complete accrual update
```

## Common Issues & Solutions

### Issue: 401 Unauthorized

**Cause:** `CRON_SECRET` not set or incorrect

**Solution:**
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Ensure it matches the value in your curl command
3. Redeploy after setting the variable

### Issue: 500 Internal Server Error

**Cause:** Firebase authentication failed or missing data

**Solution:**
1. Check `FIREBASE_SERVICE_ACCOUNT` is valid JSON
2. Verify Firebase project permissions
3. Check function logs in Vercel for detailed error

### Issue: No Data Processed

**Cause:** No data exists to process or filters are too restrictive

**Solution:**
1. Verify test data exists in Firestore
2. Check date filters in the cron job code
3. Review Firestore queries and indexes

### Issue: Timeout (60s limit)

**Cause:** Too much data to process

**Solution:**
1. Optimize Firestore queries (add indexes)
2. Process in smaller batches
3. Consider splitting into multiple jobs

## Performance Benchmarks

Expected execution times (100 tenants, 2000 employees):

| Job | Estimated Time | Notes |
|-----|---------------|-------|
| Accrual | 5-15 seconds | Depends on work logs |
| Cleanup | 1-5 seconds | Usually few to delete |
| Recalculate PTO | 10-30 seconds | Heaviest processing |
| Audit | 8-20 seconds | Depends on complexity |
| RuleSet Validator | 5-15 seconds | Validation checks |
| Billing Reports | 3-10 seconds | Simple calculations |
| Compliance Packet | 5-15 seconds | Data aggregation |

## Success Criteria

✅ All cron jobs return HTTP 200
✅ No errors in Vercel function logs
✅ `cronJobs` collection has execution records
✅ Relevant collections updated (balances, audits, etc.)
✅ Notifications created for important events
✅ Audit logs contain action records
✅ No timeout errors (< 60 seconds execution)

## Monitoring & Alerts

### Set Up Alerts (Recommended)

1. **Vercel Monitoring:**
   - Enable function monitoring
   - Set up error alerts
   - Track execution time trends

2. **Firebase Monitoring:**
   - Monitor `cronJobs` collection
   - Alert on failed executions
   - Track data growth

3. **Custom Alerts:**
   - Email notifications for critical issues
   - Slack/Discord webhooks
   - SMS for urgent problems

## Troubleshooting Commands

```bash
# Check Vercel deployment status
vercel ls

# View function logs
vercel logs [deployment-url]

# Test with verbose output
curl "$DEPLOYMENT_URL/api/cron/accrual" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -v -i

# Check environment variables (locally)
vercel env pull .env.local
cat .env.local | grep CRON_SECRET
```

## Next Steps After Testing

1. ✅ Verify all jobs execute successfully
2. ✅ Monitor for the first week daily
3. ✅ Check Firestore data integrity
4. ✅ Review execution logs weekly
5. ✅ Optimize slow-running jobs if needed
6. ✅ Set up automated monitoring/alerts
7. ✅ Document any custom configurations

## Support Resources

- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- Project Documentation: `api/README.md`
- Deployment Guide: `VERCEL_CRON_SETUP.md`

---

**Testing Completed:** _______________
**Tested By:** _______________
**Issues Found:** _______________
**Status:** [ ] Pass [ ] Fail [ ] Needs Fixes
