# ESTA Tracker - Complete Setup Guide

## 🎯 Quick Start (5 Minutes)

### Prerequisites
- **Node.js 22.x** (required - see `.nvmrc`)
- npm ≥10.0.0
- Firebase account (free tier works)
- Git

> ⚠️ **Important**: This project requires Node.js 22.x. Earlier versions are not supported.

### Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/Michiganman2353/esta-tracker-clean.git
cd esta-tracker-clean

# Install all dependencies
npm install
```

### Step 2: Firebase Setup (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable Authentication → Email/Password
4. Enable Firestore Database
5. Go to Project Settings → Service Accounts
6. Click "Generate New Private Key"
7. Save the JSON file as `.serviceAccountKey.json` in the project root
8. Copy your Web App config from Project Settings → General

### Step 3: Environment Configuration (1 minute)

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local with your Firebase credentials
nano .env.local  # or use your favorite editor
```

Update these values in `.env.local`:
```bash
# Required Firebase Configuration
# NOTE: This monorepo uses VITE_ prefix exclusively for all frontend environment variables
# REACT_APP_* and unprefixed FIREBASE_* variables are NOT supported
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend Firebase Project ID (server-side API use only)
FIREBASE_PROJECT_ID=your-project-id
```

### Step 4: Run the Application

```bash
# Start development server (frontend + backend)
npm run dev

# Or start separately:
npm run dev:frontend  # Frontend: http://localhost:5173
npm run dev:backend   # Backend: http://localhost:3001
```

### Step 5: Verify Installation

1. Open http://localhost:5173
2. Click "Register" → "Manager / Employer"
3. Fill out the registration form
4. If successful, you're all set! 🎉

---

## 📚 Detailed Setup

### Firebase Firestore Security Rules

Add these rules in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Users can read their own data
      allow read: if request.auth != null && request.auth.uid == userId;
      // Only system can write (via Admin SDK)
      allow write: if false;
    }
    
    // Employers collection
    match /employers/{employerId} {
      // Employers can read their own data
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.employerId == employerId;
      // Only system can write
      allow write: if false;
    }
  }
}
```

### Firebase Authentication Configuration

1. Go to Firebase Console → Authentication → Settings
2. Enable "Email enumeration protection" (recommended)
3. Set password requirements:
   - Minimum length: 8 characters
   - Require uppercase: No (for accessibility)
   - Require numbers: No (for accessibility)
   - Require special characters: No (for accessibility)

### Firestore Indexes (Optional - for performance)

Create these indexes in Firebase Console → Firestore Database → Indexes:

```
Collection: users
Fields: email (Ascending), status (Ascending)

Collection: employers
Fields: ownerId (Ascending), status (Ascending)
```

---

## 🧪 Testing Your Setup

### 1. Run Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
```

### 2. Check Build

```bash
# Build for production
npm run build

# Verify build output
ls -la apps/frontend/dist
```

### 3. Test API Endpoints

```bash
# Test registration endpoint
curl -X POST http://localhost:3000/api/v1/auth/register/manager \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpass123",
    "companyName": "Test Company",
    "employeeCount": 5
  }'
```

---

## 🚀 Deployment to Vercel

### Prerequisites
- Vercel account (free tier works)
- GitHub repository connected to Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Link Project

```bash
vercel link
```

### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

**Production Variables:**
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  # Entire JSON
ALLOWED_ORIGIN=https://your-domain.com

# Optional: Edge Config
EDGE_CONFIG=your-edge-config-connection-string
```

**Important:** Copy the entire contents of `.serviceAccountKey.json` as a single-line JSON string for `FIREBASE_SERVICE_ACCOUNT`.

### Step 4: Deploy

```bash
# Deploy to production
vercel --prod

# Or use GitHub integration (recommended)
git push origin main  # Automatic deployment via GitHub Actions
```

---

## 🔧 Troubleshooting

### Common Issues

**1. "Module not found" errors**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**2. "Firebase Admin SDK not initialized"**
- Verify `.serviceAccountKey.json` exists in project root
- Check that `FIREBASE_PROJECT_ID` is set correctly
- Ensure Firebase project has Firestore enabled

**3. "CORS error when calling API"**
- Check that frontend URL is in allowed origins (api/v1/auth/*.ts)
- Verify `CORS_ORIGIN` environment variable
- Make sure you're using http://localhost:5173 for frontend

**4. "Tests failing"**
```bash
# Reinstall dependencies
npm install

