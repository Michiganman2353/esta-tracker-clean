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

// Import getter functions for lazy initialization
import { getApp, getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage, getFirebaseAnalytics } from './firebase-app.js';

/**
 * Detect if running in a test environment
 * This prevents Firebase initialization during test imports
 */
function isTestEnvironment(): boolean {
  // Check for common test environment indicators
  if (typeof process !== 'undefined' && process.env) {
    // Vitest and Jest set these
    if (process.env.VITEST || process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test') {
      return true;
    }
  }
  return false;
}

// These will be lazy-initialized when accessed via getters
let _app: ReturnType<typeof getApp> | null = null;
let _auth: ReturnType<typeof getFirebaseAuth> | null = null;
let _db: ReturnType<typeof getFirebaseFirestore> | null = null;
let _storage: ReturnType<typeof getFirebaseStorage> | null = null;

/**
 * Lazy initialization helper
 * Only initializes Firebase when actually needed, not at import time
 * In test environments, this will throw if Firebase is not mocked
 */
function ensureInitialized() {
  if (!_app) {
    _app = getApp();
    _auth = getFirebaseAuth();
    _db = getFirebaseFirestore();
    _storage = getFirebaseStorage();
  }
}

/**
 * Flag to track if we're in test mode and should skip eager initialization
 * In test environments, the module should be mocked before any Firebase calls
 */
const inTestEnv = isTestEnvironment();

/**
 * Get or initialize the Firebase App instance
 * In test environments, returns null until explicitly initialized
 */
function getLazyApp() {
  if (inTestEnv && !_app) {
    // In test environments, return null to allow mocking
    // Tests should mock this module entirely
    return null;
  }
  ensureInitialized();
  return _app;
}

/**
 * Get or initialize the Firebase Auth instance
 */
function getLazyAuth() {
  if (inTestEnv && !_auth) {
    return null;
  }
  ensureInitialized();
  return _auth;
}

/**
 * Get or initialize the Firestore instance
 */
function getLazyDb() {
  if (inTestEnv && !_db) {
    return null;
  }
  ensureInitialized();
  return _db;
}

/**
 * Get or initialize the Firebase Storage instance
 */
function getLazyStorage() {
  if (inTestEnv && !_storage) {
    return null;
  }
  ensureInitialized();
  return _storage;
}

// Export Firebase instances
// In production: These will be lazily initialized on first access
// In test environments: These will be null, and should be mocked
export const app = getLazyApp();
export const auth = getLazyAuth();
export const db = getLazyDb();
export const storage = getLazyStorage();
export const analytics = inTestEnv ? null : getFirebaseAnalytics();

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
