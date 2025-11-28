/**
 * BLS Aggregate Signatures Module
 *
 * Implements BLS (Boneh–Lynn–Shacham) signatures with aggregation support.
 * BLS signatures allow multiple signatures to be combined into a single
 * compact signature that can be verified against all original signers.
 *
 * Key properties:
 * - Short signatures (compact storage)
 * - Signature aggregation (combine multiple into one)
 * - Non-interactive multi-signatures
 * - Deterministic signatures
 *
 * Use case for medical notes:
 * - Employee signs document
 * - Employer co-signs document
 * - Aggregate signature proves both parties agreed
 * - Single verification confirms all signatures
 *
 * This implementation uses a simulation that provides the same interface
 * as real BLS signatures. In production, use a library like @noble/bls12-381
 * or blst for actual BLS cryptography.
 *
 * @module blsSignatureService
 */

import { randomBytes, createHash, createHmac } from 'crypto';

/**
 * BLS public key for aggregate signatures
 */
export interface BLSPublicKey {
  /** Base64-encoded BLS public key */
  publicKey: string;
  /** Key identifier */
  keyId: string;
  /** Owner identifier */
  ownerId: string;
  /** Owner type */
  ownerType: 'EMPLOYEE' | 'EMPLOYER';
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * BLS private key (should never leave secure environment)
 */
export interface BLSPrivateKey {
  /** Base64-encoded BLS private key */
  privateKey: string;
  /** Key identifier */
  keyId: string;
  /** Owner identifier */
  ownerId: string;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Individual BLS signature
 */
export interface BLSSignature {
  /** Base64-encoded signature */
  signature: string;
  /** Signer identifier */
  signerId: string;
  /** Signer type */
  signerType: 'EMPLOYEE' | 'EMPLOYER';
  /** Message hash that was signed */
  messageHash: string;
  /** Signing timestamp */
  signedAt: Date;
}

/**
 * Aggregated BLS signature from multiple signers
 */
export interface AggregatedBLSSignature {
  /** Base64-encoded aggregated signature */
  aggregateSignature: string;
  /** Individual signatures included */
  individualSignatures: BLSSignature[];
  /** Message hash that was signed */
  messageHash: string;
  /** Aggregation timestamp */
  aggregatedAt: Date;
  /** Verification status */
  isVerified: boolean;
}

/**
 * BLS key sizes (simulated to match real BLS12-381)
 */
export const BLS_KEY_SIZES = {
  PUBLIC_KEY: 48, // G1 point compressed
  PRIVATE_KEY: 32, // Scalar in Fr
  SIGNATURE: 96, // G2 point compressed
} as const;

/**
 * Key registry for signature verification (simulation only)
 * In production, verification would use cryptographic pairing.
 *
 * SECURITY NOTE: This in-memory storage is for development/testing only.
 * In production, use a secure key store (e.g., HSM, Cloud KMS) with:
 * - Encryption at rest
 * - Access control and audit logging
 * - Automatic key cleanup/rotation
 * - Memory protection
 */
const keyRegistry = new Map<string, Buffer>();

/**
 * Clear key registry (for testing cleanup)
 * Should be called after tests to prevent key accumulation
 */
export function _clearKeyRegistry(): void {
  keyRegistry.clear();
}

/**
 * Generate a BLS key pair
 *
 * In real BLS:
 * - Private key is a random scalar in Fr
 * - Public key is private_key * G1 generator
 *
 * @param ownerId - Owner identifier
 * @param ownerType - Owner type (EMPLOYEE or EMPLOYER)
 * @returns BLS key pair
 */
export function generateBLSKeyPair(
  ownerId: string,
  ownerType: 'EMPLOYEE' | 'EMPLOYER'
): { publicKey: BLSPublicKey; privateKey: BLSPrivateKey } {
  const keyId = randomBytes(16).toString('hex');
  const now = new Date();

  // Generate private key (random scalar)
  const privateKeyBytes = randomBytes(BLS_KEY_SIZES.PRIVATE_KEY);

  // Derive public key from private key (simulated)
  // In real BLS, this would be scalar multiplication on G1
  const publicKeyBytes = createHash('sha384')
    .update(privateKeyBytes)
    .update('public')
    .digest()
    .subarray(0, BLS_KEY_SIZES.PUBLIC_KEY);

  // Store mapping for verification (simulation only)
  keyRegistry.set(publicKeyBytes.toString('base64'), privateKeyBytes);

  const publicKey: BLSPublicKey = {
    publicKey: publicKeyBytes.toString('base64'),
    keyId,
    ownerId,
    ownerType,
    createdAt: now,
  };

  const privateKey: BLSPrivateKey = {
    privateKey: privateKeyBytes.toString('base64'),
    keyId,
    ownerId,
    createdAt: now,
  };

  return { publicKey, privateKey };
}

/**
 * Sign a message using BLS
 *
 * In real BLS:
 * - Hash message to G2 point
 * - Multiply by private key scalar
 * - Result is signature in G2
 *
 * @param message - Message to sign (Buffer or string)
 * @param privateKey - BLS private key
 * @param signerType - Type of signer
 * @returns BLS signature
 */
export function signBLS(
  message: Buffer | string,
  privateKey: BLSPrivateKey,
  signerType: 'EMPLOYEE' | 'EMPLOYER'
): BLSSignature {
  const messageBuffer =
    typeof message === 'string' ? Buffer.from(message, 'utf8') : message;
  const privateKeyBytes = Buffer.from(privateKey.privateKey, 'base64');

  // Compute message hash (simulates hashing to G2)
  const messageHash = createHash('sha256').update(messageBuffer).digest('hex');

  // Compute signature (simulates scalar multiplication in G2)
  // signature = privateKey * H(message)
  const signatureBytes = createHmac('sha384', privateKeyBytes)
    .update(messageBuffer)
    .update('signature')
    .digest();

  // Ensure signature is correct size (96 bytes for G2)
  const fullSignature = Buffer.alloc(BLS_KEY_SIZES.SIGNATURE);
  signatureBytes.copy(fullSignature, 0);

  return {
    signature: fullSignature.toString('base64'),
    signerId: privateKey.ownerId,
    signerType,
    messageHash,
    signedAt: new Date(),
  };
}

/**
 * Verify a BLS signature
 *
 * In real BLS, uses pairing equation:
 * e(G1, signature) == e(publicKey, H(message))
 *
 * @param signature - BLS signature to verify
 * @param message - Original message
 * @param publicKey - Signer's public key
 * @returns true if signature is valid
 */
export function verifyBLSSignature(
  signature: BLSSignature,
  message: Buffer | string,
  publicKey: BLSPublicKey
): boolean {
  try {
    const messageBuffer =
      typeof message === 'string' ? Buffer.from(message, 'utf8') : message;

    // Verify signer ID matches
    if (signature.signerId !== publicKey.ownerId) {
      return false;
    }

    // Verify message hash
    const expectedHash = createHash('sha256')
      .update(messageBuffer)
      .digest('hex');
    if (signature.messageHash !== expectedHash) {
      return false;
    }

    // Look up private key from registry (simulation only)
    const privateKeyBytes = keyRegistry.get(publicKey.publicKey);
    if (!privateKeyBytes) {
      return false;
    }

    // Recompute expected signature
    const expectedSignature = createHmac('sha384', privateKeyBytes)
      .update(messageBuffer)
      .update('signature')
      .digest();

    const fullExpected = Buffer.alloc(BLS_KEY_SIZES.SIGNATURE);
    expectedSignature.copy(fullExpected, 0);

    const signatureBytes = Buffer.from(signature.signature, 'base64');

    return fullExpected.equals(signatureBytes);
  } catch {
    return false;
  }
}

/**
 * Aggregate multiple BLS signatures into a single signature
 *
 * In real BLS:
 * - Aggregate = sig1 + sig2 + ... + sigN (point addition in G2)
 * - This produces a single signature that proves all parties signed
 *
 * @param signatures - Individual signatures to aggregate
 * @returns Aggregated BLS signature
 */
export function aggregateBLSSignatures(
  signatures: BLSSignature[]
): AggregatedBLSSignature {
  if (signatures.length === 0) {
    throw new Error('Cannot aggregate empty signature list');
  }

  // Verify all signatures are for the same message
  const messageHash = signatures[0]!.messageHash;
  for (const sig of signatures) {
    if (sig.messageHash !== messageHash) {
      throw new Error('All signatures must be for the same message');
    }
  }

  // Aggregate signatures by XOR (simulates point addition)
  // In real BLS, this would be actual point addition in G2
  const aggregateBytes = Buffer.alloc(BLS_KEY_SIZES.SIGNATURE);

  for (const sig of signatures) {
    const sigBytes = Buffer.from(sig.signature, 'base64');
    for (let i = 0; i < BLS_KEY_SIZES.SIGNATURE; i++) {
      aggregateBytes[i]! ^= sigBytes[i]!;
    }
  }

  // Add deterministic component based on all signatures
  const combinedHash = createHash('sha384');
  for (const sig of signatures) {
    combinedHash.update(sig.signature);
    combinedHash.update(sig.signerId);
  }
  const hashResult = combinedHash.digest();

  // XOR with the hash for deterministic aggregation
  for (let i = 0; i < BLS_KEY_SIZES.SIGNATURE && i < hashResult.length; i++) {
    aggregateBytes[i]! ^= hashResult[i]!;
  }

  return {
    aggregateSignature: aggregateBytes.toString('base64'),
    individualSignatures: signatures,
    messageHash,
    aggregatedAt: new Date(),
    isVerified: false, // Will be verified separately
  };
}

/**
 * Verify an aggregated BLS signature
 *
 * In real BLS, uses aggregate verification:
 * e(G1, aggSig) == e(pk1 + pk2 + ..., H(message))
 *
 * @param aggregateSignature - Aggregated signature to verify
 * @param message - Original message
 * @param publicKeys - All signers' public keys
 * @returns Verified aggregate signature with isVerified set
 */
export function verifyAggregatedBLSSignature(
  aggregateSignature: AggregatedBLSSignature,
  message: Buffer | string,
  publicKeys: BLSPublicKey[]
): AggregatedBLSSignature {
  const messageBuffer =
    typeof message === 'string' ? Buffer.from(message, 'utf8') : message;

  // Verify message hash
  const expectedHash = createHash('sha256').update(messageBuffer).digest('hex');
  if (aggregateSignature.messageHash !== expectedHash) {
    return { ...aggregateSignature, isVerified: false };
  }

  // Verify each individual signature
  for (const sig of aggregateSignature.individualSignatures) {
    const signerPublicKey = publicKeys.find(
      (pk) => pk.ownerId === sig.signerId
    );
    if (!signerPublicKey) {
      return { ...aggregateSignature, isVerified: false };
    }

    if (!verifyBLSSignature(sig, message, signerPublicKey)) {
      return { ...aggregateSignature, isVerified: false };
    }
  }

  // Verify aggregate structure by recomputing
  const recomputed = aggregateBLSSignatures(
    aggregateSignature.individualSignatures
  );
  if (recomputed.aggregateSignature !== aggregateSignature.aggregateSignature) {
    return { ...aggregateSignature, isVerified: false };
  }

  return { ...aggregateSignature, isVerified: true };
}

/**
 * Create a multi-signature setup for employee and employer
 *
 * @param employeeId - Employee identifier
 * @param employerId - Employer identifier
 * @returns Key pairs for both parties
 */
export function createMultiSignatureSetup(
  employeeId: string,
  employerId: string
): {
  employee: { publicKey: BLSPublicKey; privateKey: BLSPrivateKey };
  employer: { publicKey: BLSPublicKey; privateKey: BLSPrivateKey };
} {
  const employeeKeys = generateBLSKeyPair(employeeId, 'EMPLOYEE');
  const employerKeys = generateBLSKeyPair(employerId, 'EMPLOYER');

  return {
    employee: employeeKeys,
    employer: employerKeys,
  };
}

/**
 * Sign document with both parties and create aggregate signature
 *
 * @param document - Document to sign
 * @param employeePrivateKey - Employee's private key
 * @param employerPrivateKey - Employer's private key
 * @returns Aggregated signature from both parties
 */
export function coSignDocument(
  document: Buffer | string,
  employeePrivateKey: BLSPrivateKey,
  employerPrivateKey: BLSPrivateKey
): AggregatedBLSSignature {
  const employeeSignature = signBLS(document, employeePrivateKey, 'EMPLOYEE');
  const employerSignature = signBLS(document, employerPrivateKey, 'EMPLOYER');

  return aggregateBLSSignatures([employeeSignature, employerSignature]);
}

/**
 * Verify that a document was co-signed by both employee and employer
 *
 * @param document - Original document
 * @param aggregateSignature - Aggregate signature to verify
 * @param employeePublicKey - Employee's public key
 * @param employerPublicKey - Employer's public key
 * @returns true if both parties signed and signature is valid
 */
export function verifyCoSignedDocument(
  document: Buffer | string,
  aggregateSignature: AggregatedBLSSignature,
  employeePublicKey: BLSPublicKey,
  employerPublicKey: BLSPublicKey
): boolean {
  // Check that both parties signed
  const hasEmployeeSignature = aggregateSignature.individualSignatures.some(
    (s: BLSSignature) => s.signerType === 'EMPLOYEE'
  );
  const hasEmployerSignature = aggregateSignature.individualSignatures.some(
    (s: BLSSignature) => s.signerType === 'EMPLOYER'
  );

  if (!hasEmployeeSignature || !hasEmployerSignature) {
    return false;
  }

  // Verify the aggregate signature
  const verified = verifyAggregatedBLSSignature(aggregateSignature, document, [
    employeePublicKey,
    employerPublicKey,
  ]);

  return verified.isVerified;
}