# Clear test cache
npm run test -- --clearCache

# Run tests in watch mode for debugging
npm run test -- --watch
```

**5. "Build fails in CI/CD"**
- Check GitHub Actions logs
- Verify all environment variables are set in GitHub Secrets
- Ensure `package-lock.json` is committed

**6. Registration fails silently**
- Open browser DevTools → Console
- Check Network tab for API errors
- Verify Firebase configuration in `.env.local`
- Check Firebase Console → Authentication for user creation

---

## 📖 Documentation Links

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Environment Variables](./.env.local.example) - All configuration options
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Deployment Guide](./DEPLOYMENT_TROUBLESHOOTING.md) - Deployment help

---

## 🎓 Architecture Overview

```
esta-tracker-clean/
├── packages/
│   ├── frontend/          # React + Vite frontend
│   ├── backend/           # Express API (for local dev)
│   ├── firebase/          # Firebase configuration
│   ├── shared-types/      # TypeScript types
│   └── shared-utils/      # Shared utilities
├── api/                   # Vercel serverless functions
│   └── v1/auth/          # Authentication endpoints
├── functions/             # Firebase Cloud Functions
└── scripts/               # Build & deployment scripts
```

### Key Technologies
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Express, Firebase Admin SDK
- **Database:** Firestore
- **Auth:** Firebase Authentication
- **Hosting:** Vercel (frontend + serverless API)
- **CI/CD:** GitHub Actions

---

## 🔐 Security Best Practices

1. **Never commit secrets:**
   - `.serviceAccountKey.json` is in `.gitignore`
   - Use environment variables for all secrets
   - Use GitHub Secrets for CI/CD

2. **Use HTTPS in production:**
   - Vercel automatically provides HTTPS
   - Never disable HTTPS redirects

3. **Keep dependencies updated:**
   ```bash
   npm audit
   npm update
   ```

4. **Review Firestore security rules:**
   - Test rules in Firebase Console
   - Use principle of least privilege

5. **Monitor Firebase usage:**
   - Check Firebase Console → Usage
   - Set up billing alerts

---

## 📊 Performance Optimization

### Frontend
- Code splitting with Vite
- Lazy loading routes
- Image optimization
- CSS minification

### Backend/API
- Firebase connection pooling
- Caching with Vercel Edge
- Serverless function optimization
- Database query optimization

---

## 🆘 Getting Help

1. **Check Documentation:**
   - Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
   - Review [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md)

2. **Search Issues:**
   - [GitHub Issues](https://github.com/Michiganman2353/esta-tracker-clean/issues)

3. **Create New Issue:**
   - Include error messages
   - Describe steps to reproduce
   - Share environment (OS, Node version, etc.)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Frontend loads at http://localhost:5173
- [ ] Backend API responds at http://localhost:3001/health
- [ ] Can register new manager account
- [ ] Can login with registered account
- [ ] Firestore shows user and employer documents
- [ ] All tests pass (`npm run test`)
- [ ] Build completes successfully (`npm run build`)
- [ ] No console errors in browser DevTools

---

## 🎯 Next Steps

Once setup is complete:

1. **Customize branding:**
   - Update colors in `tailwind.config.js`
   - Replace logo in `public/`
   - Update metadata in `index.html`

2. **Configure features:**
   - Set up Edge Config for feature flags
   - Configure email templates
   - Set up monitoring and analytics

3. **Deploy to production:**
   - Follow Vercel deployment guide
   - Set up custom domain
   - Configure SSL certificate

4. **Invite team members:**
   - Add collaborators in GitHub
   - Set up code review process
   - Configure branch protection rules

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Support

If this project helps you, please:
- ⭐ Star the repository
- 📢 Share with others
- 🐛 Report bugs
- 💡 Suggest features
- 🤝 Contribute code

---

**Built with ❤️ for Michigan small businesses**
