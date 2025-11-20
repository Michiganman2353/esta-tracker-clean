# ESTA Tracker Registration System - Quick Start for Production Deployment

## 🚀 Immediate Action Items

### 1. Configure Vercel Environment Variables (5 minutes)

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

**Add these for Production, Preview, AND Development:**

```bash
# Firebase Frontend Config
VITE_FIREBASE_API_KEY=AIzaSyCWoqaXUc6ChNLQDBofkml_FgQsCmvAd-g
VITE_FIREBASE_AUTH_DOMAIN=esta-tracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=esta-tracker
VITE_FIREBASE_STORAGE_BUCKET=esta-tracker.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=718800554935
VITE_FIREBASE_APP_ID=1:718800554935:web:44e0da9f10c748848af632
VITE_FIREBASE_MEASUREMENT_ID=G-MRE9DR9ZPF

# Firebase Backend Config
FIREBASE_PROJECT_ID=esta-tracker

# CORS Configuration
ALLOWED_ORIGIN=https://estatracker.com
CORS_ORIGIN=https://estatracker.com
```

⚠️ **CRITICAL**: Click "Save" after adding each variable!

### 2. Configure Firebase Console (10 minutes)

#### Enable Email/Password Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/project/esta-tracker)
2. Click **Authentication** → **Sign-in method**
3. Click **Email/Password**
4. Toggle **Enable** to ON
5. Click **Save**

#### Add Authorized Domains
1. In Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Click **Add domain** and add:
   - `estatracker.com`
   - `www.estatracker.com`
4. Click **Add**

### 3. Deploy to Vercel (2 minutes)

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### 4. Verify Deployment (3 minutes)

**Test Health Endpoint:**
```bash
curl https://estatracker.com/api/health
```

Expected response:
```json
{
  "healthy": true,
  "timestamp": "2024-11-20T...",
  "checks": {
    "environment": { "status": "ok" },
    "firebase": { "status": "ok" }
  }
}
```

**Test Registration Diagnostic:**
```bash
curl https://estatracker.com/api/registration-diagnostic
```

Expected: All checks should show "✓ Set"

### 5. Test Registration Flow (5 minutes)

1. Navigate to: `https://estatracker.com/register/manager`
2. Fill in test data:
   - Name: Test User
   - Email: test@example.com
   - Company: Test Company
   - Employee Count: 10
   - Password: TestPass123
3. Submit form
4. Check email for verification link
5. Click verification link
6. Should redirect to login with success message

### 6. Deploy Firebase Functions (Optional - 5 minutes)

If Cloud Functions are not already deployed:

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

Verify deployment:
```bash
firebase functions:list
```

## ✅ Success Criteria

- [ ] Health endpoint returns `"healthy": true`
- [ ] Diagnostic endpoint shows all Firebase config as "✓ Set"
- [ ] Registration form loads without errors
- [ ] User can submit registration form
- [ ] Verification email is sent within 1 minute
- [ ] Verification link redirects to login
- [ ] User can log in after verification

## 🆘 If Something Goes Wrong

### Issue: "Firebase not configured" Error

**Quick Fix:**
1. Verify environment variables in Vercel Dashboard
2. Check all `VITE_FIREBASE_*` variables are set
3. Redeploy: `vercel --prod`
4. Clear browser cache

### Issue: No Verification Email

**Quick Fix:**
1. Check spam/junk folder
2. Verify Email/Password is enabled in Firebase Console
3. Check Firebase Console → Authentication → Users (user should exist)
4. Click "Resend Email" on verification screen

### Issue: CORS Error in Browser Console

**Quick Fix:**
1. Add domain to Firebase Authorized Domains (see step 2 above)
2. Wait 2-3 minutes for changes to propagate
3. Clear browser cache and try again

### Issue: Health Check Fails

**Quick Fix:**
1. Check `curl https://estatracker.com/api/health`
2. If 404: Wait for deployment to finish (check Vercel Dashboard)
3. If 503: Check diagnostic endpoint for details
4. Verify all environment variables are set

## 📞 Support

**Immediate Help:**
- Check: `REGISTRATION_DEPLOYMENT_GUIDE.md` (comprehensive troubleshooting)
- Diagnostic: `https://estatracker.com/api/registration-diagnostic`
- Health: `https://estatracker.com/api/health`

**Technical Issues:**
- Email: support@estatracker.com
- Include: Error message, browser console logs, timestamp

## 📊 Monitoring

After deployment, monitor these metrics for the first 24 hours:

1. **Registration Success Rate** - Should be > 95%
2. **Email Delivery Time** - Should be < 2 minutes
3. **Verification Rate** - Track % of users who verify email
4. **Error Types** - Monitor for patterns in error logs

View logs:
```bash
# Vercel logs
vercel logs --follow

# Firebase logs
firebase functions:log
```

## 🎉 You're Done!

The registration system should now be operational. Users can:
- ✅ Register as managers or employees
- ✅ Receive verification emails
- ✅ Verify their email
- ✅ Log in and access their dashboard

All error handling, retry logic, and diagnostics are built-in.

---

**Next Steps:**
1. Monitor registration success rate
2. Collect user feedback
3. Review error logs daily
4. Set up automated alerts for high error rates

For detailed information, see: `REGISTRATION_DEPLOYMENT_GUIDE.md`
