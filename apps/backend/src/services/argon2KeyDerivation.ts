/**
 * Argon2id Key Derivation Module
 *
 * Implements secure passphrase-based key derivation using Argon2id,
 * the winner of the Password Hashing Competition (PHC).
 *
 * Argon2id is a hybrid variant that combines:
 * - Argon2i: Resistant to side-channel attacks
 * - Argon2d: Resistant to GPU cracking attacks
 *
 * This module provides secure derivation of employer master keys
 * from user-provided passphrases.
 *
 * Security Parameters (OWASP Recommendations for 2024):
 * - Memory: 64 MiB (65536 KiB)
 * - Iterations: 3
 * - Parallelism: 4
 * - Salt: 16 bytes (cryptographically random)
 * - Output: 32 bytes (256 bits for AES-256)
 *
 * @module argon2KeyDerivation
 */

import argon2 from 'argon2';
import { randomBytes, timingSafeEqual } from 'crypto';

/**
 * Argon2id configuration parameters
 * Based on OWASP 2024 recommendations for sensitive data
 */
export const ARGON2_CONFIG = {
  /** Memory cost in KiB (64 MiB) */
  memoryCost: 65536,
  /** Number of iterations (time cost) */
  timeCost: 3,
  /** Degree of parallelism */
  parallelism: 4,
  /** Output hash length in bytes (256 bits for AES-256) */
  hashLength: 32,
  /** Salt length in bytes */
  saltLength: 16,
  /** Algorithm type */
  type: argon2.argon2id,
} as const;

/**
 * Derived key result from Argon2id
 */
export interface DerivedKeyResult {
  /** The derived key as a Buffer (32 bytes for AES-256) */
  key: Buffer;
  /** The salt used for derivation (must be stored with encrypted data) */
  salt: Buffer;
  /** The Argon2id hash string (for verification) */
  hash: string;
  /** Configuration version for future-proofing */
  version: string;
  /** Algorithm identifier */
  algorithm: 'argon2id';
}

/**
 * Stored key material for later verification
 */
export interface StoredKeyMaterial {
  /** Base64-encoded salt */
  salt: string;
  /** Argon2id hash string for verification */
  hash: string;
  /** Configuration version */
  version: string;
  /** Algorithm identifier */
  algorithm: 'argon2id';
}

/**
 * Configuration version for tracking changes
 */
export const KEY_DERIVATION_VERSION = 'ARGON2ID-v1.0';

/**
 * Derive an encryption key from a passphrase using Argon2id
 *
 * This function generates a cryptographically secure key from a
 * user-provided passphrase. The key can be used for AES-256 encryption.
 *
 * @param passphrase - User-provided passphrase (should be strong)
 * @param salt - Optional salt (if not provided, generates new random salt)
 * @returns Derived key result with key, salt, and verification hash
 *
 * @example
 * ```typescript
 * // Generate new key from passphrase
 * const result = await deriveKeyFromPassphrase('MySecurePassphrase123!');
 *
 * // Store the salt and hash for later verification
 * await storeKeyMaterial({
 *   salt: result.salt.toString('base64'),
 *   hash: result.hash,
 *   version: result.version,
 *   algorithm: result.algorithm
 * });
 *
 * // Use the key for encryption
 * const encryptedData = encryptWithKey(result.key, sensitiveData);
 * ```
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt?: Buffer
): Promise<DerivedKeyResult> {
  // Validate passphrase - check both character count and byte length
  // This ensures consistent security regardless of Unicode content
  if (!passphrase) {
    throw new Error('Passphrase is required');
  }

  const byteLength = Buffer.byteLength(passphrase, 'utf8');
  const charLength = passphrase.length;

  // Require minimum 8 characters AND minimum 8 bytes
  // This handles edge cases where multi-byte characters could
  // result in fewer actual bytes than expected
  if (charLength < 8 || byteLength < 8) {
    throw new Error(
      'Passphrase must be at least 8 characters and 8 bytes long'
    );
  }

  // Generate or use provided salt
  const derivationSalt = salt || randomBytes(ARGON2_CONFIG.saltLength);

  // Derive key using Argon2id with raw output
  const derivedKey = await argon2.hash(passphrase, {
    type: ARGON2_CONFIG.type,
    memoryCost: ARGON2_CONFIG.memoryCost,
    timeCost: ARGON2_CONFIG.timeCost,
    parallelism: ARGON2_CONFIG.parallelism,
    hashLength: ARGON2_CONFIG.hashLength,
    salt: derivationSalt,
    raw: true,
  });

  // Also generate verification hash (not raw, for storage)
  const verificationHash = await argon2.hash(passphrase, {
    type: ARGON2_CONFIG.type,
    memoryCost: ARGON2_CONFIG.memoryCost,
    timeCost: ARGON2_CONFIG.timeCost,
    parallelism: ARGON2_CONFIG.parallelism,
    salt: derivationSalt,
  });

  return {
    key: derivedKey as Buffer,
    salt: derivationSalt,
    hash: verificationHash,
    version: KEY_DERIVATION_VERSION,
    algorithm: 'argon2id',
  };
}

/**
 * Verify a passphrase against stored key material
 *
 * This function verifies that a provided passphrase matches the
 * one used to generate stored key material.
 *
 * @param passphrase - User-provided passphrase to verify
 * @param storedHash - The stored Argon2id hash string
 * @returns True if passphrase matches, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await verifyPassphrase('MySecurePassphrase123!', storedHash);
 * if (isValid) {
 *   // Passphrase is correct, derive key for decryption
 *   const result = await deriveKeyFromPassphrase(passphrase, storedSalt);
 * }
 * ```
 */
