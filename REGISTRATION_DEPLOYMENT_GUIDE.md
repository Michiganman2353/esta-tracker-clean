# Registration System Deployment & Troubleshooting Guide

## Overview
This guide provides step-by-step instructions for deploying and troubleshooting the ESTA Tracker registration system on Vercel with Firebase.

## Pre-Deployment Checklist

### 1. Firebase Console Configuration

#### Enable Authentication Methods
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `esta-tracker`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** authentication
5. ✓ Verify it shows as "Enabled"

#### Add Authorized Domains
1. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add the following domains:
   - `estatracker.com`
   - `www.estatracker.com`
   - `*.vercel.app` (for preview deployments)
   - `localhost` (for local development)

#### Configure Email Templates
1. Navigate to **Authentication** → **Templates**
2. Select **Email address verification**
3. Customize the template (optional but recommended):
   - Subject: "Verify your ESTA Tracker account"
   - Sender name: "ESTA Tracker"
4. Ensure the action URL is set correctly

#### Deploy Firebase Functions
```bash
# From project root
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

Verify deployed functions:
- `approveUserAfterVerification`
- `getTenantByCode`
- `generateDocumentUploadUrl`
- `confirmDocumentUpload`
- `getDocumentDownloadUrl`

#### Deploy Firestore Rules and Indexes
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy storage rules
firebase deploy --only storage:rules
```

### 2. Vercel Dashboard Configuration

#### Required Environment Variables
Navigate to Vercel Dashboard → Project Settings → Environment Variables

**Production Environment:**
```bash
# Firebase Web SDK (Frontend)
VITE_FIREBASE_API_KEY=AIzaSyCWoqaXUc6ChNLQDBofkml_FgQsCmvAd-g
VITE_FIREBASE_AUTH_DOMAIN=esta-tracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=esta-tracker
VITE_FIREBASE_STORAGE_BUCKET=esta-tracker.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=718800554935
VITE_FIREBASE_APP_ID=1:718800554935:web:44e0da9f10c748848af632
VITE_FIREBASE_MEASUREMENT_ID=G-MRE9DR9ZPF

# Backend Configuration
FIREBASE_PROJECT_ID=esta-tracker
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"esta-tracker",...}

# CORS and Security
ALLOWED_ORIGIN=https://estatracker.com
CORS_ORIGIN=https://estatracker.com

# Edge Config (Optional)
EDGE_CONFIG=https://edge-config.vercel.com/...
```

**Important Notes:**
- All variables starting with `VITE_` are exposed to the frontend
- `FIREBASE_SERVICE_ACCOUNT` should contain the entire service account JSON
- Set these for **Production**, **Preview**, and **Development** environments

#### Domain Configuration
1. Go to **Domains** in Vercel Dashboard
2. Add your custom domain: `estatracker.com`
3. Add www subdomain: `www.estatracker.com`
4. Configure DNS records as shown by Vercel
5. Wait for SSL certificate provisioning

#### Build Settings
Verify in Vercel Dashboard:
- **Framework Preset:** Other
- **Build Command:** `npm install && npm run build:frontend`
- **Output Directory:** `packages/frontend/dist`
- **Install Command:** `npm install`
- **Root Directory:** (leave blank)

### 3. DNS Configuration

Ensure your DNS provider has:
```
A Record:    @     -> Vercel IP (76.76.21.21)
CNAME:       www   -> cname.vercel-dns.com
```

### 4. GitHub Secrets (for CI/CD)

Add to GitHub Repository → Settings → Secrets and Variables → Actions:
```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID=<your-project-id>
```

## Deployment Steps

### Step 1: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Deploy to production
vercel --prod
```

### Step 2: Verify Deployment

#### Test Health Endpoints
```bash
# Check API health
curl https://estatracker.com/api/health

# Check registration diagnostic
curl https://estatracker.com/api/registration-diagnostic
```

Expected responses:
```json
{
  "healthy": true,
  "timestamp": "2024-11-20T...",
  "checks": {
    "environment": { "status": "ok" },
    "firebase": { "status": "ok" },
    "cors": { "status": "ok" }
  }
}
```

#### Test Registration Flow
1. Navigate to `https://estatracker.com/register/manager`
2. Fill in the form with test data
3. Submit registration
4. Check browser console for logs
5. Verify email is sent to inbox
6. Click verification link
7. Should redirect to login with success message

### Step 3: Monitor Logs

#### Vercel Logs
```bash
# View real-time logs
vercel logs --follow

# View recent logs
vercel logs
```

