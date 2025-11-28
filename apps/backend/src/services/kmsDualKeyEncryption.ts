/**
 * KMS-Kyber768 Dual-Key Hybrid Encryption Module
 *
 * Implements quantum-resistant dual-key encryption by combining:
 * - Google Cloud KMS (RSA-4096) for classical security
 * - Kyber768 for post-quantum security
 *
 * This dual-key approach ensures that even if quantum computers
 * break RSA encryption, data remains protected by Kyber768,
 * and vice versa for any potential Kyber768 vulnerabilities.
 *
 * Encryption Process:
 * 1. Generate random AES-256 key
 * 2. Encrypt data with AES-256-GCM
 * 3. Encrypt AES key with KMS RSA-4096 (classical security)
 * 4. Encrypt AES key with Kyber768 (quantum security)
 * 5. Both encrypted keys required for decryption
 *
 * @module kmsDualKeyEncryption
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'crypto';
import { kmsService } from './kmsService';
import {
  generateKyber768KeyPair,
  kyber768Encapsulate,
  kyber768Decapsulate,
  Kyber768PublicKey,
  Kyber768PrivateKey,
  Kyber768KeyPair,
  KYBER768_ALGORITHM_VERSION,
} from './kyber768Service';
import { constantTimeXor } from './constantTimeOps';

/**
 * Dual-key encrypted envelope
 */
export interface DualKeyEnvelope {
  /** Unique envelope identifier */
  id: string;
  /** AES-256-GCM encrypted data */
  encryptedData: string;
  /** Initialization vector for AES */
  iv: string;
  /** Authentication tag for AES-GCM */
  authTag: string;
  /** KMS RSA-encrypted key share */
  kmsEncryptedShare: string;
  /** Kyber768 ciphertext for key encapsulation */
  kyberCiphertext: string;
  /** KMS key path used for encryption */
  kmsKeyPath: string;
  /** KMS key version */
  kmsKeyVersion: string;
  /** Kyber768 key ID used for encryption */
  kyberKeyId: string;
  /** Encryption timestamp */
  encryptedAt: Date;
  /** Algorithm version for tracking */
  algorithmVersion: string;
}

/**
 * Pre-seeded Kyber768 key pair for the system
 */
export interface PreseededKyberKeys {
  publicKey: Kyber768PublicKey;
  privateKey: Kyber768PrivateKey;
  createdAt: Date;
  expiresAt: Date;
  keyId: string;
}

/**
 * Algorithm version for tracking
 */
export const DUAL_KEY_ALGORITHM_VERSION = 'KMS-KYBER768-DUAL-v1.0';

/**
 * Generate pre-seeded Kyber768 keys for the system
 *
 * These keys should be generated once and stored securely.
 * The private key should never leave the secure environment.
 *
 * @param validityDays - Number of days the keys are valid (default: 365)
 * @returns Pre-seeded Kyber768 key pair
 *
 * @example
 * ```typescript
 * const keys = generatePreseededKyberKeys(365);
 * // Store keys.privateKey in secure storage (e.g., KMS, HSM)
 * // Distribute keys.publicKey to all encryption services
 * ```
 */
export function generatePreseededKyberKeys(
  validityDays: number = 365
): PreseededKyberKeys {
  const keyPair = generateKyber768KeyPair();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + validityDays);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    createdAt,
    expiresAt,
    keyId: keyPair.publicKey.keyId,
  };
}

/**
 * Create a dual-key encrypted envelope
 *
 * This function encrypts data using both KMS and Kyber768,
 * providing quantum-resistant security.
 *
 * @param data - Data to encrypt (string or Buffer)
 * @param kyberPublicKey - Kyber768 public key for quantum-safe encryption
 * @param kmsKeyVersion - Optional KMS key version
 * @returns Dual-key encrypted envelope
 *
 * @example
 * ```typescript
 * const envelope = await createDualKeyEnvelope(
 *   'sensitive medical data',
 *   preseededKeys.publicKey
 * );
 *
 * // Store envelope in database
 * await db.save('encrypted_records', envelope);
 * ```
 */