export async function verifyPassphrase(
  passphrase: string,
  storedHash: string
): Promise<boolean> {
  try {
    return await argon2.verify(storedHash, passphrase);
  } catch {
    return false;
  }
}

/**
 * Re-derive a key from stored material
 *
 * Use this when you need to decrypt data and have the stored salt.
 *
 * @param passphrase - User-provided passphrase
 * @param storedMaterial - Previously stored key material
 * @returns Derived key result
 * @throws Error if passphrase doesn't match stored hash
 *
 * @example
 * ```typescript
 * const storedMaterial = await loadKeyMaterial(employerId);
 * const result = await rederiveKey('MySecurePassphrase123!', storedMaterial);
 * const decryptedData = decryptWithKey(result.key, encryptedData);
 * ```
 */
export async function rederiveKey(
  passphrase: string,
  storedMaterial: StoredKeyMaterial
): Promise<DerivedKeyResult> {
  // Verify passphrase matches stored hash
  const isValid = await verifyPassphrase(passphrase, storedMaterial.hash);
  if (!isValid) {
    throw new Error('Invalid passphrase');
  }

  // Decode salt from base64
  const salt = Buffer.from(storedMaterial.salt, 'base64');

  // Re-derive the key
  return deriveKeyFromPassphrase(passphrase, salt);
}

/**
 * Constant-time comparison for derived keys
 *
 * This function performs a timing-safe comparison to prevent
 * timing attacks when comparing keys.
 *
 * @param key1 - First key to compare
 * @param key2 - Second key to compare
 * @returns True if keys are equal, false otherwise
 */
export function constantTimeKeyCompare(key1: Buffer, key2: Buffer): boolean {
  if (key1.length !== key2.length) {
    return false;
  }
  return timingSafeEqual(key1, key2);
}

/**
 * Generate a secure random passphrase
 *
 * Use this to generate a strong passphrase for employer master keys.
 *
 * @param length - Length of passphrase in bytes (default: 32)
 * @returns Base64-encoded random passphrase
 *
 * @example
 * ```typescript
 * const passphrase = generateSecurePassphrase();
 * // Store this passphrase securely (e.g., password manager)
 * const result = await deriveKeyFromPassphrase(passphrase);
 * ```
 */
export function generateSecurePassphrase(length: number = 32): string {
  return randomBytes(length).toString('base64');
}

/**
 * Check if stored key material needs upgrade to newer parameters
 *
 * Call this periodically to check if key derivation parameters
 * should be upgraded for better security.
 *
 * @param storedMaterial - Previously stored key material
 * @returns True if upgrade is needed
 */
export function needsUpgrade(storedMaterial: StoredKeyMaterial): boolean {
  return storedMaterial.version !== KEY_DERIVATION_VERSION;
}

/**
 * Upgrade key derivation to current parameters
 *
 * This re-derives the key with current security parameters.
 * Requires the original passphrase.
 *
 * @param passphrase - User-provided passphrase
 * @param _storedMaterial - Old stored material (used for verification)
 * @returns New derived key result with upgraded parameters
 */
export async function upgradeKeyDerivation(
  passphrase: string,
  _storedMaterial: StoredKeyMaterial
): Promise<DerivedKeyResult> {
  // Verify old passphrase first
  const isValid = await verifyPassphrase(passphrase, _storedMaterial.hash);
  if (!isValid) {
    throw new Error('Invalid passphrase for upgrade');
  }

  // Generate new key with current parameters (fresh salt)
  return deriveKeyFromPassphrase(passphrase);
}
