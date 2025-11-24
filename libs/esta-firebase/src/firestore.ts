import admin from 'firebase-admin';
import { getFirebaseApp } from './admin-app.js';

/**
 * Firestore Service
 * Provides centralized Firestore access with utilities
 */

/**
 * Get Firestore instance
 * Automatically initializes Firebase Admin if needed
 * 
 * @returns Firestore instance
 */
export function getFirestore(): admin.firestore.Firestore {
  const app = getFirebaseApp();
  return app.firestore();
}

/**
 * Get a Firestore document reference
 * 
 * @param path - Document path (e.g., 'users/userId')
 * @returns Document reference
 */
export function getDocRef(path: string): admin.firestore.DocumentReference {
  const db = getFirestore();
  return db.doc(path);
}

/**
 * Get a Firestore collection reference
 * 
 * @param path - Collection path (e.g., 'users')
 * @returns Collection reference
 */
export function getCollectionRef(path: string): admin.firestore.CollectionReference {
  const db = getFirestore();
  return db.collection(path);
}

/**
 * Create a server timestamp
 * Used for createdAt, updatedAt fields
 * 
 * @returns Server timestamp
 */
export function serverTimestamp(): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.serverTimestamp();
}

/**
 * Array union operation for Firestore
 * 
 * @param elements - Elements to add to array
 * @returns FieldValue for array union
 */
export function arrayUnion(...elements: unknown[]): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.arrayUnion(...elements);
}

/**
 * Array remove operation for Firestore
 * 
 * @param elements - Elements to remove from array
 * @returns FieldValue for array remove
 */
export function arrayRemove(...elements: unknown[]): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.arrayRemove(...elements);
}

/**
 * Increment operation for Firestore
 * 
 * @param n - Number to increment by (default: 1)
 * @returns FieldValue for increment
 */
export function increment(n: number = 1): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.increment(n);
}
