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
 * 
 * Testing:
 * In test environments (detected via VITEST, JEST_WORKER_ID, or NODE_ENV=test),
 * this module exports null for all Firebase instances. Tests should mock this
 * module using vi.mock() or jest.mock() to provide their own implementations.
 * 
 * ```typescript
 * vi.mock('@esta/firebase', () => ({
 *   app: {},
 *   auth: { currentUser: null },
 *   db: {},
 *   storage: {},
 *   analytics: null,
 * }));
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

/**
 * Flag to track if we're in test mode and should skip eager initialization
 * In test environments, the module exports null and should be mocked before any Firebase calls
 */
const inTestEnv = isTestEnvironment();

// These will be lazy-initialized when accessed
let _app: ReturnType<typeof getApp> | null = null;
let _auth: ReturnType<typeof getFirebaseAuth> | null = null;
let _db: ReturnType<typeof getFirebaseFirestore> | null = null;
let _storage: ReturnType<typeof getFirebaseStorage> | null = null;

/**
 * Lazy initialization helper
 * Only initializes Firebase when actually needed
 * Skips initialization entirely in test environments
 */
function ensureInitialized(): void {
  if (inTestEnv) {
    // In test environments, skip initialization
    // Tests should mock this module entirely
    return;
  }
  if (!_app) {
    _app = getApp();
    _auth = getFirebaseAuth();
    _db = getFirebaseFirestore();
    _storage = getFirebaseStorage();
  }
}

/**
 * Helper to get a Firebase instance, returning null in test environments
 * @param getter Function to get the cached instance
 */
function getInstanceOrNull<T>(getter: () => T | null): T | null {
  if (inTestEnv) {
    return null;
  }
  ensureInitialized();
  return getter();
}

// Export Firebase instances
// In production: These will be lazily initialized on first access
// In test environments: These will be null, and should be mocked
export const app = getInstanceOrNull(() => _app);
export const auth = getInstanceOrNull(() => _auth);
export const db = getInstanceOrNull(() => _db);
export const storage = getInstanceOrNull(() => _storage);
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