#### Firebase Logs
```bash
# View Cloud Function logs
firebase functions:log

# View specific function
firebase functions:log --only approveUserAfterVerification
```

#### Browser Console
During registration, you should see:
```
Starting manager registration for: user@example.com
Registration environment: { origin: "https://estatracker.com", ... }
Firebase user created: ABC123...
Creating tenant document: tenant_ABC123
Creating user document in Firestore
Sending email verification to: user@example.com
Action code settings: { url: "https://estatracker.com/login?verified=true", ... }
Email verification sent successfully
```

## Troubleshooting Guide

### Issue 1: "Firebase not configured" Error

**Symptoms:**
- User sees: "Firebase not configured. Please check your environment variables or contact support."
- Registration form doesn't submit

**Diagnosis:**
```bash
# Check if environment variables are set
curl https://estatracker.com/api/registration-diagnostic
```

**Solutions:**
1. Verify all `VITE_FIREBASE_*` variables are set in Vercel Dashboard
2. Check that variables are set for the correct environment (Production/Preview/Development)
3. Redeploy after adding variables: `vercel --prod`
4. Clear browser cache and reload

### Issue 2: Network Request Failed

**Symptoms:**
- Error: "Network error. Please check your internet connection"
- Browser console shows CORS errors

**Diagnosis:**
```bash
# Check browser console for specific CORS errors
# Look for messages like: "Access-Control-Allow-Origin"
```

**Solutions:**
1. Verify domain is added to Firebase Authorized Domains
2. Check CORS headers in `vercel.json`:
   ```json
   "headers": [
     {
       "source": "/(.*)",
       "headers": [
         { "key": "Access-Control-Allow-Origin", "value": "*" }
       ]
     }
   ]
   ```
3. Ensure `ALLOWED_ORIGIN` environment variable is set correctly
4. Check Content Security Policy allows Firebase domains

### Issue 3: Email Verification Not Sent

**Symptoms:**
- Registration completes but no email arrives
- User stuck on verification screen

**Diagnosis:**
1. Check Firebase Console → Authentication → Users
2. Verify user is created with `emailVerified: false`
3. Check spam/junk folder
4. Check Firebase email quota

**Solutions:**
1. Verify Email/Password authentication is enabled in Firebase
2. Check email template configuration in Firebase Console
3. Manually trigger email resend from verification screen
4. Check Firebase quota limits (Authentication → Usage)

### Issue 4: Cloud Function Fails

**Symptoms:**
- Email verified but user can't log in
- Status stuck at "pending"

**Diagnosis:**
```bash
# Check Cloud Function logs
firebase functions:log --only approveUserAfterVerification

# Look for errors like:
# - Permission denied
# - Function timeout
# - Missing custom claims
```

**Solutions:**
1. Verify Cloud Functions are deployed:
   ```bash
   firebase deploy --only functions
   ```
2. Check function permissions in Firebase Console
3. Verify service account has correct permissions
4. Test function directly:
   ```javascript
   const approveUser = httpsCallable(functions, 'approveUserAfterVerification');
   await approveUser({});
   ```
5. Use auto-activation fallback in `signIn` function (already implemented)

### Issue 5: Firestore Permission Denied

**Symptoms:**
- Error: "Missing or insufficient permissions"
- Registration creates auth user but fails on Firestore write

**Diagnosis:**
```bash
# Check Firestore rules
firebase firestore:rules:get

# Verify indexes are deployed
firebase firestore:indexes
```

**Solutions:**
1. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. Check rules allow user creation:
   ```javascript
   // In firestore.rules
   match /users/{userId} {
     allow create: if request.auth != null;
   }
   ```
3. Verify indexes are created for tenant code lookups
4. Check service account permissions

### Issue 6: Rate Limiting

**Symptoms:**
- Error: "Too many registration attempts"
- Multiple failed attempts in short time

**Solutions:**
1. Wait 5-10 minutes before retrying
2. Check if IP is blocked by Firebase
3. Implement rate limiting on frontend
4. Contact Firebase support if legitimately blocked

### Issue 7: Timeout Errors

**Symptoms:**
- Error: "Request timed out"
- Slow connection warnings

**Solutions:**
1. Check internet connection speed
2. Verify Firebase service status: https://status.firebase.google.com/
3. Check Vercel function timeout limits
4. Retry with retry logic (already implemented)

## Monitoring & Alerts

### Set Up Vercel Monitoring
1. Go to Vercel Dashboard → Project → Analytics
2. Enable Web Analytics
3. Set up error tracking
4. Configure alerts for:
   - High error rates
   - Slow response times
   - Failed deployments

