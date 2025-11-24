/**
 * Hybrid Encryption Module (Node.js Environment)
 * 
 * Implements industry-standard hybrid encryption using:
 * - AES-256-GCM for symmetric data encryption (fast, efficient)
 * - RSA-OAEP with SHA-256 for asymmetric key wrapping (secure key exchange)
 * 
 * This is the server-side implementation using Node.js crypto module.
 * For Edge/client-side implementation, see packages/frontend/src/lib/edgeCrypto/
 * 
 * @module hybridEncryption
 */

import { createCipheriv, createDecipheriv, randomBytes, generateKeyPairSync, publicEncrypt, privateDecrypt, constants } from 'crypto';

/**
 * RSA key pair for asymmetric encryption
 */
export interface RSAKeyPair {
  publicKey: string;  // PEM format
  privateKey: string; // PEM format
}

/**
 * AES-GCM encryption result
 */
export interface AESEncryptionResult {
  encryptedData: Buffer;
  iv: Buffer;
  authTag: Buffer;
  aesKey: Buffer;
}

/**
 * Complete hybrid encryption result
 */
export interface HybridEncryptionResult {
  encryptedData: string;      // Base64 encoded encrypted data
  encryptedAESKey: string;    // Base64 encoded RSA-encrypted AES key
  iv: string;                 // Base64 encoded initialization vector
  authTag: string;            // Base64 encoded authentication tag
}

/**
 * Decryption payload structure
 */
export interface HybridDecryptionPayload {
  encryptedData: string;      // Base64 encoded encrypted data
  encryptedAESKey: string;    // Base64 encoded RSA-encrypted AES key
  iv: string;                 // Base64 encoded initialization vector
  authTag: string;            // Base64 encoded authentication tag
}

/**
 * Generate RSA key pair for hybrid encryption
 * 
 * @param keySize - RSA key size in bits (default: 2048, recommended: 2048-4096)
 * @returns RSA key pair in PEM format
 * 
 * @example
 * ```typescript
 * const { publicKey, privateKey } = generateKeyPair();
 * // Store privateKey securely (e.g., KMS, secure database)
 * // Share publicKey with clients for encryption
 * ```
 */
export function generateKeyPair(keySize: number = 2048): RSAKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: keySize,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return {
    publicKey,
    privateKey
  };
}

/**
 * Encrypt data using AES-256-GCM
 * 
 * AES-GCM provides both confidentiality and authenticity (AEAD cipher)
 * 
 * @param data - Data to encrypt (string or Buffer)
 * @param aesKey - 256-bit AES key (32 bytes). If not provided, generates random key
 * @returns AES encryption result
 * 
 * @private
 */
function encryptWithAES(data: string | Buffer, aesKey?: Buffer): AESEncryptionResult {
  // Generate random AES key if not provided
  const key = aesKey || randomBytes(32); // 256 bits
  
  // Generate random IV (12 bytes is recommended for GCM)
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
 * 
 * @throws Error if authentication fails or decryption fails
 * @private
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
 * Encrypt AES key with RSA public key
 * 
 * Uses RSA-OAEP with SHA-256 for secure key wrapping
 * 
 * @param aesKey - AES key to encrypt
 * @param publicKey - RSA public key in PEM format
 * @returns Encrypted AES key
 * 
 * @private
 */
function encryptAESKey(aesKey: Buffer, publicKey: string): Buffer {
  return publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    aesKey
  );
}

/**
 * Decrypt AES key with RSA private key
 * 
 * @param encryptedAESKey - RSA-encrypted AES key
 * @param privateKey - RSA private key in PEM format
 * @returns Decrypted AES key
 * 
 * @throws Error if decryption fails
 * @private
 */
function decryptAESKey(encryptedAESKey: Buffer, privateKey: string): Buffer {
  return privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    encryptedAESKey
  );
}

