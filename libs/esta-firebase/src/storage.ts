import admin from 'firebase-admin';
import { getFirebaseApp } from './admin-app.js';

/**
 * Firebase Storage Service
 * Provides centralized Storage access with utilities
 */

/**
 * Get Firebase Storage instance
 * Automatically initializes Firebase Admin if needed
 * 
 * @returns Storage instance
 */
export function getStorage(): admin.storage.Storage {
  const app = getFirebaseApp();
  return app.storage();
}

/**
 * Get the default storage bucket
 * 
 * @returns Bucket instance
 */
export function getBucket() {
  const storage = getStorage();
  return storage.bucket();
}

/**
 * Get a specific storage bucket by name
 * 
 * @param bucketName - Bucket name
 * @returns Bucket instance
 */
export function getNamedBucket(bucketName: string) {
  const storage = getStorage();
  return storage.bucket(bucketName);
}

/**
 * Get a file reference from the default bucket
 * 
 * @param path - File path in storage
 * @returns File reference
 */
export function getFile(path: string) {
  const bucket = getBucket();
  return bucket.file(path);
}

/**
 * Generate a signed URL for file download
 * 
 * @param path - File path in storage
 * @param expiresInMinutes - URL expiration time in minutes (default: 60)
 * @returns Signed URL
 */
export async function getSignedDownloadUrl(
  path: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const file = getFile(path);
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
  return signedUrl;
}

/**
 * Generate a signed URL for file upload
 * 
 * @param path - File path in storage
 * @param contentType - File content type (e.g., 'image/jpeg')
 * @param expiresInMinutes - URL expiration time in minutes (default: 15)
 * @returns Signed URL
 */
export async function getSignedUploadUrl(
  path: string,
  contentType: string,
  expiresInMinutes: number = 15
): Promise<string> {
  const file = getFile(path);
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
    contentType,
  });
  return signedUrl;
}

/**
 * Delete a file from storage
 * 
 * @param path - File path in storage
 */
export async function deleteFile(path: string): Promise<void> {
  const file = getFile(path);
  await file.delete();
}

/**
 * Check if a file exists
 * 
 * @param path - File path in storage
 * @returns True if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  const file = getFile(path);
  const [exists] = await file.exists();
  return exists;
}