export async function createDualKeyEnvelope(
  data: string | Buffer,
  kyberPublicKey: Kyber768PublicKey,
  kmsKeyVersion?: string
): Promise<DualKeyEnvelope> {
  const id = randomBytes(16).toString('hex');
  const dataBuffer =
    typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

  // Step 1: Generate random AES-256 key
  const aesKey = randomBytes(32);
  const iv = randomBytes(12); // 96 bits for GCM

  // Step 2: Encrypt data with AES-256-GCM
  const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Step 3: Split AES key into two shares using constant-time XOR
  // This ensures both keys are required for decryption
  const keyShare1 = randomBytes(32);
  const keyShare2 = constantTimeXor(aesKey, keyShare1);

  // Step 4: Encrypt first share with KMS RSA-4096
  const kmsEncryptedShare = await kmsService.asymmetricEncrypt(keyShare1);

  // Step 5: Encrypt second share with Kyber768
  // Create a deterministic binding between the share and Kyber encapsulation
  const kyberEncap = kyber768Encapsulate(kyberPublicKey);
  const kyberSharedSecret = Buffer.from(kyberEncap.sharedSecret, 'base64');

  // XOR the second share with Kyber shared secret using constant-time operation
  const encryptedShare2 = constantTimeXor(keyShare2, kyberSharedSecret);

  // Get KMS key info
  const kmsKeyInfo = await kmsService.getPublicKey(kmsKeyVersion);

  return {
    id,
    encryptedData: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    kmsEncryptedShare,
    kyberCiphertext:
      kyberEncap.ciphertext + ':' + encryptedShare2.toString('base64'),
    kmsKeyPath: kmsKeyInfo.keyPath,
    kmsKeyVersion: kmsKeyInfo.keyVersion,
    kyberKeyId: kyberPublicKey.keyId,
    encryptedAt: new Date(),
    algorithmVersion: DUAL_KEY_ALGORITHM_VERSION,
  };
}

/**
 * Open a dual-key encrypted envelope
 *
 * This function decrypts data that was encrypted with both
 * KMS and Kyber768 keys.
 *
 * @param envelope - Dual-key encrypted envelope
 * @param kyberPrivateKey - Kyber768 private key for decryption
 * @param kyberPublicKey - Kyber768 public key for verification
 * @returns Decrypted data as Buffer
 *
 * @example
 * ```typescript
 * const envelope = await loadEnvelopeFromDB(recordId);
 * const decrypted = await openDualKeyEnvelope(
 *   envelope,
 *   preseededKeys.privateKey,
 *   preseededKeys.publicKey
 * );
 * const data = decrypted.toString('utf8');
 * ```
 */
