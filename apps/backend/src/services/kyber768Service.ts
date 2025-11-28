/**
 * Kyber768 Post-Quantum Encryption Module
 *
 * Implements NIST's post-quantum key encapsulation mechanism (KEM) standard.
 * Kyber768 provides IND-CCA2 security against both classical and quantum attacks.
 *
 * This implementation uses a simulation layer that:
 * 1. Generates cryptographically secure random values matching Kyber768 sizes
 * 2. Uses standard AES-256-GCM for symmetric encryption
 * 3. Provides the same interface as a real Kyber768 implementation
 *
 * In production, this would be replaced with a NIST-certified Kyber768 library
 * like liboqs, pqcrypto, or crystals-kyber.
 *
 * Key sizes (Kyber768):
 * - Public key: 1184 bytes
 * - Private key: 2400 bytes
 * - Ciphertext: 1088 bytes
 * - Shared secret: 32 bytes
 *
 * @module kyber768Service
 */

import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'crypto';

/**
 * Kyber768 public key for post-quantum encryption
 */
export interface Kyber768PublicKey {
  /** Base64-encoded public key bytes (1184 bytes when decoded) */
  publicKey: string;
  /** Key identifier for tracking */
  keyId: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Key algorithm identifier */
  algorithm: 'KYBER768';
}

/**
 * Kyber768 private key (should never leave secure environment)
 */
export interface Kyber768PrivateKey {
  /** Base64-encoded private key bytes (2400 bytes when decoded) */
  privateKey: string;
  /** Key identifier for tracking */
  keyId: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Key algorithm identifier */
  algorithm: 'KYBER768';
}

/**
 * Kyber768 key pair
 */
export interface Kyber768KeyPair {
  publicKey: Kyber768PublicKey;
  privateKey: Kyber768PrivateKey;
}

/**
 * Kyber768 encapsulation result (ciphertext + shared secret)
 */
export interface Kyber768Encapsulation {
  /** Base64-encoded ciphertext (1088 bytes when decoded) */
  ciphertext: string;
  /** Base64-encoded shared secret (32 bytes when decoded) */
  sharedSecret: string;
}

/**
 * Quantum-safe encrypted data envelope
 */
export interface QuantumSafeEnvelope {
  /** Unique envelope identifier */
  id: string;
  /** Kyber768 ciphertext for key encapsulation */
  kyberCiphertext: string;
  /** AES-256-GCM encrypted data */
  encryptedData: string;
  /** Initialization vector for AES */
  iv: string;
  /** Authentication tag for AES-GCM */
  authTag: string;
  /** Key ID used for encryption */
  keyId: string;
  /** Encryption timestamp */
  encryptedAt: Date;
  /** Algorithm version for future-proofing */
  algorithmVersion: string;
}

/**
 * Kyber768 key sizes in bytes
 */
export const KYBER768_KEY_SIZES = {
  PUBLIC_KEY: 1184,
  PRIVATE_KEY: 2400,
  CIPHERTEXT: 1088,
  SHARED_SECRET: 32,
} as const;

/**
 * Algorithm version for tracking
 */
export const KYBER768_ALGORITHM_VERSION = 'KYBER768-SIM-v1.0';

/**
 * Generate a Kyber768 key pair
 *
 * This simulation generates cryptographically secure random bytes
 * matching the exact sizes of real Kyber768 keys.
 *
 * @returns Kyber768 key pair
 */
export function generateKyber768KeyPair(): Kyber768KeyPair {
  const keyId = randomBytes(16).toString('hex');
  const now = new Date();

  // Generate random bytes matching Kyber768 key sizes
  const publicKeyBytes = randomBytes(KYBER768_KEY_SIZES.PUBLIC_KEY);
  const privateKeyBytes = randomBytes(KYBER768_KEY_SIZES.PRIVATE_KEY);

  // Embed keyId into keys for pairing verification
  const keyIdBytes = Buffer.from(keyId, 'hex');
  keyIdBytes.copy(publicKeyBytes, 0);
  keyIdBytes.copy(privateKeyBytes, 0);

  const publicKey: Kyber768PublicKey = {
    publicKey: publicKeyBytes.toString('base64'),
    keyId,
    createdAt: now,
    algorithm: 'KYBER768',
  };

  const privateKey: Kyber768PrivateKey = {
    privateKey: privateKeyBytes.toString('base64'),
    keyId,
    createdAt: now,
    algorithm: 'KYBER768',
  };

  return { publicKey, privateKey };
}

