/**
 * Edge-Safe Hybrid Encryption Module (Web Crypto API)
 * 
 * Implements industry-standard hybrid encryption using Web Crypto API:
 * - AES-256-GCM for symmetric data encryption (fast, efficient)
 * - RSA-OAEP with SHA-256 for asymmetric key wrapping (secure key exchange)
 * 
 * This module is Edge-compatible and works in:
 * - Modern browsers
 * - Vercel Edge Functions
 * - Cloudflare Workers
 * - Deno Deploy
 * 
 * Uses ONLY crypto.subtle (Web Crypto API), NOT node:crypto
 * 
 * @module edgeHybrid
 */

/**
 * RSA key pair for asymmetric encryption (CryptoKey format)
 */
export interface EdgeRSAKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

/**
 * Exportable RSA key pair (JWK format for storage/transmission)
 */
export interface ExportableEdgeRSAKeyPair {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

/**
 * Complete hybrid encryption result
 */
export interface EdgeHybridEncryptionResult {
  encryptedData: string;      // Base64 encoded encrypted data
  encryptedAESKey: string;    // Base64 encoded RSA-encrypted AES key
  iv: string;                 // Base64 encoded initialization vector
}

/**
 * Decryption payload structure
 */
export interface EdgeHybridDecryptionPayload {
  encryptedData: string;      // Base64 encoded encrypted data
  encryptedAESKey: string;    // Base64 encoded RSA-encrypted AES key
  iv: string;                 // Base64 encoded initialization vector
}

/**
 * Generate RSA key pair for hybrid encryption using Web Crypto API
 * 
 * @param keySize - RSA key size in bits (default: 2048, recommended: 2048-4096)
 * @returns Promise<EdgeRSAKeyPair> - RSA key pair as CryptoKey objects
 * 
 * @example
 * ```typescript
 * const keyPair = await generateEdgeRSAKeys();
 * // Export for storage
 * const exported = await exportEdgeRSAKeyPair(keyPair);
 * ```
 */
export async function generateEdgeRSAKeys(keySize: number = 2048): Promise<EdgeRSAKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: keySize,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256'
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey
  };
}

/**
 * Export RSA key pair to JWK format for storage/transmission
 * 
 * @param keyPair - RSA key pair to export
 * @returns Promise<ExportableEdgeRSAKeyPair> - Exportable key pair
 * 
 * @example
 * ```typescript
 * const keyPair = await generateEdgeRSAKeys();
 * const exported = await exportEdgeRSAKeyPair(keyPair);
 * localStorage.setItem('publicKey', JSON.stringify(exported.publicKey));
 * ```
 */
export async function exportEdgeRSAKeyPair(keyPair: EdgeRSAKeyPair): Promise<ExportableEdgeRSAKeyPair> {
  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey('jwk', keyPair.publicKey),
    crypto.subtle.exportKey('jwk', keyPair.privateKey)
  ]);

  return { publicKey, privateKey };
}

/**
 * Import RSA key pair from JWK format
 * 
 * @param exportedKeyPair - Exported key pair in JWK format
 * @returns Promise<EdgeRSAKeyPair> - Imported key pair
 * 
 * @example
 * ```typescript
 * const publicKeyJWK = JSON.parse(localStorage.getItem('publicKey')!);
 * const keyPair = await importEdgeRSAKeyPair({ publicKey: publicKeyJWK, privateKey: null });
 * ```
 */
export async function importEdgeRSAKeyPair(exportedKeyPair: ExportableEdgeRSAKeyPair): Promise<EdgeRSAKeyPair> {
  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.importKey(
      'jwk',
      exportedKeyPair.publicKey,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    ),
    crypto.subtle.importKey(
      'jwk',
      exportedKeyPair.privateKey,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['decrypt']
    )
  ]);

  return { publicKey, privateKey };
}

/**
 * Import only public key from JWK format
 * 
 * @param publicKeyJWK - Public key in JWK format
 * @returns Promise<CryptoKey> - Imported public key
 */
export async function importEdgePublicKey(publicKeyJWK: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    publicKeyJWK,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  );
}

/**
 * Import only private key from JWK format
 * 
 * @param privateKeyJWK - Private key in JWK format
 * @returns Promise<CryptoKey> - Imported private key
 */
