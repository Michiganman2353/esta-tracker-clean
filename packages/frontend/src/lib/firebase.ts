// packages/frontend/src/lib/firebase.ts
// Firebase initializer — uses VITE_ env vars exposed by Vite
// This file replaces older REACT_APP_* usage and will fail-fast during builds
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const _get = (k: string) => (import.meta.env as Record<string, string | undefined>)[k];

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missing = required.filter((k) => !_get(k));
if (missing.length) {
  // Fail early and loudly during build if envs are missing.
  // Vercel / Turborepo will show this message in logs so it's obvious why build failed.
  // NOTE: in local dev you should provide a .env file or set these variables in your shell.
  throw new Error(
    `Missing required VITE_ env variables for Firebase: ${missing.join(', ')}`
  );
}

const firebaseConfig = {
  apiKey: _get('VITE_FIREBASE_API_KEY')!,
  authDomain: _get('VITE_FIREBASE_AUTH_DOMAIN')!,
  projectId: _get('VITE_FIREBASE_PROJECT_ID')!,
  storageBucket: _get('VITE_FIREBASE_STORAGE_BUCKET')!,
  messagingSenderId: _get('VITE_FIREBASE_MESSAGING_SENDER_ID')!,
  appId: _get('VITE_FIREBASE_APP_ID')!,
};

// Initialize Firebase only once
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export const auth = getAuth();
export const db = getFirestore();
// Note: isFirebaseConfigured is always true because this module throws if vars are missing
// This export is kept for backward compatibility with existing code
export const isFirebaseConfigured = true;