/**
 * Encrypt data using hybrid encryption (AES-GCM + RSA-OAEP)
 * 
 * Process:
 * 1. Generate random AES-256 key
 * 2. Encrypt data with AES-256-GCM (fast, efficient)
 * 3. Encrypt AES key with RSA-OAEP (secure key exchange)
 * 4. Return encrypted data + encrypted key + metadata
 * 
 * @param data - Data to encrypt (string or Buffer)
 * @param publicKey - RSA public key in PEM format
 * @returns Hybrid encryption result with all components
 * 
 * @example
 * ```typescript
 * const { publicKey, privateKey } = generateKeyPair();
 * const encrypted = encryptHybrid("sensitive data", publicKey);
 * 
 * // Store encrypted.encryptedData and encrypted.encryptedAESKey
 * // Later decrypt with privateKey
 * const decrypted = decryptHybrid(encrypted, privateKey);
 * ```
 */
export function encryptHybrid(
  data: string | Buffer,
  publicKey: string
): HybridEncryptionResult {
  // Step 1 & 2: Encrypt data with AES-GCM
  const aesResult = encryptWithAES(data);
  
  // Step 3: Encrypt AES key with RSA
  const encryptedAESKey = encryptAESKey(aesResult.aesKey, publicKey);
  
  // Step 4: Return all components in base64 format
  return {
    encryptedData: aesResult.encryptedData.toString('base64'),
    encryptedAESKey: encryptedAESKey.toString('base64'),
    iv: aesResult.iv.toString('base64'),
    authTag: aesResult.authTag.toString('base64')
  };
}

/**
 * Decrypt data using hybrid decryption (RSA-OAEP + AES-GCM)
 * 
 * Process:
 * 1. Decrypt AES key using RSA private key
 * 2. Decrypt data using recovered AES key
 * 3. Verify authentication tag (ensures data integrity)
 * 4. Return decrypted data
 * 
 * @param payload - Hybrid encryption payload
 * @param privateKey - RSA private key in PEM format
 * @returns Decrypted data as string
 * 
 * @throws Error if RSA decryption fails, authentication fails, or data is corrupted
 * 
 * @example
 * ```typescript
 * const decrypted = decryptHybrid({
 *   encryptedData: "...",
 *   encryptedAESKey: "...",
 *   iv: "...",
 *   authTag: "..."
 * }, privateKey);
 * console.log(decrypted); // "sensitive data"
 * ```
 */
export function decryptHybrid(
  payload: HybridDecryptionPayload,
  privateKey: string
): string {
  // Convert base64 strings to buffers
  const encryptedData = Buffer.from(payload.encryptedData, 'base64');
  const encryptedAESKey = Buffer.from(payload.encryptedAESKey, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  
  // Step 1: Decrypt AES key with RSA
  const aesKey = decryptAESKey(encryptedAESKey, privateKey);
  
  // Step 2: Decrypt data with AES
  const decryptedBuffer = decryptWithAES(encryptedData, aesKey, iv, authTag);
  
  // Step 3: Convert buffer to string
  return decryptedBuffer.toString('utf8');
}

/**
 * Encrypt a file or large binary data
 * 
 * @param data - Binary data to encrypt
 * @param publicKey - RSA public key in PEM format
 * @returns Hybrid encryption result
 * 
 * @example
 * ```typescript
 * import { readFile } from 'fs/promises';
 * 
 * const fileData = await readFile('sensitive.pdf');
 * const encrypted = encryptFileData(fileData, publicKey);
 * 
 * // Store encrypted result
 * // Later decrypt with decryptFileData
 * ```
 */
export function encryptFileData(
  data: Buffer,
  publicKey: string
): HybridEncryptionResult {
  return encryptHybrid(data, publicKey);
}

/**
 * Decrypt file or large binary data
 * 
 * @param payload - Hybrid encryption payload
 * @param privateKey - RSA private key in PEM format
 * @returns Decrypted binary data
 * 
 * @example
 * ```typescript
 * const decryptedData = decryptFileData({
 *   encryptedData: "...",
 *   encryptedAESKey: "...",
 *   iv: "...",
 *   authTag: "..."
 * }, privateKey);
 * 
 * // Write to file
 * await writeFile('decrypted.pdf', decryptedData);
 * ```
 */
export function decryptFileData(
  payload: HybridDecryptionPayload,
  privateKey: string
): Buffer {
  // Same process but return Buffer instead of string
  const encryptedData = Buffer.from(payload.encryptedData, 'base64');
  const encryptedAESKey = Buffer.from(payload.encryptedAESKey, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  
  const aesKey = decryptAESKey(encryptedAESKey, privateKey);
  return decryptWithAES(encryptedData, aesKey, iv, authTag);
}
