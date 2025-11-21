import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * Initialize Firebase Admin SDK
 * Singleton pattern to ensure only one instance
 */
export function initializeFirebase(): void {
  if (getApps().length > 0) {
    return; // Already initialized
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    // For local development, use default credentials
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  auth = getAuth(app);
  db = getFirestore(app);
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase();
    if (app) {
      auth = getAuth(app);
    } else {
      auth = getAuth();
    }
  }
  return auth;
}

/**
 * Get Firestore instance
 */
export function getFirebaseDb(): Firestore {
  if (!db) {
    initializeFirebase();
    if (app) {
      db = getFirestore(app);
    } else {
      db = getFirestore();
    }
  }
  return db;
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
