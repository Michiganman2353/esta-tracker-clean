/**
 * Client-side Firebase App Initialization
 * 
 * This module initializes Firebase for client-side use (frontend)
 * using the Firebase Web SDK (not Admin SDK).
 */

import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

/**
 * Get environment variable - handles both Vite (import.meta.env) and Node (process.env)
 */
function getEnvVar(key: string): string | undefined {
  // Check Vite environment first (frontend)
  if (typeof import.meta !== 'undefined') {
    const meta = import.meta as { env?: Record<string, string | undefined> };
    if (meta.env && key in meta.env) {
      return meta.env[key];
    }
  }
  // Fallback to process.env (backend/test)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Validate required Firebase environment variables
 */
function validateFirebaseConfig(): void {
  const requiredEnvVars = [
    'API_KEY',
    'AUTH_DOMAIN',
    'PROJECT_ID',
    'STORAGE_BUCKET',
    'MESSAGING_SENDER_ID',
    'APP_ID'
  ] as const;

  const missingVars = requiredEnvVars.filter(key => {
    const envKey = `VITE_FIREBASE_${key}`;
    return !getEnvVar(envKey);
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missingVars.map(k => `VITE_FIREBASE_${k}`).join(', ')}`
    );
  }
}

/**
 * Get Firebase configuration from environment variables
 */
function getFirebaseConfig(): FirebaseOptions {
  validateFirebaseConfig();

  const config: FirebaseOptions = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY')!,
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN')!,
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID')!,
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET')!,
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID')!,
    appId: getEnvVar('VITE_FIREBASE_APP_ID')!,
  };

  // Add measurementId if provided (optional - for Firebase Analytics)
  const measurementId = getEnvVar('VITE_FIREBASE_MEASUREMENT_ID');
  if (measurementId) {
    config.measurementId = measurementId;
  }

  return config;
}

/**
 * Initialize Firebase App (client-side)
 * Safe to call multiple times - will return existing instance
 * 
 * @returns Firebase App instance
 */
export function initializeFirebase(): FirebaseApp {
  if (app) {
    return app;
  }

  // Check if already initialized by another module
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    app = existingApps[0];
    console.log('✅ Firebase already initialized, reusing instance');
    return app;
  }

  try {
    const firebaseConfig = getFirebaseConfig();
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
    console.log(`   Project ID: ${firebaseConfig.projectId}`);

    // Initialize Analytics only in browser environment and when supported
    // Note: Analytics initialization is intentionally async. getFirebaseAnalytics()
    // may return null during initialization or if analytics is not supported.
    // This is by design - analytics is optional and should not block app initialization.
    if (firebaseConfig.measurementId && typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
          console.log('✅ Firebase Analytics initialized');
        }
      }).catch(() => {
        // Analytics not supported in this environment (e.g., SSR, Node.js)
        console.log('ℹ️ Firebase Analytics not supported in this environment');
      });
    }

    return app;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    throw new Error(`Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get Firebase App instance
 * Initializes if not already initialized
 * 
 * @returns Firebase App instance
 */
export function getApp(): FirebaseApp {
  if (!app) {
    return initializeFirebase();
  }
  return app;
}

/**
 * Get Firebase Auth instance
 * Automatically initializes Firebase if needed
 * 
 * @returns Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
}

/**
 * Get Firestore instance
 * Automatically initializes Firebase if needed
 * 
 * @returns Firestore instance
 */
export function getFirebaseFirestore(): Firestore {
  if (!db) {
    const firebaseApp = getApp();
    db = getFirestore(firebaseApp);
  }
  return db;
}

/**
 * Get Firebase Storage instance
 * Automatically initializes Firebase if needed
 * 
 * @returns Storage instance
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    const firebaseApp = getApp();
    storage = getStorage(firebaseApp);
  }
  return storage;
}

/**
 * Get Firebase Analytics instance
 * Returns null if Analytics is not supported, not configured, or still initializing.
 * Analytics initialization is async to avoid blocking the app.
 * 
 * @returns Analytics instance or null
 */
export function getFirebaseAnalytics(): Analytics | null {
  return analytics;
}

/**
 * Reset Firebase (useful for testing)
 * ⚠️ Only use in test environments
 */
export function resetFirebase(): void {
  app = null;
  auth = null;
  db = null;
  storage = null;
  analytics = null;
  console.log('🧹 Firebase client instance reset');
}
