# @esta/firebase

Centralized Firebase service for ESTA Tracker - the single source of truth for all Firebase initialization and configuration across the monorepo.

## 🎯 Purpose

This package provides a unified, type-safe Firebase integration that:
- **Prevents duplicate initialization** - Firebase is initialized exactly once
- **Validates environment variables** - Fails fast if configuration is missing
- **Provides testing mocks** - No more hitting real Firebase in tests
- **Supports both client and server** - One package for frontend and backend
- **Is modular and maintainable** - Clean separation of concerns

## 🚀 Usage

### Frontend (Client-Side)

```typescript
import { app, auth, db, storage } from '@esta/firebase';

// Use Firebase services directly
const user = auth.currentUser;
```

### Backend (Server-Side)

```typescript
import { initializeFirebaseAdmin, getFirestore, getAuth } from '@esta/firebase/admin';

// Initialize once at app startup
initializeFirebaseAdmin();

// Use throughout your app
const db = getFirestore();
```

### Testing

```typescript
import { mockApp, mockAuth, mockDb, mockStorage } from '@esta/firebase/testing';
```

See full documentation inside this README file for complete usage examples and migration guides.