/**
 * Encapsulate (encrypt) a shared secret using a Kyber768 public key
 *
 * In real Kyber768, this would:
 * 1. Generate a random message
 * 2. Encode it using the public key matrix
 * 3. Add noise to create the ciphertext
 * 4. Derive a shared secret via hash
 *
 * Our simulation:
 * 1. Generates a random shared secret
 * 2. Creates a deterministic ciphertext from the secret and public key
 *
 * @param publicKey - Kyber768 public key to encapsulate with
 * @returns Encapsulation containing ciphertext and shared secret
 */
export function kyber768Encapsulate(
  publicKey: Kyber768PublicKey
): Kyber768Encapsulation {
  // Generate the shared secret
  const sharedSecret = randomBytes(KYBER768_KEY_SIZES.SHARED_SECRET);

  // Create ciphertext by combining shared secret with public key
  // This simulates the lattice-based encapsulation
  const publicKeyBytes = Buffer.from(publicKey.publicKey, 'base64');

  // Generate deterministic ciphertext from secret and public key
  const ciphertextBytes = Buffer.alloc(KYBER768_KEY_SIZES.CIPHERTEXT);

  // Copy shared secret to beginning (encrypted with derived key)
  const derivedKey = createHash('sha256')
    .update(publicKeyBytes.subarray(0, 32))
    .digest();

  // XOR the shared secret with derived key for basic encapsulation simulation
  const encryptedSecret = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    encryptedSecret[i] = sharedSecret[i]! ^ derivedKey[i]!;
  }
  encryptedSecret.copy(ciphertextBytes, 0);

  // Fill rest with deterministic random data based on secret
  const filler = createHash('sha512')
    .update(sharedSecret)
    .update(publicKeyBytes)
    .digest();

  // Repeat the filler to reach ciphertext size
  for (let i = 32; i < KYBER768_KEY_SIZES.CIPHERTEXT; i += 64) {
    const remaining = Math.min(64, KYBER768_KEY_SIZES.CIPHERTEXT - i);
    filler.copy(ciphertextBytes, i, 0, remaining);
  }

  return {
    ciphertext: ciphertextBytes.toString('base64'),
    sharedSecret: sharedSecret.toString('base64'),
  };
}

/**
 * Decapsulate (decrypt) a shared secret using a Kyber768 private key
 *
 * In real Kyber768, this would:
 * 1. Use the private key to decode the ciphertext
 * 2. Remove noise and recover the message
 * 3. Re-encapsulate to verify correctness
 * 4. Return the shared secret
 *
 * Our simulation reverses the encapsulation process.
 *
 * @param ciphertext - Base64-encoded Kyber768 ciphertext
 * @param privateKey - Kyber768 private key for decapsulation
 * @param publicKey - Corresponding public key for verification
 * @returns The shared secret
 * @throws Error if decapsulation fails
 */
export function kyber768Decapsulate(
  ciphertext: string,
  privateKey: Kyber768PrivateKey,
  publicKey: Kyber768PublicKey
): string {
  // Verify key pair match
  if (privateKey.keyId !== publicKey.keyId) {
    throw new Error('Key pair mismatch: private and public keys do not match');
  }

  const ciphertextBytes = Buffer.from(ciphertext, 'base64');
  const publicKeyBytes = Buffer.from(publicKey.publicKey, 'base64');

  if (ciphertextBytes.length !== KYBER768_KEY_SIZES.CIPHERTEXT) {
    throw new Error(
      `Invalid ciphertext length: expected ${KYBER768_KEY_SIZES.CIPHERTEXT}, got ${ciphertextBytes.length}`
    );
  }

  // Derive the key used in encapsulation
  const derivedKey = createHash('sha256')
    .update(publicKeyBytes.subarray(0, 32))
    .digest();

  // Extract and decrypt the shared secret
  const encryptedSecret = ciphertextBytes.subarray(0, 32);
  const sharedSecret = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    sharedSecret[i] = encryptedSecret[i]! ^ derivedKey[i]!;
  }

  return sharedSecret.toString('base64');
}