export async function importEdgePrivateKey(privateKeyJWK: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    privateKeyJWK,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM with Web Crypto API
 * 
 * @param data - Data to encrypt (string or ArrayBuffer)
 * @param aesKey - AES-GCM key. If not provided, generates random key
 * @returns Promise with encryption result
 * 
 * @private
 */
async function edgeEncryptWithAES(
  data: string | ArrayBuffer,
  aesKey?: CryptoKey
): Promise<{
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  aesKey: CryptoKey;
}> {
  // Generate random AES key if not provided
  const key = aesKey || await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Generate random IV (12 bytes is recommended for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Convert to Uint8Array for compatibility with Node.js crypto
  // This ensures the data is in the correct format for both browser and Node environments
  const dataBuffer = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : new Uint8Array(data);

  // Encrypt data
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    dataBuffer
  );

  return {
    encryptedData,
    iv,
    aesKey: key
  };
}

/**
 * Decrypt data using AES-256-GCM with Web Crypto API
 * 
 * @param encryptedData - Encrypted data buffer
 * @param aesKey - AES-GCM key
 * @param iv - Initialization vector
 * @returns Promise<ArrayBuffer> - Decrypted data
 * 
 * @throws Error if authentication fails or decryption fails
 * @private
 */
async function edgeDecryptWithAES(
  encryptedData: ArrayBuffer,
  aesKey: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  // Create a new Uint8Array to satisfy TypeScript's strict typing
  const ivBuffer = new Uint8Array(iv);
  
  // Convert encryptedData to Uint8Array for compatibility with Node.js crypto
  // This ensures the data is in the correct format for both browser and Node environments
  const encryptedBuffer = new Uint8Array(encryptedData);
  
  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    aesKey,
    encryptedBuffer
  );
}

/**
 * Encrypt AES key with RSA public key using Web Crypto API
 * 
 * @param aesKey - AES key to encrypt
 * @param publicKey - RSA public key
 * @returns Promise<ArrayBuffer> - Encrypted AES key
 * 
 * @private
 */
async function edgeEncryptAESKey(aesKey: CryptoKey, publicKey: CryptoKey): Promise<ArrayBuffer> {
  // Export AES key as raw bytes
  const aesKeyData = await crypto.subtle.exportKey('raw', aesKey);

  // Encrypt with RSA-OAEP
  return crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    publicKey,
    aesKeyData
  );
}

/**
 * Decrypt AES key with RSA private key using Web Crypto API
 * 
 * @param encryptedAESKey - RSA-encrypted AES key
 * @param privateKey - RSA private key
 * @returns Promise<CryptoKey> - Decrypted AES key
 * 
 * @throws Error if decryption fails
 * @private
 */
async function edgeDecryptAESKey(encryptedAESKey: ArrayBuffer, privateKey: CryptoKey): Promise<CryptoKey> {
  // Convert to Uint8Array for better compatibility with Node's WebCrypto
  const keyData = new Uint8Array(encryptedAESKey);
    
  // Decrypt AES key data
  const aesKeyData = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP'
    },
    privateKey,
    keyData
  );

  // Import as AES-GCM key
  return crypto.subtle.importKey(
    'raw',
    aesKeyData,
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert ArrayBuffer to Base64 string
 * 
 * @param buffer - ArrayBuffer to convert
 * @returns Base64 string
 * 
 * @private
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * 
 * @param base64 - Base64 string
 * @returns ArrayBuffer
 * 
 * @private
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  // Ensure we return a proper ArrayBuffer by slicing to create a new buffer
  // This handles both browser and Node.js environments correctly
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * Encrypt data using hybrid encryption (AES-GCM + RSA-OAEP) with Web Crypto API
 * 
 * Process:
 * 1. Generate random AES-256 key
 * 2. Encrypt data with AES-256-GCM (fast, efficient)
 * 3. Encrypt AES key with RSA-OAEP (secure key exchange)
 * 4. Return encrypted data + encrypted key + metadata
 * 
 * @param data - Data to encrypt (string or ArrayBuffer)
 * @param publicKey - RSA public key (CryptoKey or JWK)
 * @returns Promise<EdgeHybridEncryptionResult> - Hybrid encryption result
 * 
 * @example
 * ```typescript
 * const keyPair = await generateEdgeRSAKeys();
 * const encrypted = await edgeEncryptHybrid("sensitive data", keyPair.publicKey);
 * 
 * // Store encrypted.encryptedData and encrypted.encryptedAESKey
 * // Later decrypt with privateKey
 * ```
 */
export async function edgeEncryptHybrid(
  data: string | ArrayBuffer,
  publicKey: CryptoKey | JsonWebKey
): Promise<EdgeHybridEncryptionResult> {
  // Import public key if it's in JWK format
  const pubKey = (publicKey as CryptoKey).type === 'public'
    ? (publicKey as CryptoKey)
    : await importEdgePublicKey(publicKey as JsonWebKey);

  // Step 1 & 2: Encrypt data with AES-GCM
  const aesResult = await edgeEncryptWithAES(data);

  // Step 3: Encrypt AES key with RSA
  const encryptedAESKey = await edgeEncryptAESKey(aesResult.aesKey, pubKey);

  // Step 4: Return all components in base64 format
  return {
    encryptedData: arrayBufferToBase64(aesResult.encryptedData),
    encryptedAESKey: arrayBufferToBase64(encryptedAESKey),
    iv: arrayBufferToBase64(aesResult.iv.buffer as ArrayBuffer)
  };
}

/**
 * Decrypt data using hybrid decryption (RSA-OAEP + AES-GCM) with Web Crypto API
 * 
 * Process:
 * 1. Decrypt AES key using RSA private key
 * 2. Decrypt data using recovered AES key
 * 3. Verify authentication tag (ensures data integrity)
 * 4. Return decrypted data
 * 
 * @param payload - Hybrid encryption payload
 * @param privateKey - RSA private key (CryptoKey or JWK)
 * @returns Promise<string> - Decrypted data as string
 * 
 * @throws Error if RSA decryption fails, authentication fails, or data is corrupted
 * 
 * @example
 * ```typescript
 * const decrypted = await edgeDecryptHybrid({
 *   encryptedData: "...",
 *   encryptedAESKey: "...",
 *   iv: "..."
 * }, privateKey);
 * console.log(decrypted); // "sensitive data"
 * ```
 */
export async function edgeDecryptHybrid(
  payload: EdgeHybridDecryptionPayload,
  privateKey: CryptoKey | JsonWebKey
): Promise<string> {
  // Import private key if it's in JWK format
  const privKey = (privateKey as CryptoKey).type === 'private'
    ? (privateKey as CryptoKey)
    : await importEdgePrivateKey(privateKey as JsonWebKey);

  // Convert base64 strings to ArrayBuffers
  const encryptedData = base64ToArrayBuffer(payload.encryptedData);
  const encryptedAESKey = base64ToArrayBuffer(payload.encryptedAESKey);
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));

  // Step 1: Decrypt AES key with RSA
  const aesKey = await edgeDecryptAESKey(encryptedAESKey, privKey);

  // Step 2: Decrypt data with AES
  const decryptedBuffer = await edgeDecryptWithAES(encryptedData, aesKey, iv);

  // Step 3: Convert ArrayBuffer to string
  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Encrypt binary data (e.g., file) using hybrid encryption
 * 
 * @param data - Binary data to encrypt
 * @param publicKey - RSA public key (CryptoKey or JWK)
 * @returns Promise<EdgeHybridEncryptionResult> - Hybrid encryption result
 * 
 * @example
 * ```typescript
 * const fileData = await file.arrayBuffer();
 * const encrypted = await edgeEncryptBinaryData(fileData, publicKey);
 * ```
 */
