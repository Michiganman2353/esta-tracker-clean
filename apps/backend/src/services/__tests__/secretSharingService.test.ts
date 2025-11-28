/**
 * Secret Sharing Service Tests
 *
 * Tests the 2-of-2 threshold secret sharing implementation
 * including splitting, reconstruction, and verification.
 */

import { describe, it, expect } from 'vitest';
import { randomBytes } from 'crypto';
import {
  splitSecret,
  reconstructSecret,
  verifyShare,
  computeShareCommitment,
  splitSecretWithCommitments,
  verifySharesBeforeReconstruction,
  createShareProof,
  verifyShareProof,
  secureCompareCommitments,
} from '../secretSharingService';

describe('Secret Sharing Service', () => {
  describe('splitSecret', () => {
    it('should split a secret into two shares', () => {
      const secret = Buffer.from('super secret data');
      const config = splitSecret(secret, 'employee-123', 'employer-456');

      expect(config.totalShares).toBe(2);
      expect(config.threshold).toBe(2);
      expect(config.shares).toHaveLength(2);
    });

    it('should assign correct indices and holder types', () => {
      const secret = Buffer.from('test');
      const config = splitSecret(secret, 'emp-1', 'org-1');

      const share1 = config.shares.find((s) => s.index === 1);
      const share2 = config.shares.find((s) => s.index === 2);

      expect(share1).toBeDefined();
      expect(share1!.holderType).toBe('EMPLOYEE');
      expect(share1!.holderId).toBe('emp-1');

      expect(share2).toBeDefined();
      expect(share2!.holderType).toBe('EMPLOYER');
      expect(share2!.holderId).toBe('org-1');
    });

    it('should generate shares of same length as secret', () => {
      const secret = Buffer.from('medium length secret data here');
      const config = splitSecret(secret, 'e', 'o');

      for (const share of config.shares) {
        const shareValue = Buffer.from(share.value, 'base64');
        expect(shareValue.length).toBe(secret.length);
      }
    });

    it('should generate different shares for same secret', () => {
      const secret = Buffer.from('test');
      const config1 = splitSecret(secret, 'e1', 'o1');
      const config2 = splitSecret(secret, 'e2', 'o2');

      expect(config1.shares[0]!.value).not.toBe(config2.shares[0]!.value);
    });

    it('should include creation timestamps', () => {
      const secret = Buffer.from('test');
      const before = new Date();
      const config = splitSecret(secret, 'e', 'o');
      const after = new Date();

      for (const share of config.shares) {
        expect(share.createdAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime()
        );
        expect(share.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      }
    });
  });

  describe('reconstructSecret', () => {
    it('should reconstruct secret from both shares', () => {
      const original = Buffer.from('the secret message');
      const config = splitSecret(original, 'e', 'o');

      const reconstructed = reconstructSecret(config.shares);

      expect(Buffer.compare(reconstructed, original)).toBe(0);
    });

    it('should reconstruct binary data correctly', () => {
      const original = randomBytes(64);
      const config = splitSecret(original, 'e', 'o');

      const reconstructed = reconstructSecret(config.shares);

      expect(Buffer.compare(reconstructed, original)).toBe(0);
    });

    it('should reconstruct regardless of share order', () => {
      const original = Buffer.from('test data');
      const config = splitSecret(original, 'e', 'o');

      // Reverse the order
      const reversed = [...config.shares].reverse();
      const reconstructed = reconstructSecret(reversed);

      expect(Buffer.compare(reconstructed, original)).toBe(0);
    });

    it('should fail with only one share', () => {
      const original = Buffer.from('test');
      const config = splitSecret(original, 'e', 'o');

      expect(() => {
        reconstructSecret([config.shares[0]!]);
      }).toThrow('Invalid number of shares');
    });

    it('should fail with missing share index 1', () => {
      const original = Buffer.from('test');
      const config = splitSecret(original, 'e', 'o');

      // Only include share 2 twice (simulating wrong shares)
      const share2 = config.shares.find((s) => s.index === 2)!;
      const wrongShares = [{ ...share2, index: 3 }, share2];

      expect(() => {
        reconstructSecret(wrongShares);
      }).toThrow('Missing required shares');
    });

    it('should fail with wrong holder types', () => {
      const original = Buffer.from('test');
      const config = splitSecret(original, 'e', 'o');

      // Modify holder type
      const modifiedShares = config.shares.map((s) => ({
        ...s,
        holderType: 'EMPLOYER' as const,
      }));

      expect(() => {
        reconstructSecret(modifiedShares);
      }).toThrow('Share 1 must be from employee');
    });
  });

  describe('computeShareCommitment', () => {
    it('should compute consistent commitment for same share', () => {
      const secret = Buffer.from('test');
      const config = splitSecret(secret, 'e', 'o');
      const share = config.shares[0]!;

      const commitment1 = computeShareCommitment(share);
      const commitment2 = computeShareCommitment(share);

      expect(commitment1).toBe(commitment2);
    });

    it('should compute different commitments for different shares', () => {
      const secret = Buffer.from('test');
      const config = splitSecret(secret, 'e', 'o');

      const commitment1 = computeShareCommitment(config.shares[0]!);
      const commitment2 = computeShareCommitment(config.shares[1]!);

      expect(commitment1).not.toBe(commitment2);
    });

    it('should produce hex-encoded hash', () => {
      const secret = Buffer.from('test');
      const config = splitSecret(secret, 'e', 'o');

      const commitment = computeShareCommitment(config.shares[0]!);

      expect(commitment).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('verifyShare', () => {
    it('should verify a valid share', () => {
      const secret = Buffer.from('test');
      const config = splitSecret(secret, 'e', 'o');
      const share = config.shares[0]!;
      const commitment = computeShareCommitment(share);

      expect(verifyShare(share, commitment)).toBe(true);
    });

    it('should reject modified share', () => {
      const secret = Buffer.from('test');
      const config = splitSecret(secret, 'e', 'o');
      const share = config.shares[0]!;
      const commitment = computeShareCommitment(share);

      // Modify the share
      const modifiedShare = { ...share, value: 'modified' };

      expect(verifyShare(modifiedShare, commitment)).toBe(false);
    });

    it('should reject wrong commitment', () => {
      const secret = Buffer.from('test');
      const config = splitSecret(secret, 'e', 'o');
      const share = config.shares[0]!;

      const wrongCommitment = 'a'.repeat(64);

      expect(verifyShare(share, wrongCommitment)).toBe(false);
    });
  });

  describe('splitSecretWithCommitments', () => {
    it('should return config and commitments', () => {
      const secret = Buffer.from('test');
      const result = splitSecretWithCommitments(secret, 'e', 'o');

      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('commitments');
      expect(result.commitments).toHaveProperty('share1');
      expect(result.commitments).toHaveProperty('share2');
    });

    it('should generate valid commitments', () => {
      const secret = Buffer.from('test');
      const { config, commitments } = splitSecretWithCommitments(
        secret,
        'e',
        'o'
      );

      const share1 = config.shares.find((s) => s.index === 1)!;
      const share2 = config.shares.find((s) => s.index === 2)!;

      expect(verifyShare(share1, commitments.share1)).toBe(true);
      expect(verifyShare(share2, commitments.share2)).toBe(true);
    });
  });

  describe('verifySharesBeforeReconstruction', () => {
    it('should pass for valid shares', () => {
      const secret = Buffer.from('test');
      const { config, commitments } = splitSecretWithCommitments(
        secret,
        'e',
        'o'
      );

      const result = verifySharesBeforeReconstruction(
        config.shares,
        commitments
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for missing shares', () => {
      const secret = Buffer.from('test');
      const { config, commitments } = splitSecretWithCommitments(
        secret,
        'e',
        'o'
      );

      const result = verifySharesBeforeReconstruction(
        [config.shares[0]!],
        commitments
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing employer share (index 2)');
    });

    it('should fail for tampered shares', () => {
      const secret = Buffer.from('test');
      const { config, commitments } = splitSecretWithCommitments(
        secret,
        'e',
        'o'
      );

      // Tamper with share 1
      const tamperedShares = [
        { ...config.shares[0]!, value: 'tampered' },
        config.shares[1]!,
      ];

      const result = verifySharesBeforeReconstruction(
        tamperedShares,
        commitments
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('failed verification'))).toBe(
        true
      );
    });
  });

  describe('createShareProof / verifyShareProof', () => {
    it('should create and verify a valid proof', () => {
      const secret = Buffer.from('test');
      const config = splitSecret(secret, 'e', 'o');
      const share = config.shares[0]!;

      const proof = createShareProof(share);

      expect(
        verifyShareProof(share, proof.commitment, proof.blindingFactor)
      ).toBe(true);
    });

    it('should produce unique proofs for same share', () => {
      const secret = Buffer.from('test');
      const config = splitSecret(secret, 'e', 'o');
      const share = config.shares[0]!;

      const proof1 = createShareProof(share);
      const proof2 = createShareProof(share);

      expect(proof1.commitment).not.toBe(proof2.commitment);
      expect(proof1.blindingFactor).not.toBe(proof2.blindingFactor);
    });

    it('should fail with wrong blinding factor', () => {
      const secret = Buffer.from('test');
      const config = splitSecret(secret, 'e', 'o');
      const share = config.shares[0]!;

      const proof = createShareProof(share);
      const wrongBlinding = 'x'.repeat(64);

      expect(verifyShareProof(share, proof.commitment, wrongBlinding)).toBe(
        false
      );
    });
  });

  describe('secureCompareCommitments', () => {
    it('should return true for matching commitments', () => {
      const commitment = 'abcd1234'.repeat(8);
      expect(secureCompareCommitments(commitment, commitment)).toBe(true);
    });

    it('should return false for different commitments', () => {
      const commitment1 = 'a'.repeat(64);
      const commitment2 = 'b'.repeat(64);
      expect(secureCompareCommitments(commitment1, commitment2)).toBe(false);
    });

    it('should return false for different lengths', () => {
      const commitment1 = 'a'.repeat(64);
      const commitment2 = 'a'.repeat(32);
      expect(secureCompareCommitments(commitment1, commitment2)).toBe(false);
    });
  });

  describe('Security Properties', () => {
    it('should not leak secret in shares', () => {
      const secret = Buffer.from('password123');
      const config = splitSecret(secret, 'e', 'o');

      for (const share of config.shares) {
        // Neither share should equal the secret
        const shareValue = Buffer.from(share.value, 'base64');
        expect(Buffer.compare(shareValue, secret)).not.toBe(0);
      }
    });

    it('should produce uniformly random shares', () => {
      // XOR of two uniformly random values should not reveal pattern
      const secret = Buffer.alloc(32, 0); // All zeros
      const config = splitSecret(secret, 'e', 'o');

      const share1 = Buffer.from(config.shares[0]!.value, 'base64');
      // share2 is not used directly, but verifies splitSecret creates two shares
      const _share2 = Buffer.from(config.shares[1]!.value, 'base64');

      // Share1 should look random (not all zeros)
      let nonZeroCount = 0;
      for (let i = 0; i < share1.length; i++) {
        if (share1[i] !== 0) nonZeroCount++;
      }

      // Expect roughly half the bytes to be non-zero (statistically)
      expect(nonZeroCount).toBeGreaterThan(8);
    });

    it('should reconstruct correctly after serialization', () => {
      const original = Buffer.from('serialization test');
      const config = splitSecret(original, 'e', 'o');

      // Serialize and deserialize
      const serialized = JSON.stringify(config);
      const deserialized = JSON.parse(serialized);

      // Fix dates
      deserialized.shares = deserialized.shares.map((s: unknown) => ({
        ...(s as object),
        createdAt: new Date((s as { createdAt: string }).createdAt),
      }));

      const reconstructed = reconstructSecret(deserialized.shares);

      expect(Buffer.compare(reconstructed, original)).toBe(0);
    });
  });
});