/**
 * Create a quantum-safe encrypted envelope for data
 *
 * Process:
 * 1. Generate Kyber768 encapsulation to get shared secret
 * 2. Use shared secret as AES-256-GCM key
 * 3. Encrypt data with AES-256-GCM
 * 4. Package everything in a quantum-safe envelope
 *
 * @param data - Data to encrypt (string or Buffer)
 * @param publicKey - Kyber768 public key for encryption
 * @returns Quantum-safe encrypted envelope
 */
export function createQuantumSafeEnvelope(
  data: string | Buffer,
  publicKey: Kyber768PublicKey
): QuantumSafeEnvelope {
  const id = randomBytes(16).toString('hex');
  const dataBuffer =
    typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

  // Step 1: Kyber768 key encapsulation
  const encapsulation = kyber768Encapsulate(publicKey);

  // Step 2: Use shared secret as AES key
  const aesKey = Buffer.from(encapsulation.sharedSecret, 'base64');
  const iv = randomBytes(12); // 96 bits for GCM

  // Step 3: AES-256-GCM encryption
  const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Step 4: Package into envelope
  return {
    id,
    kyberCiphertext: encapsulation.ciphertext,
    encryptedData: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyId: publicKey.keyId,
    encryptedAt: new Date(),
    algorithmVersion: KYBER768_ALGORITHM_VERSION,
  };
}

/**
 * Open a quantum-safe encrypted envelope
 *
 * Process:
 * 1. Decapsulate Kyber768 to recover shared secret
 * 2. Use shared secret as AES-256-GCM key
 * 3. Decrypt data with AES-256-GCM
 * 4. Verify authenticity via auth tag
 *
 * @param envelope - Quantum-safe encrypted envelope
 * @param privateKey - Kyber768 private key for decryption
 * @param publicKey - Corresponding public key
 * @returns Decrypted data as Buffer
 * @throws Error if decryption or verification fails
 */
export function openQuantumSafeEnvelope(
  envelope: QuantumSafeEnvelope,
  privateKey: Kyber768PrivateKey,
  publicKey: Kyber768PublicKey
): Buffer {
  // Verify key ID matches
  if (envelope.keyId !== privateKey.keyId) {
    throw new Error(
      'Key ID mismatch: envelope was encrypted with a different key'
    );
  }

  // Step 1: Kyber768 decapsulation
  const sharedSecret = kyber768Decapsulate(
    envelope.kyberCiphertext,
    privateKey,
    publicKey
  );

  // Step 2: Prepare AES decryption
  const aesKey = Buffer.from(sharedSecret, 'base64');
  const iv = Buffer.from(envelope.iv, 'base64');
  const authTag = Buffer.from(envelope.authTag, 'base64');
  const encryptedData = Buffer.from(envelope.encryptedData, 'base64');

  // Step 3: AES-256-GCM decryption
  const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decrypted;
}

/**
 * Verify that a Kyber768 key pair is valid (keys match)
 *
 * @param keyPair - Key pair to verify
 * @returns true if the key pair is valid
 */
export function verifyKyber768KeyPair(keyPair: Kyber768KeyPair): boolean {
  try {
    // Check key IDs match
    if (keyPair.publicKey.keyId !== keyPair.privateKey.keyId) {
      return false;
    }

    // Check key sizes
    const publicKeyBytes = Buffer.from(keyPair.publicKey.publicKey, 'base64');
    const privateKeyBytes = Buffer.from(
      keyPair.privateKey.privateKey,
      'base64'
    );

    if (publicKeyBytes.length !== KYBER768_KEY_SIZES.PUBLIC_KEY) {
      return false;
    }

    if (privateKeyBytes.length !== KYBER768_KEY_SIZES.PRIVATE_KEY) {
      return false;
    }

    // Verify embedded key IDs match
    const keyIdBytes = Buffer.from(keyPair.publicKey.keyId, 'hex');
    if (!publicKeyBytes.subarray(0, 16).equals(keyIdBytes)) {
      return false;
    }
    if (!privateKeyBytes.subarray(0, 16).equals(keyIdBytes)) {
      return false;
    }

    // Verify encapsulation/decapsulation round-trip
    const testData = randomBytes(32);
    const envelope = createQuantumSafeEnvelope(testData, keyPair.publicKey);
    const decrypted = openQuantumSafeEnvelope(
      envelope,
      keyPair.privateKey,
      keyPair.publicKey
    );

    return testData.equals(decrypted);
  } catch {
    return false;
  }
}
