import admin from 'firebase-admin';

/**
 * Firebase Admin SDK Service
 * Provides centralized Firebase Admin initialization and utilities
 * 
 * This module ensures Firebase Admin is initialized only once across
 * the entire application (backend, API functions, Cloud Functions)
 */

let firebaseApp: admin.app.App | null = null;

export interface FirebaseAdminConfig {
  projectId?: string;
  storageBucket?: string;
  serviceAccount?: string | admin.ServiceAccount;
  databaseURL?: string;
}

/**
 * Initialize Firebase Admin SDK with optional configuration
 * Safe to call multiple times - will return existing instance
 * 
 * @param config - Optional Firebase configuration
 * @returns Firebase Admin App instance
 */
export function initializeFirebaseAdmin(config?: FirebaseAdminConfig): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if already initialized by another module
    if (admin.apps.length > 0) {
      firebaseApp = admin.apps[0] as admin.app.App;
      console.log('✅ Firebase Admin already initialized, reusing instance');
      return firebaseApp;
    }

    // Determine credential source
    let credential: admin.credential.Credential;

    if (config?.serviceAccount) {
      // Use provided service account (JSON string or object)
      credential = typeof config.serviceAccount === 'string'
        ? admin.credential.cert(JSON.parse(config.serviceAccount))
        : admin.credential.cert(config.serviceAccount);
      console.log('🔑 Using provided service account credential');
    } else {
      // Use Application Default Credentials (ADC)
      // Works in Cloud Functions, Cloud Run, and local dev with GOOGLE_APPLICATION_CREDENTIALS
      credential = admin.credential.applicationDefault();
      console.log('🔑 Using Application Default Credentials');
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential,
      projectId: config?.projectId || process.env.FIREBASE_PROJECT_ID,
      storageBucket: config?.storageBucket || process.env.FIREBASE_STORAGE_BUCKET,
      databaseURL: config?.databaseURL,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`   Project ID: ${firebaseApp.options.projectId || 'default'}`);
    console.log(`   Storage Bucket: ${firebaseApp.options.storageBucket || 'default'}`);

    return firebaseApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the Firebase Admin app instance
 * Initializes if not already initialized
 * 
 * @returns Firebase Admin App instance
 */
export function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    return initializeFirebaseAdmin();
  }
  return firebaseApp;
}

/**
 * Reset Firebase Admin (useful for testing)
 * ⚠️ Only use in test environments
 */
export async function resetFirebaseAdmin(): Promise<void> {
  if (firebaseApp) {
    await firebaseApp.delete();
    firebaseApp = null;
    console.log('🧹 Firebase Admin instance reset');
  }
}