export async function edgeEncryptBinaryData(
  data: ArrayBuffer,
  publicKey: CryptoKey | JsonWebKey
): Promise<EdgeHybridEncryptionResult> {
  return edgeEncryptHybrid(data, publicKey);
}

/**
 * Decrypt binary data using hybrid decryption
 * 
 * @param payload - Hybrid encryption payload
 * @param privateKey - RSA private key (CryptoKey or JWK)
 * @returns Promise<ArrayBuffer> - Decrypted binary data
 * 
 * @example
 * ```typescript
 * const decrypted = await edgeDecryptBinaryData({
 *   encryptedData: "...",
 *   encryptedAESKey: "...",
 *   iv: "..."
 * }, privateKey);
 * 
 * // Create blob and download
 * const blob = new Blob([decrypted]);
 * ```
 */
export async function edgeDecryptBinaryData(
  payload: EdgeHybridDecryptionPayload,
  privateKey: CryptoKey | JsonWebKey
): Promise<ArrayBuffer> {
  // Import private key if it's in JWK format
  const privKey = (privateKey as CryptoKey).type === 'private'
    ? (privateKey as CryptoKey)
    : await importEdgePrivateKey(privateKey as JsonWebKey);

  // Convert base64 strings to ArrayBuffers
  const encryptedData = base64ToArrayBuffer(payload.encryptedData);
  const encryptedAESKey = base64ToArrayBuffer(payload.encryptedAESKey);
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));

  // Decrypt AES key with RSA
  const aesKey = await edgeDecryptAESKey(encryptedAESKey, privKey);

  // Decrypt data with AES
  return edgeDecryptWithAES(encryptedData, aesKey, iv);
}

/**
 * Encrypt a File object using hybrid encryption
 * 
 * @param file - File to encrypt
 * @param publicKey - RSA public key (CryptoKey or JWK)
 * @returns Promise<EdgeHybridEncryptionResult> - Hybrid encryption result
 * 
 * @example
 * ```typescript
 * const encrypted = await edgeEncryptFile(file, publicKey);
 * // Send to server for storage
 * ```
 */
export async function edgeEncryptFile(
  file: File,
  publicKey: CryptoKey | JsonWebKey
): Promise<EdgeHybridEncryptionResult> {
  const arrayBuffer = await file.arrayBuffer();
  return edgeEncryptBinaryData(arrayBuffer, publicKey);
}
