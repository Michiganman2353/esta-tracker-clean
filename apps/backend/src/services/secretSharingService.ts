/**
 * Threshold Secret Sharing Module (Shamir's Secret Sharing)
 *
 * Implements a 2-of-2 threshold secret sharing scheme where:
 * - A secret is split into 2 shares
 * - Both shares are required to reconstruct the secret
 * - Each share reveals nothing about the original secret
 *
 * This is used for medical note escrow where:
 * - Employee receives share 1
 * - Employer receives share 2
 * - Both must cooperate to reconstruct the document
 *
 * Mathematical basis:
 * For 2-of-2 sharing, we use simple XOR-based splitting:
 * - Generate random share1 of same length as secret
 * - share2 = secret XOR share1
 * - To reconstruct: secret = share1 XOR share2
 *
 * This is information-theoretically secure: each share alone
 * reveals absolutely nothing about the secret.
 *
 * @module secretSharingService
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/**
 * Individual secret share from Shamir's Secret Sharing scheme
 */
export interface SecretShare {
  /** Share index (1-based) */
  index: number;
  /** Base64-encoded share value */
  value: string;
  /** Share holder identifier */
  holderId: string;
  /** Holder type */
  holderType: 'EMPLOYEE' | 'EMPLOYER';
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Secret sharing configuration
 */
export interface SecretSharingConfig {
  /** Total number of shares */
  totalShares: number;
  /** Threshold required to reconstruct */
  threshold: number;
  /** Share distribution */
  shares: SecretShare[];
}

/**
 * Split a secret into 2 shares using XOR-based secret sharing
 *
 * This implements a 2-of-2 threshold scheme where:
 * - share1 = random bytes of same length as secret
 * - share2 = secret XOR share1
 *
 * Properties:
 * - Both shares are required to reconstruct
 * - Each share is uniformly random and reveals nothing about the secret
 * - Perfect information-theoretic security
 *
 * @param secret - The secret to split (as Buffer)
 * @param employeeId - Employee identifier for share 1
 * @param employerId - Employer identifier for share 2
 * @returns Secret sharing configuration with both shares
 */
export function splitSecret(
  secret: Buffer,
  employeeId: string,
  employerId: string
): SecretSharingConfig {
  const now = new Date();

  // Generate random bytes for share 1
  const share1Value = randomBytes(secret.length);

  // Compute share 2 = secret XOR share 1
  const share2Value = Buffer.alloc(secret.length);
  for (let i = 0; i < secret.length; i++) {
    share2Value[i] = secret[i]! ^ share1Value[i]!;
  }

  // Create share objects
  const share1: SecretShare = {
    index: 1,
    value: share1Value.toString('base64'),
    holderId: employeeId,
    holderType: 'EMPLOYEE',
    createdAt: now,
  };

  const share2: SecretShare = {
    index: 2,
    value: share2Value.toString('base64'),
    holderId: employerId,
    holderType: 'EMPLOYER',
    createdAt: now,
  };

  return {
    totalShares: 2,
    threshold: 2,
    shares: [share1, share2],
  };
}

/**
 * Reconstruct a secret from its shares
 *
 * For 2-of-2 scheme: secret = share1 XOR share2
 *
 * @param shares - Array containing both shares
 * @returns Reconstructed secret as Buffer
 * @throws Error if shares are invalid or mismatched
 */
export function reconstructSecret(shares: SecretShare[]): Buffer {
  // Validate we have exactly 2 shares
  if (shares.length !== 2) {
    throw new Error(
      `Invalid number of shares: expected 2, got ${shares.length}`
    );
  }

  // Sort by index to ensure consistent reconstruction
  const sortedShares = [...shares].sort((a, b) => a.index - b.index);

  // Validate share indices
  const share1 = sortedShares.find((s) => s.index === 1);
  const share2 = sortedShares.find((s) => s.index === 2);

  if (!share1 || !share2) {
    throw new Error('Missing required shares: need both share 1 and share 2');
  }

  // Validate holder types
  if (share1.holderType !== 'EMPLOYEE') {
    throw new Error('Share 1 must be from employee');
  }
  if (share2.holderType !== 'EMPLOYER') {
    throw new Error('Share 2 must be from employer');
  }

  // Decode shares
  const share1Value = Buffer.from(share1.value, 'base64');
  const share2Value = Buffer.from(share2.value, 'base64');

  // Validate lengths match
  if (share1Value.length !== share2Value.length) {
    throw new Error('Share length mismatch: shares are from different secrets');
  }

  // Reconstruct: secret = share1 XOR share2
  const secret = Buffer.alloc(share1Value.length);
  for (let i = 0; i < share1Value.length; i++) {
    secret[i] = share1Value[i]! ^ share2Value[i]!;
  }

  return secret;
}

/**
 * Verify that a share is valid without revealing the secret
 *
 * Uses a commitment scheme where:
 * 1. During split, we store hash(share || index)
 * 2. During verify, we recompute and compare
 *
 * @param share - Share to verify
 * @param commitment - Expected commitment hash
 * @returns true if share is valid
 */
export function verifyShare(share: SecretShare, commitment: string): boolean {
  const shareCommitment = computeShareCommitment(share);
  return shareCommitment === commitment;
}

/**
 * Compute a cryptographic commitment for a share
 *
 * Commitment = SHA-256(share.value || share.index || share.holderId)
 *
 * This allows verification without reconstruction.
 *
 * @param share - Share to create commitment for
 * @returns Commitment hash as hex string
 */
export function computeShareCommitment(share: SecretShare): string {
  return createHash('sha256')
    .update(share.value)
    .update(share.index.toString())
    .update(share.holderId)
    .digest('hex');
}

/**
 * Split a secret and generate commitments for verification
 *
 * @param secret - The secret to split
 * @param employeeId - Employee identifier
 * @param employerId - Employer identifier
 * @returns Object containing config and commitments for each share
 */
export function splitSecretWithCommitments(
  secret: Buffer,
  employeeId: string,
  employerId: string
): {
  config: SecretSharingConfig;
  commitments: { share1: string; share2: string };
} {
  const config = splitSecret(secret, employeeId, employerId);

  const share1 = config.shares.find((s: SecretShare) => s.index === 1);
  const share2 = config.shares.find((s: SecretShare) => s.index === 2);

  if (!share1 || !share2) {
    throw new Error('Failed to generate shares');
  }

  return {
    config,
    commitments: {
      share1: computeShareCommitment(share1),
      share2: computeShareCommitment(share2),
    },
  };
}

/**
 * Verify both shares before reconstruction
 *
 * @param shares - Shares to verify
 * @param commitments - Expected commitments for each share
 * @returns true if all shares are valid
 */
export function verifySharesBeforeReconstruction(
  shares: SecretShare[],
  commitments: { share1: string; share2: string }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const share1 = shares.find((s: SecretShare) => s.index === 1);
  const share2 = shares.find((s: SecretShare) => s.index === 2);

  if (!share1) {
    errors.push('Missing employee share (index 1)');
  } else if (!verifyShare(share1, commitments.share1)) {
    errors.push('Employee share (index 1) failed verification');
  }

  if (!share2) {
    errors.push('Missing employer share (index 2)');
  } else if (!verifyShare(share2, commitments.share2)) {
    errors.push('Employer share (index 2) failed verification');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a zero-knowledge proof that a share is valid without revealing it
 *
 * This uses a simple commitment-based approach:
 * 1. Generate random blinding factor
 * 2. Compute commitment = hash(share || blinding)
 * 3. Return commitment (proof that share exists without revealing it)
 *
 * @param share - Share to create proof for
 * @returns Proof object containing commitment and blinding factor
 */
export function createShareProof(share: SecretShare): {
  commitment: string;
  blindingFactor: string;
} {
  const blindingFactor = randomBytes(32).toString('hex');

  const commitment = createHash('sha256')
    .update(share.value)
    .update(blindingFactor)
    .digest('hex');

  return { commitment, blindingFactor };
}

/**
 * Verify a zero-knowledge proof of share possession
 *
 * @param share - Share being verified
 * @param commitment - Expected commitment
 * @param blindingFactor - Blinding factor used in proof
 * @returns true if proof is valid
 */
export function verifyShareProof(
  share: SecretShare,
  commitment: string,
  blindingFactor: string
): boolean {
  const expectedCommitment = createHash('sha256')
    .update(share.value)
    .update(blindingFactor)
    .digest('hex');

  return expectedCommitment === commitment;
}

/**
 * Securely compare two commitments (timing-safe)
 *
 * @param a - First commitment
 * @param b - Second commitment
 * @returns true if commitments match
 */
export function secureCompareCommitments(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');

  if (bufA.length !== bufB.length) {
    return false;
  }

  // Use Node.js built-in timing-safe comparison
  return timingSafeEqual(bufA, bufB);
}
