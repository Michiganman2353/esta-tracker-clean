/**
 * @esta/firebase
 * 
 * Centralized Firebase package for ESTA Tracker
 * Single source of truth for all Firebase initialization and configuration.
 * 
 * This package provides:
 * - Client-side Firebase SDK (for frontend)
 * - Server-side Firebase Admin SDK (for backend)
 * - Environment validation
 * - Testing mocks
 * 
 * Frontend Usage:
 * ```typescript
 * import { app, auth, db } from '@esta/firebase';
 * 
 * // Use Firebase services directly
 * const user = auth.currentUser;
 * const docRef = doc(db, 'users', userId);
 * ```
 * 
 * Backend Usage:
 * ```typescript
 * import { initializeFirebaseAdmin, getFirestore, getAuth } from '@esta/firebase/admin';
 * 
 * // Initialize once at app startup
 * initializeFirebaseAdmin();
 * 
 * // Use throughout your app
 * const db = getFirestore();
 * const users = await db.collection('users').get();
 * ```
 */

// ==================== CLIENT-SIDE EXPORTS ====================
// These are for frontend use with Firebase Web SDK

export {
  initializeFirebase,
  getApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
  resetFirebase,
} from './firebase-app.js';

// Export initialized instances for convenience
import { getApp, getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage } from './firebase-app.js';

// These will be lazy-initialized when accessed
export let app: ReturnType<typeof getApp> | null = null;
export let auth: ReturnType<typeof getFirebaseAuth> | null = null;
export let db: ReturnType<typeof getFirebaseFirestore> | null = null;
export let storage: ReturnType<typeof getFirebaseStorage> | null = null;

// Lazy initialization helpers
function ensureInitialized() {
  if (!app) {
    app = getApp();
    auth = getFirebaseAuth();
    db = getFirebaseFirestore();
    storage = getFirebaseStorage();
  }
}

// Initialize on import if in browser environment
if (typeof window !== 'undefined') {
  try {
    ensureInitialized();
  } catch (error) {
    // Environment variables not available yet, will initialize when needed
    console.warn('Firebase not initialized on import, will initialize when accessed');
  }
}

// Re-export common Firebase client types for convenience
export type { FirebaseApp, FirebaseOptions } from 'firebase/app';
export type { Auth, User } from 'firebase/auth';
export type { Firestore, DocumentReference, CollectionReference, QuerySnapshot } from 'firebase/firestore';
export type { FirebaseStorage, StorageReference } from 'firebase/storage';
