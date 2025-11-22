import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration
// SECURITY: All Firebase credentials MUST come from environment variables
// No hardcoded fallback values to prevent credential exposure

// Strict validation: Check for required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
] as const;

const missingVars = requiredEnvVars.filter(key => !import.meta.env[key]);

if (missingVars.length > 0) {
  const errorMessage = `Missing required Firebase environment variables: ${missingVars.join(', ')}`;
  console.error('❌ Firebase Configuration Error:', errorMessage);
  console.error('   Please configure these variables in your Vercel Dashboard or .env file.');
  
  // In production, throw an error to fail the build
  if (import.meta.env.PROD) {
    throw new Error(errorMessage);
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase only if configuration is present
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;
let analytics: Analytics | undefined;

try {
  // Check if we have minimum required config
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    // Check if Firebase app is already initialized to prevent duplicate initialization errors
    const existingApps = getApps();
    if (existingApps.length > 0) {
      // Use the existing app instead of initializing a new one
      app = existingApps[0];
    } else {
      // Initialize new Firebase app
      app = initializeApp(firebaseConfig);
    }
    
    // Initialize Firebase services
    if (!app) {
      throw new Error('Firebase app initialization failed');
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    
    // Initialize Analytics only in browser environment (not in SSR)
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
  } else {
    console.warn('Firebase configuration incomplete. Running in mock mode.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Re-throw in production to ensure build fails with clear error
  if (import.meta.env.PROD) {
    throw error;
  }
}

export { auth, db, storage, functions, analytics };
export const isFirebaseConfigured = Boolean(app);
