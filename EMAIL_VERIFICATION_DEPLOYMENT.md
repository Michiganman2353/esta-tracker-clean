# Email Verification System - Deployment Guide

This guide explains how to deploy the enhanced email verification system with Vercel API endpoints.

## Overview

The registration system now uses a hybrid approach:
- **Client-side**: Firebase Authentication for user creation and email verification
- **Server-side**: Vercel API endpoints for account activation and status checking
- **Cloud Functions**: Firebase Functions for additional features (optional)

## Architecture

```
User Registration Flow:
1. User fills form → Frontend (React)
2. Create Firebase Auth user → authService.ts
3. Create Firestore documents → authService.ts
4. Send verification email → Firebase Auth
5. User clicks email link → Firebase verifies email
6. Frontend detects verification → EmailVerification.tsx
7. Call /api/verifyUser → Vercel API
8. Set custom claims → Firebase Admin SDK
9. Redirect to login → User can access dashboard
```

## Prerequisites

1. **Firebase Project** with:
   - Authentication enabled
   - Firestore database created
   - Service account credentials

2. **Vercel Account** with:
   - Project connected to GitHub repo
   - Environment variables configured

## Step 1: Configure Firebase

### 1.1 Enable Email/Password Authentication

1. Go to Firebase Console → Authentication
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Save

### 1.2 Configure Email Templates

1. Go to Authentication → Templates
2. Click on "Email address verification"
3. Customize the email template (optional)
4. Ensure the action URL points to your app

### 1.3 Create Service Account

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 2: Set Environment Variables in Vercel

### 2.1 Navigate to Vercel Dashboard

1. Go to your project
2. Click "Settings"
3. Click "Environment Variables"

### 2.2 Add Firebase Admin Variables

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

**Important**: The private key must:
- Be wrapped in quotes
- Include `\n` for line breaks (not actual newlines)
- Include the BEGIN and END markers

### 2.3 Add Application URL

```env
APP_URL=https://your-app.vercel.app
```

This is used for email verification callback URLs.

### 2.4 Add Frontend Firebase Config

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub

```bash
git add .
git commit -m "Add email verification system"
git push origin main
```

### 3.2 Automatic Deployment

Vercel will automatically:
1. Detect the API functions in `/api` directory
2. Build the TypeScript files
3. Deploy them as serverless functions
4. Build and deploy the frontend

### 3.3 Verify Deployment

1. Check deployment logs in Vercel dashboard
2. Look for "Build successful"
3. Check that API routes are listed under Functions

## Step 4: Test the System

### 4.1 Test Registration

1. Go to `https://your-app.vercel.app/register/manager`
2. Fill out the form
3. Submit registration
4. Check that verification email is sent

### 4.2 Test Email Verification

1. Open the verification email
2. Click the verification link
3. Should redirect to login page
4. Check Firebase Console → Authentication
   - User should show "Verified" email

### 4.3 Test Login

1. Try to login with the registered account
2. Should redirect to dashboard
3. Check browser console for any errors

### 4.4 Test API Endpoints

**Check User Status:**
```bash
curl https://your-app.vercel.app/api/checkUserStatus?uid=USER_UID
```

**Verify User:**
```bash
curl -X POST https://your-app.vercel.app/api/verifyUser \
  -H "Content-Type: application/json" \
  -d '{"uid":"USER_UID"}'
```

## Step 5: Monitor and Debug

### 5.1 View API Logs

1. Go to Vercel Dashboard → Your Project
2. Click "Functions"
3. Click on a function to see logs
4. Check for errors or warnings

### 5.2 View Firebase Logs

1. Go to Firebase Console → Functions (if using Cloud Functions)
2. Click "Logs"
3. Check for authentication errors

### 5.3 Common Issues

#### Issue: "Firebase Admin not initialized"

**Cause**: Environment variables not set correctly

**Solution**:
1. Check Vercel environment variables
2. Ensure `FIREBASE_PRIVATE_KEY` has proper line breaks
3. Redeploy after updating variables

#### Issue: "Email not verified" even after clicking link

**Cause**: Firebase email verification not completing

**Solution**:
1. Check Firebase Console → Authentication → Templates
2. Verify action URL is correct
3. Check browser console for errors
4. Try resending verification email

#### Issue: "Custom claims not set"

**Cause**: `/api/verifyUser` not being called

**Solution**:
1. Check browser Network tab
2. Verify API endpoint is reachable
3. Check for CORS errors
4. Ensure polling is working in EmailVerification component

#### Issue: "CORS error" when calling API

**Cause**: Vercel routing not configured

**Solution**:
1. Check `vercel.json` has API rewrites
2. Ensure `"source": "/api/:path*"` is present
3. Redeploy after updating vercel.json

## Step 6: Production Checklist

### Security

- [ ] Firebase Security Rules are configured
- [ ] API endpoints validate input
- [ ] Private keys are stored in environment variables (not in code)
- [ ] CORS is properly configured
- [ ] Rate limiting is configured in Vercel

### Functionality

- [ ] Registration creates user in Firebase Auth
- [ ] Registration creates Firestore documents
- [ ] Verification email is sent
- [ ] Email verification activates account
- [ ] Custom claims are set after verification
- [ ] Login works after verification
- [ ] Unverified users cannot access dashboard

### Monitoring

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure Vercel log retention
- [ ] Set up uptime monitoring
- [ ] Create alerts for API errors

### Documentation

- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Add troubleshooting guide
- [ ] Document API endpoints

## Step 7: Optional Enhancements

### 7.1 Add Email Service

Replace Firebase's default email with custom service (SendGrid, Postmark):

1. Create email templates
2. Update `/api/register` to send custom emails
3. Include verification link in email body

### 7.2 Add Admin Approval Flow

Allow admins to manually approve users:

1. Keep status as "pending" after email verification
2. Create admin dashboard to review users
3. Call `/api/verifyUser` after admin approval

### 7.3 Add Email Resend Endpoint

Create `/api/resendVerification`:

```typescript
export default async function handler(req, res) {
  const { uid } = req.body;
  const user = await auth.getUser(uid);
  const link = await auth.generateEmailVerificationLink(user.email);
  // Send email with link
  return res.json({ success: true });
}
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Check Firebase Console for errors
4. Test API endpoints directly with curl
5. Enable verbose logging in development

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
