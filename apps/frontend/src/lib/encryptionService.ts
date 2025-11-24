import CryptoJS from 'crypto-js';
import * as Twofish from 'twofish-ts';

/**
 * Hybrid Encryption Service
 * Implements multi-layer encryption: Serpent-like → Twofish → AES
 * 
 * For maximum security of sensitive medical documents:
 * 1. First layer: Serpent-like encryption (multi-round AES with unique key)
 * 2. Second layer: Twofish encryption
 * 3. Third layer: AES-256-CBC encryption
 * 
 * This provides defense-in-depth encryption for sensitive data.
 */

interface EncryptionResult {
  encryptedData: string;
  serpentKey: string;
  twofishKey: string;
  aesKey: string;
  iv: string;
}

interface DecryptionInput {
  encryptedData: string;
  serpentKey: string;
  twofishKey: string;
  aesKey: string;
  iv: string;
}

/**
 * Generate a secure random key
 * @param length - Key length in bytes (default 32 for 256-bit)
 * @returns Hex-encoded key
 */
function generateKey(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a secure random IV (Initialization Vector)
 * @returns Hex-encoded IV
 */
function generateIV(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to byte array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert byte array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Serpent-like encryption: Multiple rounds of AES with unique keys
 * This simulates Serpent's multiple round structure using AES
 * @param data - Data to encrypt (base64 string)
 * @param key - Encryption key (hex string)
 * @param iv - Initialization vector (hex string)
 * @returns Encrypted data (base64 string)
 */
function serpentLikeEncrypt(data: string, key: string, iv: string): string {
  // Convert IV to CryptoJS format
  const cryptoIV = CryptoJS.enc.Hex.parse(iv);
  
  // Perform multiple rounds of AES encryption (simulating Serpent's 32 rounds)
  // We'll do 4 rounds with key derivation for each round
  let encrypted = data;
  
  for (let round = 0; round < 4; round++) {
    // Derive a unique key for this round using PBKDF2
    const roundKey = CryptoJS.PBKDF2(key + round.toString(), 'serpent-round-' + round, {
      keySize: 256 / 32,
      iterations: 1000
    });
    
    // Encrypt with this round's key
    const ciphertext = CryptoJS.AES.encrypt(encrypted, roundKey, {
      iv: cryptoIV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    encrypted = ciphertext.toString();
  }
  
  return encrypted;
}

/**
 * Serpent-like decryption: Multiple rounds of AES decryption in reverse order
 * @param encryptedData - Encrypted data (base64 string)
 * @param key - Decryption key (hex string)
 * @param iv - Initialization vector (hex string)
 * @returns Decrypted data (base64 string)
 */
function serpentLikeDecrypt(encryptedData: string, key: string, iv: string): string {
  const cryptoIV = CryptoJS.enc.Hex.parse(iv);
  
  // Decrypt in reverse order
  let decrypted = encryptedData;
  
  for (let round = 3; round >= 0; round--) {
    // Derive the same key used in encryption for this round
    const roundKey = CryptoJS.PBKDF2(key + round.toString(), 'serpent-round-' + round, {
      keySize: 256 / 32,
      iterations: 1000
    });
    
    // Decrypt with this round's key
    const bytes = CryptoJS.AES.decrypt(decrypted, roundKey, {
      iv: cryptoIV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    decrypted = bytes.toString(CryptoJS.enc.Utf8);
  }
  
  return decrypted;
}

/**
 * Twofish encryption
 * @param data - Data to encrypt (string)
 * @param key - 256-bit key (hex string)
 * @returns Encrypted data (hex string)
 */
function twofishEncrypt(data: string, key: string): string {
  // Convert key from hex to bytes (need Uint8Array)
  const keyBytes = hexToBytes(key);
  
  // Create Twofish session
  const session = Twofish.makeSession(keyBytes);
  
  // Convert data to bytes
  const dataBytes = new TextEncoder().encode(data);
  
  // Pad data to 16-byte blocks (Twofish block size)
  const blockSize = 16;
  const paddingLength = blockSize - (dataBytes.length % blockSize);
  const paddedData = new Uint8Array(dataBytes.length + paddingLength);
  paddedData.set(dataBytes);
  
  // Fill padding with padding length value (PKCS7 style)
  for (let i = dataBytes.length; i < paddedData.length; i++) {
    paddedData[i] = paddingLength;
  }
  
  // Encrypt each block
  const encrypted = new Uint8Array(paddedData.length);
  for (let i = 0; i < paddedData.length; i += blockSize) {
    Twofish.encrypt(paddedData, i, encrypted, i, session);
  }
  
  return bytesToHex(encrypted);
}

/**
 * Twofish decryption
 * @param encryptedData - Encrypted data (hex string)
 * @param key - 256-bit key (hex string)
 * @returns Decrypted data (string)
 */
function twofishDecrypt(encryptedData: string, key: string): string {
  // Convert key and data from hex to bytes
  const keyBytes = hexToBytes(key);
  const dataBytes = hexToBytes(encryptedData);
  
  // Create Twofish session
  const session = Twofish.makeSession(keyBytes);
  
  // Decrypt each block
  const blockSize = 16;
  const decrypted = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i += blockSize) {
    Twofish.decrypt(dataBytes, i, decrypted, i, session);
  }
  
  // Remove PKCS7 padding
  const paddingLength = decrypted[decrypted.length - 1];
  if (paddingLength === undefined || paddingLength < 1 || paddingLength > 16) {
    throw new Error('Invalid padding length');
  }
  const unpaddedData = decrypted.slice(0, decrypted.length - paddingLength);
  
  return new TextDecoder().decode(unpaddedData);
}

/**
 * AES-256 encryption (final layer)
 * @param data - Data to encrypt (string)
 * @param key - 256-bit key (hex string)
 * @param iv - Initialization vector (hex string)
 * @returns Encrypted data (base64 string)
 */
function aesEncrypt(data: string, key: string, iv: string): string {
  const cryptoKey = CryptoJS.enc.Hex.parse(key);
  const cryptoIV = CryptoJS.enc.Hex.parse(iv);
  
  const encrypted = CryptoJS.AES.encrypt(data, cryptoKey, {
    iv: cryptoIV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return encrypted.toString();
}

/**
 * AES-256 decryption (first layer in decryption)
 * @param encryptedData - Encrypted data (base64 string)
 * @param key - 256-bit key (hex string)
 * @param iv - Initialization vector (hex string)
 * @returns Decrypted data (string)
 */
function aesDecrypt(encryptedData: string, key: string, iv: string): string {
  const cryptoKey = CryptoJS.enc.Hex.parse(key);
  const cryptoIV = CryptoJS.enc.Hex.parse(iv);
  
  const decrypted = CryptoJS.AES.decrypt(encryptedData, cryptoKey, {
    iv: cryptoIV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Encrypt data using hybrid encryption (Serpent-like → Twofish → AES)
 * @param data - Data to encrypt (string or base64)
 * @returns Encryption result with encrypted data and keys
 */
export function encryptHybrid(data: string): EncryptionResult {
  // Generate unique keys for each layer
  const serpentKey = generateKey(32); // 256-bit
  const twofishKey = generateKey(32); // 256-bit
  const aesKey = generateKey(32);     // 256-bit
  const iv = generateIV();            // 128-bit IV
  
  // Layer 1: Serpent-like encryption
  const serpentEncrypted = serpentLikeEncrypt(data, serpentKey, iv);
  
  // Layer 2: Twofish encryption
  const twofishEncrypted = twofishEncrypt(serpentEncrypted, twofishKey);
  
  // Layer 3: AES encryption
  const finalEncrypted = aesEncrypt(twofishEncrypted, aesKey, iv);
  
  return {
    encryptedData: finalEncrypted,
    serpentKey,
    twofishKey,
    aesKey,
    iv
  };
}

/**
 * Decrypt data using hybrid decryption (AES → Twofish → Serpent-like)
 * @param input - Decryption input with encrypted data and keys
 * @returns Decrypted data (original string)
 */
export function decryptHybrid(input: DecryptionInput): string {
  // Layer 1: AES decryption
  const aesDecrypted = aesDecrypt(input.encryptedData, input.aesKey, input.iv);
  
  // Layer 2: Twofish decryption
  const twofishDecrypted = twofishDecrypt(aesDecrypted, input.twofishKey);
  
  // Layer 3: Serpent-like decryption
  const finalDecrypted = serpentLikeDecrypt(twofishDecrypted, input.serpentKey, input.iv);
  
  return finalDecrypted;
}

/**
 * Encrypt a file using hybrid encryption
 * @param file - File to encrypt
 * @returns Promise with encryption result and encrypted blob
 */
export async function encryptFile(file: File): Promise<{
  encryptedBlob: Blob;
  keys: EncryptionResult;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        
        // Convert to base64 for encryption
        const base64 = btoa(String.fromCharCode(...bytes));
        
        // Encrypt the base64 data
        const encryptionResult = encryptHybrid(base64);
        
        // Convert encrypted data to blob
        const encryptedBlob = new Blob([encryptionResult.encryptedData], {
          type: 'application/octet-stream'
        });
        
        resolve({
          encryptedBlob,
          keys: encryptionResult
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Decrypt a blob using hybrid decryption
 * @param blob - Encrypted blob
 * @param keys - Decryption keys
 * @param originalType - Original file MIME type
 * @returns Promise with decrypted blob
 */
export async function decryptBlob(
  blob: Blob,
  keys: Omit<DecryptionInput, 'encryptedData'>,
  originalType: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const encryptedData = reader.result as string;
        
        // Decrypt the data
        const decryptedBase64 = decryptHybrid({
          encryptedData,
          ...keys
        });
        
        // Convert base64 back to bytes
        const binaryString = atob(decryptedBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create blob with original type
        const decryptedBlob = new Blob([bytes], { type: originalType });
        resolve(decryptedBlob);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

export type { EncryptionResult, DecryptionInput };