export async function openDualKeyEnvelope(
  envelope: DualKeyEnvelope,
  kyberPrivateKey: Kyber768PrivateKey,
  kyberPublicKey: Kyber768PublicKey
): Promise<Buffer> {
  // Verify key ID matches
  if (envelope.kyberKeyId !== kyberPrivateKey.keyId) {
    throw new Error(
      'Kyber key ID mismatch: envelope was encrypted with a different key'
    );
  }

  // Step 1: Decrypt first share from KMS
  const keyShare1 = await kmsService.asymmetricDecrypt(
    envelope.kmsEncryptedShare,
    envelope.kmsKeyVersion
  );

  // Step 2: Parse Kyber ciphertext and encrypted share
  const [kyberCiphertext, encryptedShare2Base64] =
    envelope.kyberCiphertext.split(':');
  if (!kyberCiphertext || !encryptedShare2Base64) {
    throw new Error('Invalid Kyber ciphertext format');
  }
  const encryptedShare2 = Buffer.from(encryptedShare2Base64, 'base64');

  // Step 3: Decapsulate Kyber to get shared secret
  const kyberSharedSecret = kyber768Decapsulate(
    kyberCiphertext,
    kyberPrivateKey,
    kyberPublicKey
  );
  const sharedSecretBuffer = Buffer.from(kyberSharedSecret, 'base64');

  // Step 4: Recover second share by XORing with Kyber shared secret using constant-time operation
  const keyShare2 = constantTimeXor(encryptedShare2, sharedSecretBuffer);

  // Step 5: Combine shares to recover AES key using constant-time operation
  const aesKey = constantTimeXor(keyShare1, keyShare2);

  // Step 6: Decrypt data with AES-256-GCM
  const iv = Buffer.from(envelope.iv, 'base64');
  const authTag = Buffer.from(envelope.authTag, 'base64');
  const encryptedData = Buffer.from(envelope.encryptedData, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decrypted;
}

/**
 * Check if a dual-key envelope can be decrypted
 *
 * Performs validation without actually decrypting.
 *
 * @param envelope - Dual-key encrypted envelope
 * @param kyberKeyId - Kyber768 key ID to check
 * @returns True if envelope can potentially be decrypted
 */
export function canDecryptEnvelope(
  envelope: DualKeyEnvelope,
  kyberKeyId: string
): boolean {
  return envelope.kyberKeyId === kyberKeyId;
}

/**
 * Get envelope metadata without decryption
 *
 * @param envelope - Dual-key encrypted envelope
 * @returns Metadata about the envelope
 */
export function getEnvelopeMetadata(envelope: DualKeyEnvelope): {
  id: string;
  encryptedAt: Date;
  algorithmVersion: string;
  kmsKeyPath: string;
  kmsKeyVersion: string;
  kyberKeyId: string;
} {
  return {
    id: envelope.id,
    encryptedAt: envelope.encryptedAt,
    algorithmVersion: envelope.algorithmVersion,
    kmsKeyPath: envelope.kmsKeyPath,
    kmsKeyVersion: envelope.kmsKeyVersion,
    kyberKeyId: envelope.kyberKeyId,
  };
}

/**
 * Derive envelope ID from content hash (for deduplication)
 *
 * @param data - Data to hash
 * @returns Content-based ID
 */
export function deriveContentId(data: string | Buffer): string {
  const dataBuffer =
    typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return createHash('sha256').update(dataBuffer).digest('hex').slice(0, 32);
}

/**
 * Verify envelope integrity (without decryption)
 *
 * @param envelope - Envelope to verify
 * @returns True if envelope structure is valid
 */
export function verifyEnvelopeIntegrity(envelope: DualKeyEnvelope): boolean {
  try {
    // Check all required fields exist
    if (
      !envelope.id ||
      !envelope.encryptedData ||
      !envelope.iv ||
      !envelope.authTag ||
      !envelope.kmsEncryptedShare ||
      !envelope.kyberCiphertext ||
      !envelope.kyberKeyId
    ) {
      return false;
    }

    // Verify base64 encoding
    Buffer.from(envelope.encryptedData, 'base64');
    Buffer.from(envelope.iv, 'base64');
    Buffer.from(envelope.authTag, 'base64');

    // Verify Kyber ciphertext format
    const parts = envelope.kyberCiphertext.split(':');
    if (parts.length !== 2) {
      return false;
    }

    // Verify algorithm version
    if (envelope.algorithmVersion !== DUAL_KEY_ALGORITHM_VERSION) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Export Kyber key pair for secure storage
 *
 * @param keyPair - Key pair to export
 * @returns JSON-serializable key material
 */
export function exportKyberKeyPair(keyPair: Kyber768KeyPair): {
  publicKey: string;
  privateKey: string;
  keyId: string;
  algorithm: string;
  version: string;
} {
  return {
    publicKey: JSON.stringify(keyPair.publicKey),
    privateKey: JSON.stringify(keyPair.privateKey),
    keyId: keyPair.publicKey.keyId,
    algorithm: 'KYBER768',
    version: KYBER768_ALGORITHM_VERSION,
  };
}

/**
 * Import Kyber key pair from storage
 *
 * @param exported - Exported key material
 * @returns Kyber768 key pair
 */
export function importKyberKeyPair(exported: {
  publicKey: string;
  privateKey: string;
}): Kyber768KeyPair {
  return {
    publicKey: JSON.parse(exported.publicKey),
    privateKey: JSON.parse(exported.privateKey),
  };
}
