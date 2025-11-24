import admin from 'firebase-admin';
import { getFirebaseApp } from './admin-app.js';

/**
 * Firebase Auth Service
 * Provides centralized Auth access with utilities
 */

/**
 * Get Firebase Auth instance
 * Automatically initializes Firebase Admin if needed
 * 
 * @returns Auth instance
 */
export function getAuth(): admin.auth.Auth {
  const app = getFirebaseApp();
  return app.auth();
}

/**
 * Verify an ID token and return decoded token
 * 
 * @param idToken - Firebase ID token from client
 * @returns Decoded token with user claims
 */
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const auth = getAuth();
  return auth.verifyIdToken(idToken);
}

/**
 * Get user by UID
 * 
 * @param uid - User ID
 * @returns User record
 */
export async function getUserById(uid: string): Promise<admin.auth.UserRecord> {
  const auth = getAuth();
  return auth.getUser(uid);
}

/**
 * Get user by email
 * 
 * @param email - User email
 * @returns User record
 */
export async function getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
  const auth = getAuth();
  return auth.getUserByEmail(email);
}

/**
 * Set custom claims for a user
 * Used for role-based access control
 * 
 * @param uid - User ID
 * @param claims - Custom claims object
 */
export async function setCustomClaims(uid: string, claims: Record<string, any>): Promise<void> {
  const auth = getAuth();
  await auth.setCustomUserClaims(uid, claims);
}

/**
 * Delete a user
 * 
 * @param uid - User ID
 */
export async function deleteUser(uid: string): Promise<void> {
  const auth = getAuth();
  await auth.deleteUser(uid);
}

/**
 * Create a new user
 * 
 * @param properties - User properties
 * @returns Created user record
 */
export async function createUser(properties: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
  const auth = getAuth();
  return auth.createUser(properties);
}

/**
 * Update user properties
 * 
 * @param uid - User ID
 * @param properties - Properties to update
 * @returns Updated user record
 */
export async function updateUser(uid: string, properties: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
  const auth = getAuth();
  return auth.updateUser(uid, properties);
}
