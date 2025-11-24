/**
 * KMS-Backed Hybrid Encryption Module
 * 
 * Implements production-grade hybrid encryption using Google Cloud KMS:
 * - AES-256-GCM for data encryption (symmetric, fast, authenticated)
 * - KMS asymmetric keys for AES key wrapping (secure key management)
 * 
 * This module provides a drop-in replacement for the local RSA encryption
 * with the security benefits of Cloud KMS.
 * 
 * @module kmsHybridEncryption
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { kmsService, KMSEncryptionResult } from './kmsService';

/**
 * AES-GCM encryption result
 */
interface AESEncryptionResult {
  encryptedData: Buffer;
  iv: Buffer;
  authTag: Buffer;
  aesKey: Buffer;
}

/**
 * Hybrid decryption payload
 */
export interface KMSDecryptionPayload {
  encryptedData: string;      // Base64 AES-encrypted data
  encryptedAESKey: string;    // Base64 KMS-encrypted AES key
  iv: string;                 // Base64 initialization vector
  authTag: string;            // Base64 authentication tag
  keyPath?: string;           // KMS key path used for encryption
  keyVersion?: string;        // KMS key version used
}

/**
 * Encrypt data using AES-256-GCM
 * 
 * @param data - Data to encrypt (string or Buffer)
 * @param aesKey - 256-bit AES key (32 bytes)
 * @returns AES encryption result
 */
function encryptWithAES(data: string | Buffer, aesKey?: Buffer): AESEncryptionResult {
  // Generate random AES key if not provided
  const key = aesKey || randomBytes(32); // 256 bits
  
  // Generate random IV (12 bytes recommended for GCM)
  const iv = randomBytes(12);
  
  // Convert string to buffer if needed
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  
  // Create cipher
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt data
  const encrypted = Buffer.concat([
    cipher.update(dataBuffer),
    cipher.final()
  ]);
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedData: encrypted,
    iv,
    authTag,
    aesKey: key
  };
}

/**
 * Decrypt data using AES-256-GCM
 * 
 * @param encryptedData - Encrypted data buffer
 * @param aesKey - 256-bit AES key (32 bytes)
 * @param iv - Initialization vector
 * @param authTag - Authentication tag
 * @returns Decrypted data as Buffer
 */
function decryptWithAES(
  encryptedData: Buffer,
  aesKey: Buffer,
  iv: Buffer,
  authTag: Buffer
): Buffer {
  // Create decipher
  const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
  
  // Set authentication tag
  decipher.setAuthTag(authTag);
  
  // Decrypt data
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);
  
  return decrypted;
}

/**
 * Encrypt data using KMS-backed hybrid encryption
 * 
 * Process:
 * 1. Generate random AES-256 key
 * 2. Encrypt data with AES-256-GCM (fast, efficient)
 * 3. Encrypt AES key with KMS asymmetric key (secure key management)
 * 4. Return encrypted data + KMS-encrypted key + metadata
 * 
 * @param data - Data to encrypt (string or Buffer)
 * @param keyVersion - Optional KMS key version
 * @returns KMS hybrid encryption result
 * 
 * @example
 * ```typescript
 * const encrypted = await encryptWithKMS("sensitive data");
 * 
 * // Store encrypted result in database
 * await db.save({
 *   data: encrypted.encryptedData,
 *   key: encrypted.encryptedAESKey,
 *   iv: encrypted.iv,
 *   authTag: encrypted.authTag,
 *   keyPath: encrypted.keyPath
 * });
 * ```
 */
export async function encryptWithKMS(
  data: string | Buffer,
  keyVersion?: string
): Promise<KMSEncryptionResult> {
  try {
    // Step 1 & 2: Encrypt data with AES-GCM
    const aesResult = encryptWithAES(data);
    
    // Step 3: Encrypt AES key with KMS
    const encryptedAESKey = await kmsService.asymmetricEncrypt(aesResult.aesKey);
    
    // Get key information
    const keyInfo = await kmsService.getPublicKey(keyVersion);
    
    // Step 4: Return all components
    return {
      encryptedData: aesResult.encryptedData.toString('base64'),
      encryptedAESKey: encryptedAESKey,
      iv: aesResult.iv.toString('base64'),
      authTag: aesResult.authTag.toString('base64'),
      keyPath: keyInfo.keyPath,
      keyVersion: keyInfo.keyVersion
    };
  } catch (error) {
    console.error('KMS hybrid encryption failed:', error);
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data using KMS-backed hybrid decryption
 * 
 * Process:
 * 1. Decrypt AES key using KMS private key
 * 2. Decrypt data using recovered AES key
 * 3. Verify authentication tag (ensures data integrity)
 * 4. Return decrypted data
 * 
 * @param payload - KMS hybrid encryption payload
 * @returns Decrypted data as string
 * 
 * @example
 * ```typescript
 * const decrypted = await decryptWithKMS({
 *   encryptedData: "...",
 *   encryptedAESKey: "...",
 *   iv: "...",
 *   authTag: "...",
 *   keyVersion: "1"
 * });
 * console.log(decrypted); // "sensitive data"
 * ```
 */
export async function decryptWithKMS(
  payload: KMSDecryptionPayload
): Promise<string> {
  try {
    // Convert base64 strings to buffers
    const encryptedData = Buffer.from(payload.encryptedData, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    
    // Step 1: Decrypt AES key with KMS
    const aesKey = await kmsService.asymmetricDecrypt(
      payload.encryptedAESKey,
      payload.keyVersion
    );
    
    // Step 2: Decrypt data with AES
    const decryptedBuffer = decryptWithAES(encryptedData, aesKey, iv, authTag);
    
    // Step 3: Convert buffer to string
    return decryptedBuffer.toString('utf8');
  } catch (error) {
    console.error('KMS hybrid decryption failed:', error);
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt file or large binary data with KMS
 * 
 * @param data - Binary data to encrypt
 * @param keyVersion - Optional KMS key version
 * @returns KMS hybrid encryption result
 */
export async function encryptFileWithKMS(
  data: Buffer,
  keyVersion?: string
): Promise<KMSEncryptionResult> {
  return encryptWithKMS(data, keyVersion);
}

/**
 * Decrypt file or large binary data with KMS
 * 
 * @param payload - KMS hybrid encryption payload
 * @returns Decrypted binary data
 */
export async function decryptFileWithKMS(
  payload: KMSDecryptionPayload
): Promise<Buffer> {
  try {
    const encryptedData = Buffer.from(payload.encryptedData, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    
    const aesKey = await kmsService.asymmetricDecrypt(
      payload.encryptedAESKey,
      payload.keyVersion
    );
    
    return decryptWithAES(encryptedData, aesKey, iv, authTag);
  } catch (error) {
    console.error('KMS file decryption failed:', error);
    throw new Error(`File decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get KMS public key for client-side encryption
 * 
 * Clients can use this public key to encrypt data that only the server
 * can decrypt using KMS.
 * 
 * @param keyVersion - Optional KMS key version
 * @returns Public key in PEM format
 */
export async function getKMSPublicKey(keyVersion?: string): Promise<string> {
  const keyInfo = await kmsService.getPublicKey(keyVersion);
  return keyInfo.publicKey;
}

/**
 * Check if KMS hybrid encryption is available and configured
 * 
 * @returns true if KMS is ready
 */
export async function isKMSAvailable(): Promise<boolean> {
  return kmsService.healthCheck();
}
