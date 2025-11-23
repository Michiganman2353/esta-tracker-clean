# ESTA Tracker - Quick Start Guide

This guide gets you up and running with ESTA Tracker in development mode.

## Prerequisites

- Node.js 20.x or higher
- npm 9.0.0 or higher
- A Firebase project (free tier is fine)
- A code editor (VS Code recommended)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/Michiganman2353/ESTA-Logic.git
cd ESTA-Logic

# Install dependencies
npm ci
```

## Step 2: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable **Authentication** → **Email/Password** sign-in method
4. Create a **Firestore Database** (start in test mode for development)
5. Get your Firebase configuration:
   - Click Settings (gear icon) → Project Settings
   - Scroll to "Your apps" section
   - If no web app exists, click "Add app" and choose Web
   - Copy the configuration values

## Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your Firebase config
# Use your favorite editor (nano, vim, code, etc.)
nano .env.local
```

Add your Firebase configuration:

```bash
# Frontend Firebase Config
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# API URL (for local development)
VITE_API_URL=http://localhost:3001

# Backend Firebase Project ID
FIREBASE_PROJECT_ID=your-project-id
```

## Step 4: Run the Application

### Option A: Run Everything (Frontend + Backend)

```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Option B: Run Frontend Only

```bash
npm run dev:frontend
```

Frontend will be available at: http://localhost:5173

### Option C: Run Backend Only

```bash
npm run dev:backend
```

Backend API will be available at: http://localhost:3001

## Step 5: Test the Application

### Run All Tests

```bash
npm run test
```

### Run Tests in Watch Mode

```bash
npm run test -- --watch
```

### Run Frontend Tests Only

```bash
npm run test:frontend
```

### Run Backend Tests Only

```bash
npm run test:backend
```

## Step 6: Try Registration

1. Open http://localhost:5173 in your browser
2. Click "Register" or navigate to http://localhost:5173/register
3. Choose "Manager/Employer" or "Employee"
4. Fill out the registration form
5. Submit and check the browser console for any errors

### Expected Behavior:
- ✅ User created in Firebase Authentication
- ✅ User document created in Firestore `users` collection
- ✅ For employers: Tenant document created in `tenants` collection
- ✅ User automatically approved (no email verification needed in dev)
- ✅ Redirected to dashboard

## Troubleshooting

### "Firebase not configured" Error

**Cause**: Missing or incorrect Firebase environment variables

**Fix**:
1. Check that `.env.local` exists
2. Verify all `VITE_FIREBASE_*` variables are set
3. Restart the dev server after changing `.env.local`

### Tests Failing

**Cause**: Usually cache or dependency issues

**Fix**:
```bash
# Clear all caches and reinstall
npm run clean
npm ci
npm run test
```

### Build Failing

**Cause**: TypeScript errors or missing dependencies

**Fix**:
```bash
# Check for errors
npm run lint
npm run typecheck

# Reinstall dependencies
rm -rf node_modules
npm ci
```

### Port Already in Use

**Cause**: Another process using port 5173 or 3001

**Fix**:
```bash
# Find and kill the process
lsof -ti:5173 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Or use different ports
PORT=3002 npm run dev:backend
```

### Registration Not Working

**Cause**: Usually Firebase configuration or rules

**Fix**:
1. Check Firebase Console → Authentication → Users
   - Is the user created?
2. Check Firebase Console → Firestore → Data
   - Is the user document created?
3. Check browser console for error messages
4. See `DEPLOYMENT_TROUBLESHOOTING.md` for detailed debugging

## Useful Commands

### Development

```bash
npm run dev              # Run frontend + backend
npm run dev:frontend     # Run frontend only
npm run dev:backend      # Run backend only
```

### Testing

```bash
npm run test            # Run all tests
npm run test:frontend   # Frontend tests only
npm run test:backend    # Backend tests only
npm run test:e2e        # End-to-end tests
npm run test:coverage   # Generate coverage report
```

### Building

```bash
npm run build           # Build all packages
npm run build:frontend  # Build frontend only
npm run build:backend   # Build backend only
```

### Code Quality

```bash
npm run lint           # Run ESLint
npm run typecheck      # Run TypeScript compiler
npm run ci:validate    # Run all validation checks
```

### Maintenance

```bash
npm run clean          # Clean all build artifacts
npm audit              # Check for security vulnerabilities
npm outdated           # Check for package updates
```

## Project Structure

```
ESTA-Logic/
├── packages/
│   ├── frontend/          # React + Vite frontend
│   ├── backend/           # Express backend (not used in Vercel)
│   ├── firebase/          # Firebase Admin SDK utilities
│   ├── shared-types/      # Shared TypeScript types
│   ├── shared-utils/      # Shared utility functions
│   ├── accrual-engine/    # ESTA sick time calculation logic
│   └── csv-processor/     # CSV import/export utilities
├── api/                   # Vercel serverless functions
├── functions/             # Firebase Cloud Functions
├── docs/                  # Documentation
└── scripts/               # Build and deployment scripts
```

## Next Steps

### For Development:
1. Explore the codebase structure
2. Read the documentation in `docs/`
3. Check out the component library in `packages/frontend/src/components`
4. Review the ESTA accrual logic in `packages/accrual-engine`

### For Deployment:
1. Read `DEPLOYMENT_TROUBLESHOOTING.md`
2. Set up Vercel account
3. Configure environment variables in Vercel
4. Deploy using GitHub integration or Vercel CLI

### For Contributing:
1. Read `CONTRIBUTING.md`
2. Create a feature branch
3. Write tests for your changes
4. Submit a pull request

## Getting Help

### Documentation Files:
- `README.md` - Project overview
- `DEPLOYMENT_TROUBLESHOOTING.md` - Deployment and troubleshooting
- `DIAGNOSTIC_SUMMARY.md` - Recent diagnostic findings
- `CONTRIBUTING.md` - Contribution guidelines
- `docs/` - Additional documentation

### Common Issues:
See `DEPLOYMENT_TROUBLESHOOTING.md` Section 8 for common error messages and solutions.

### Still Stuck?
1. Check browser console for errors
2. Check terminal for error messages
3. Review Firebase Console logs
4. Look for similar issues in closed GitHub issues
5. Create a new GitHub issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

## Success Checklist

- [ ] Node.js 20.x installed
- [ ] npm 9.0+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm ci`)
- [ ] Firebase project created
- [ ] `.env.local` configured with Firebase values
- [ ] Dev server running (`npm run dev`)
- [ ] App accessible at http://localhost:5173
- [ ] Tests passing (`npm run test`)
- [ ] Can register a test user successfully

Once all items are checked, you're ready to develop!

## Tips for Success

1. **Always use `npm ci`** instead of `npm install` for consistent dependencies
2. **Restart dev server** after changing `.env.local`
3. **Check browser console** for frontend errors
4. **Check terminal** for backend errors
5. **Run tests frequently** to catch issues early
6. **Clear cache** if you see weird behavior: `npm run clean`
7. **Keep dependencies updated** but test thoroughly after updates

## Quick Reference

| What | Command |
|------|---------|
| Start development | `npm run dev` |
| Run tests | `npm run test` |
| Check code quality | `npm run lint && npm run typecheck` |
| Build for production | `npm run build` |
| Validate everything | `npm run ci:validate` |
| Clean everything | `npm run clean` |

Happy coding! 🚀
