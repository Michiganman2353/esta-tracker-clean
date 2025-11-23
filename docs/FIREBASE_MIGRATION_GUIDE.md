# Firebase Migration Guide

## Overview

The ESTA Tracker monorepo now uses a centralized Firebase package (`@esta/firebase`) that provides:
- Single source of truth for Firebase initialization
- Support for both client-side (Web SDK) and server-side (Admin SDK)
- Comprehensive testing mocks
- Environment variable validation
- Type-safe exports

## Quick Start

### For Frontend Developers

**Old Way:**
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
```

**New Way:**
```typescript
import { app, auth, db, storage } from '@esta/firebase';
// That's it! Everything is pre-initialized and ready to use
```

### For Backend/API Developers

**Old Way:**
```typescript
import admin from 'firebase-admin';
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
```

**New Way:**
```typescript
import { initializeFirebaseAdmin, getFirestore, getAuth } from '@esta/firebase/admin';

// Initialize once at app startup
initializeFirebaseAdmin();

// Use throughout your app
const db = getFirestore();
const auth = getAuth();
```

### For Test Writers

**Old Way:**
Tests would fail with missing environment variables or would hit real Firebase.

**New Way:**
```typescript
import { vi } from 'vitest';
import { mockApp, mockAuth, mockDb, mockStorage } from '@esta/firebase/testing';

// Mock Firebase in your test setup
vi.mock('@esta/firebase', () => ({
  app: mockApp,
  auth: mockAuth,
  db: mockDb,
  storage: mockStorage,
}));

// Now your tests never hit real Firebase
test('user login', async () => {
  const result = await mockAuth.signInWithEmailAndPassword('test@test.com', 'pass');
  expect(result.user.uid).toBe('test-uid');
});
```

## Environment Variables

### Frontend (Required)

Add these to your `.env` file:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

Get these from: Firebase Console → Project Settings → Your apps → Web app

### Backend (Required)

Add these to your server environment:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Choose ONE of these authentication methods:

# Option 1: Service Account JSON (for Vercel, Docker, etc.)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Option 2: Path to service account file (for local dev)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Migration Checklist

### Frontend Package Migration

- [ ] Add `@esta/firebase` dependency to `package.json`
- [ ] Replace Firebase initialization code with imports from `@esta/firebase`
- [ ] Update all `firebase/auth` imports to use the pre-configured `auth` instance
- [ ] Update all `firebase/firestore` imports to use the pre-configured `db` instance
- [ ] Update all `firebase/storage` imports to use the pre-configured `storage` instance
- [ ] Remove manual Firebase configuration code
- [ ] Ensure `.env` has all required `VITE_FIREBASE_*` variables
- [ ] Test locally with `npm run dev`
- [ ] Run tests with `npm run test`

### Backend/API Migration

- [ ] Add `@esta/firebase` dependency to `package.json`
- [ ] Replace `firebase-admin` initialization with `@esta/firebase/admin` imports
- [ ] Update admin.firestore() calls to `getFirestore()`
- [ ] Update admin.auth() calls to `getAuth()`
- [ ] Update admin.storage() calls to `getStorage()`
- [ ] Ensure environment has `FIREBASE_PROJECT_ID` and credential method
- [ ] Test API endpoints locally
- [ ] Verify deployment configuration has environment variables

### Testing Migration

- [ ] Create test setup file (e.g., `vitest.setup.ts`)
- [ ] Import and configure mocks from `@esta/firebase/testing`
- [ ] Remove any manual Firebase mock implementations
- [ ] Update tests to use the provided mocks
- [ ] Run test suite: `npm run test`
- [ ] Verify no tests hit real Firebase

## Common Issues & Solutions

### Issue: "Missing required Firebase environment variables"

**Solution:** Ensure all `VITE_FIREBASE_*` variables (frontend) or `FIREBASE_*` variables (backend) are set in your environment.

For local development:
```bash
cp .env.example .env
# Then fill in your Firebase credentials
```

### Issue: Tests failing with Firebase initialization errors

**Solution:** Use the testing mocks:

```typescript
import { vi } from 'vitest';
import { mockAuth, mockDb } from '@esta/firebase/testing';

vi.mock('@esta/firebase', () => ({
  auth: mockAuth,
  db: mockDb,
}));
```

### Issue: TypeScript errors about Firebase types

**Solution:** The package re-exports common Firebase types:

```typescript
import type { User, Auth } from '@esta/firebase';
import type { Firestore, DocumentReference } from '@esta/firebase';
```

### Issue: Firebase initialized twice

**Solution:** The centralized package ensures Firebase is only initialized once. If you see multiple initialization logs, you may have leftover manual initialization code. Remove it and use only the centralized package.

## Best Practices

### 1. Never Initialize Firebase Manually

❌ **Don't do this:**
```typescript
import { initializeApp } from 'firebase/app';
const app = initializeApp(config);
```

✅ **Do this:**
```typescript
import { app } from '@esta/firebase';
```

### 2. Use the Pre-Configured Instances

❌ **Don't do this:**
```typescript
import { getAuth } from 'firebase/auth';
const auth = getAuth();
```

✅ **Do this:**
```typescript
import { auth } from '@esta/firebase';
```

### 3. Use Mocks in Tests

❌ **Don't do this:**
```typescript
// Tests hitting real Firebase
test('create user', async () => {
  await auth.createUser(...); // Hits production!
});
```

✅ **Do this:**
```typescript
import { mockAuth } from '@esta/firebase/testing';
test('create user', async () => {
  await mockAuth.createUser(...); // Mocked, safe
});
```

### 4. Keep Environment Variables Secure

❌ **Never:**
- Commit `.env` files to git
- Share service account JSON publicly
- Include credentials in code

✅ **Always:**
- Use `.env.example` as a template
- Store production credentials in Vercel/Netlify/etc.
- Use environment variables

## Package Exports

The `@esta/firebase` package provides three export paths:

### 1. Main Export (Client-Side)
```typescript
import { app, auth, db, storage } from '@esta/firebase';
```

### 2. Admin Export (Server-Side)
```typescript
import { 
  initializeFirebaseAdmin,
  getFirestore,
  getAuth,
  getStorage 
} from '@esta/firebase/admin';
```

### 3. Testing Export
```typescript
import { 
  mockApp,
  mockAuth,
  mockDb,
  mockStorage,
  resetMocks 
} from '@esta/firebase/testing';
```

## Getting Help

- **Package README**: `/packages/esta-firebase/README.md`
- **Example Usage**: See existing code in `/packages/frontend/src/` and `/api/lib/`
- **Environment Template**: `.env.example` at repository root

## Further Reading

- [Firebase Web SDK Documentation](https://firebase.google.com/docs/web/setup)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