### Set Up Firebase Monitoring
1. Go to Firebase Console → Performance
2. Enable Performance Monitoring
3. Set up alerts for:
   - High error rates in Cloud Functions
   - Authentication failures
   - Firestore quota exceeded

### Custom Logging
Monitor these metrics:
- Registration success rate
- Email verification rate
- Time to email verification
- Auto-activation rate
- Failed registration reasons

## Testing Checklist

Before marking as complete:

### Manager Registration
- [ ] Can access registration form
- [ ] Form validation works (email, password, etc.)
- [ ] Submission shows loading state
- [ ] Firebase user is created
- [ ] Tenant document is created
- [ ] User document is created
- [ ] Verification email is sent
- [ ] Email arrives in inbox (within 5 minutes)
- [ ] Verification link works
- [ ] Redirects to login with success message
- [ ] Can log in after verification
- [ ] Dashboard loads correctly
- [ ] All user data is correct

### Employee Registration
- [ ] Can access registration form
- [ ] Tenant code validation works
- [ ] Invalid code shows error
- [ ] Valid code allows registration
- [ ] Form validation works
- [ ] Submission shows loading state
- [ ] Firebase user is created
- [ ] User document is linked to correct tenant
- [ ] Verification email is sent
- [ ] Email arrives in inbox
- [ ] Verification link works
- [ ] Can log in after verification
- [ ] Dashboard loads correctly
- [ ] Linked to correct employer

### Error Handling
- [ ] Invalid email shows error
- [ ] Weak password shows error
- [ ] Duplicate email shows clear error
- [ ] Network errors are caught
- [ ] Timeout errors are caught
- [ ] CORS errors show helpful message
- [ ] All errors are user-friendly
- [ ] Retry logic works for transient errors

### Edge Cases
- [ ] Can handle slow connections
- [ ] Can handle intermittent connectivity
- [ ] Works on mobile devices
- [ ] Works on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Works with ad blockers enabled
- [ ] Handles concurrent registrations
- [ ] Handles special characters in names
- [ ] Handles international email addresses

## Support Contacts

If issues persist after troubleshooting:

**Technical Support:**
- Email: support@estatracker.com
- Include: Error message, browser console logs, timestamp

**Firebase Support:**
- Console: https://firebase.google.com/support
- For production issues affecting multiple users

**Vercel Support:**
- Dashboard: https://vercel.com/support
- For deployment and infrastructure issues

## Quick Reference

### Common Commands
```bash
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Deploy Firebase Functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# View Firebase logs
firebase functions:log

# Test health endpoint
curl https://estatracker.com/api/health

# Test registration diagnostic
curl https://estatracker.com/api/registration-diagnostic
```

### Important URLs
- Production: https://estatracker.com
- Firebase Console: https://console.firebase.google.com/project/esta-tracker
- Vercel Dashboard: https://vercel.com/dashboard
- Health Check: https://estatracker.com/api/health
- Diagnostic: https://estatracker.com/api/registration-diagnostic

### Environment Variable Template
Copy this to Vercel Dashboard:
```bash
VITE_FIREBASE_API_KEY=AIzaSyCWoqaXUc6ChNLQDBofkml_FgQsCmvAd-g
VITE_FIREBASE_AUTH_DOMAIN=esta-tracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=esta-tracker
VITE_FIREBASE_STORAGE_BUCKET=esta-tracker.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=718800554935
VITE_FIREBASE_APP_ID=1:718800554935:web:44e0da9f10c748848af632
VITE_FIREBASE_MEASUREMENT_ID=G-MRE9DR9ZPF
FIREBASE_PROJECT_ID=esta-tracker
ALLOWED_ORIGIN=https://estatracker.com
CORS_ORIGIN=https://estatracker.com
```

## Changelog

### 2024-11-20 - Enhanced Registration System
- ✓ Added input validation for all fields
- ✓ Implemented retry logic with exponential backoff
- ✓ Enhanced error messages with actionable guidance
- ✓ Added health check and diagnostic endpoints
- ✓ Improved logging throughout registration flow
- ✓ Added support email to error messages
- ✓ Enhanced timeout handling
- ✓ Added CORS error detection
- ✓ Created comprehensive deployment guide

## Next Steps

After successful deployment:
1. Monitor registration metrics for first week
2. Collect user feedback
3. Add analytics tracking
4. Implement A/B testing for form variations
5. Add more detailed error logging
6. Create admin dashboard for registration monitoring
