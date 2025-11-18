import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration
// Uses environment variables if available, falls back to production config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCWoqaXUc6ChNLQDBofkml_FgQsCmvAd-g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "esta-tracker.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "esta-tracker",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "esta-tracker.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "718800554935",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:718800554935:web:44e0da9f10c748848af632",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MRE9DR9ZPF"
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
}

export { auth, db, storage, functions, analytics };
export const isFirebaseConfigured = Boolean(app);
