# Firebase Setup Guide for ESTA Tracker

This guide walks you through setting up Firebase Authentication, Firestore, and Cloud Functions for the ESTA Tracker application.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Firebase account (free tier is sufficient for development)

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `esta-tracker` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, navigate to **Build → Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"

## Step 3: Create Firestore Database

1. Navigate to **Build → Firestore Database**
2. Click "Create database"
3. Select location closest to your users (e.g., `us-central` for US)
4. Start in **Production mode** (we'll deploy security rules separately)
5. Click "Enable"

## Step 4: Set Up Cloud Storage

1. Navigate to **Build → Storage**
2. Click "Get started"
3. Start in **Production mode**
4. Use same location as Firestore
5. Click "Done"

## Step 5: Get Firebase Configuration

### For Frontend (Web App)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register app with nickname: `esta-tracker-web`
5. Copy the configuration object

### For Backend (Service Account)

1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file securely (DO NOT commit to git)
4. Rename it to `.serviceAccountKey.json` in project root (already gitignored)

## Step 6: Configure Environment Variables

### Frontend (.env.local)

Create `/packages/frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your-api-key-from-step-5
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Backend (.env)

Create `/.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT=path/to/.serviceAccountKey.json
```

## Step 7: Initialize Firebase in Project

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# - Firestore
# - Functions
# - Storage
# - Emulators

# Use existing project: select your project from step 1
# Use default options for most questions
# For Functions: choose TypeScript, ESLint yes, install dependencies yes
```

## Step 8: Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

## Step 9: Deploy Cloud Functions

```bash
# Install function dependencies
cd functions
npm install

# Build functions
npm run build

# Deploy
cd ..
firebase deploy --only functions
```

## Step 10: Test Locally with Emulators

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start the app
npm run dev

# Access emulator UI at: http://localhost:4000
```

## Step 11: Configure Email Templates (Optional)

1. Navigate to **Authentication → Templates**
2. Customize email verification template:
   - Email subject: "Verify your ESTA Tracker email"
   - Add company branding/logo
   - Update action URL if using custom domain

## Production Deployment

### Vercel (Frontend)

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   - All `VITE_FIREBASE_*` variables from step 6
   - `VITE_API_URL` (your backend URL)

### Cloud Functions (Backend)

```bash
# Deploy to production
firebase deploy --only functions --project production
```

## Troubleshooting

### "Firebase not configured" error

- Check that all environment variables are set correctly
- Verify `.env.local` file exists in `/packages/frontend`
- Restart dev server after changing env variables

### Authentication errors

- Check that Email/Password is enabled in Firebase Console
- Verify API key is correct
- Check browser console for detailed error messages

### Firestore permission denied

- Deploy security rules: `firebase deploy --only firestore:rules`
- Check rules syntax in `firestore.rules`
- Test rules in Firebase Console → Firestore → Rules → Simulator

### Cloud Functions not working

- Check function logs: `firebase functions:log`
- Verify functions are deployed: `firebase deploy --only functions`
- Check Node.js version matches `functions/package.json` engines

## Security Best Practices

1. **Never commit service account keys** - Already in `.gitignore`
2. **Use environment variables** - Never hardcode credentials
3. **Enable App Check** (production) - Protect against abuse
4. **Review security rules** - Ensure proper access control
5. **Monitor usage** - Set up billing alerts
6. **Rotate keys regularly** - Generate new service accounts periodically

## Next Steps

1. ✅ Test registration flow with email verification
2. ✅ Test login with verified accounts
3. ✅ Verify custom claims are set correctly
4. ✅ Test tenant isolation in Firestore
5. ✅ Configure email templates in Firebase Console
6. 🚀 Deploy to production

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Auth](https://firebase.google.com/docs/auth)

## Support

For issues or questions:
- Check Firebase Console → Support
- Review error logs in Firebase Console
- Test with Firebase Emulators for debugging
