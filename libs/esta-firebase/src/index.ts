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
  getFirebaseAnalytics,
  resetFirebase,
} from './firebase-app.js';

// Export initialized instances for convenience
import { getApp, getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage, getFirebaseAnalytics } from './firebase-app.js';

// These will be lazy-initialized when accessed via getters
let _app: ReturnType<typeof getApp> | null = null;
let _auth: ReturnType<typeof getFirebaseAuth> | null = null;
let _db: ReturnType<typeof getFirebaseFirestore> | null = null;
let _storage: ReturnType<typeof getFirebaseStorage> | null = null;

// Lazy initialization helpers
function ensureInitialized() {
  if (!_app) {
    _app = getApp();
    _auth = getFirebaseAuth();
    _db = getFirebaseFirestore();
    _storage = getFirebaseStorage();
  }
}

// Export getters instead of direct references to ensure initialization
export const app = (() => {
  ensureInitialized();
  return _app!;
})();

export const auth = (() => {
  ensureInitialized();
  return _auth!;
})();

export const db = (() => {
  ensureInitialized();
  return _db!;
})();

export const storage = (() => {
  ensureInitialized();
  return _storage!;
})();

// Analytics is optional and may be null
export const analytics = getFirebaseAnalytics();

// Re-export common Firebase client types for convenience
export type { FirebaseApp, FirebaseOptions } from 'firebase/app';
export type { Auth, User } from 'firebase/auth';
export type { Firestore, DocumentReference, CollectionReference, QuerySnapshot } from 'firebase/firestore';
export type { FirebaseStorage, StorageReference } from 'firebase/storage';
export type { Analytics } from 'firebase/analytics';

// Export employer profile helpers
export {
  generateEmployerCode,
  getEmployerProfileByCode,
  getEmployerProfileById,
  createEmployerProfile,
  updateEmployerBranding,
  linkEmployeeToEmployer,
  getEmployerEmployee,
  regenerateEmployerCode,
} from './employer-profile.js';
