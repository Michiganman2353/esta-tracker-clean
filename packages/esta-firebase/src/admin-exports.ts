/**
 * Firebase Admin SDK Exports
 * 
 * This file provides the Admin SDK exports for backend use.
 * Import from '@esta/firebase/admin' in your backend code.
 * 
 * Usage:
 * ```typescript
 * import { initializeFirebaseAdmin, getFirestore, getAuth } from '@esta/firebase/admin';
 * 
 * // Initialize once at app startup
 * initializeFirebaseAdmin();
 * 
 * // Use throughout your app
 * const db = getFirestore();
 * const auth = getAuth();
 * ```
 */

// Admin initialization
export {
  initializeFirebaseAdmin,
  getFirebaseApp,
  resetFirebaseAdmin,
  type FirebaseAdminConfig,
} from './admin-app.js';

// Firestore utilities
export {
  getFirestore,
  getDocRef,
  getCollectionRef,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from './firestore.js';

// Auth utilities
export {
  getAuth,
  verifyIdToken,
  getUserById,
  getUserByEmail,
  setCustomClaims,
  deleteUser,
  createUser,
  updateUser,
} from './auth.js';

// Storage utilities
export {
  getStorage,
  getBucket,
  getNamedBucket,
  getFile,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  deleteFile,
  fileExists,
} from './storage.js';

// Re-export common Firebase Admin types
export type {
  App,
  Credential,
  ServiceAccount,
} from 'firebase-admin/app';

export type {
  Firestore,
  DocumentReference,
  CollectionReference,
  DocumentSnapshot,
  QuerySnapshot,
  Query,
  FieldValue,
} from 'firebase-admin/firestore';

export type {
  Auth,
  UserRecord,
  DecodedIdToken,
  CreateRequest,
  UpdateRequest,
} from 'firebase-admin/auth';
