/**
 * Firebase initialization for API routes
 * 
 * Re-exports Firebase Admin SDK from centralized @esta/firebase package.
 * Maintains backward compatibility with existing API code.
 */

import { 
  initializeFirebaseAdmin,
  getAuth,
  getFirestore,
} from '@esta/firebase/admin';

// Initialize Firebase Admin on import
initializeFirebaseAdmin();

/**
 * Initialize Firebase Admin SDK
 * Singleton pattern to ensure only one instance
 */
export function initializeFirebase(): void {
  // Initialization is already handled by the centralized package
  initializeFirebaseAdmin();
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth() {
  return getAuth();
}

/**
 * Get Firestore instance
 */
export function getFirebaseDb() {
  return getFirestore();
}

/**
 * Generate unique ID for entities
 */
export function generateId(prefix: string): string {
  // Use timestamp + random suffix to prevent collisions
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}
