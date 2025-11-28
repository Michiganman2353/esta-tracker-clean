/**
 * Argon2id Key Derivation Tests
 *
 * Tests for passphrase-based key derivation using Argon2id.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveKeyFromPassphrase,
  verifyPassphrase,
  rederiveKey,
  constantTimeKeyCompare,
  generateSecurePassphrase,
  needsUpgrade,
  upgradeKeyDerivation,
  ARGON2_CONFIG,
  KEY_DERIVATION_VERSION,
} from '../argon2KeyDerivation';

describe('Argon2id Key Derivation Service', () => {
  describe('deriveKeyFromPassphrase', () => {
    it('should derive a 32-byte key from passphrase', async () => {
      const result = await deriveKeyFromPassphrase('TestPassphrase123!');

      expect(result.key).toBeInstanceOf(Buffer);
      expect(result.key.length).toBe(32); // 256 bits for AES-256
    });

    it('should include salt in result', async () => {
      const result = await deriveKeyFromPassphrase('TestPassphrase123!');

      expect(result.salt).toBeInstanceOf(Buffer);
      expect(result.salt.length).toBe(ARGON2_CONFIG.saltLength);
    });

    it('should include verification hash', async () => {
      const result = await deriveKeyFromPassphrase('TestPassphrase123!');

      expect(result.hash).toBeTruthy();
      expect(result.hash).toContain('$argon2id$');
    });

    it('should include version and algorithm', async () => {
      const result = await deriveKeyFromPassphrase('TestPassphrase123!');

      expect(result.version).toBe(KEY_DERIVATION_VERSION);
      expect(result.algorithm).toBe('argon2id');
    });

    it('should derive different keys with different salts', async () => {
      const result1 = await deriveKeyFromPassphrase('SamePassphrase123!');
      const result2 = await deriveKeyFromPassphrase('SamePassphrase123!');

      // Different salts (random)
      expect(result1.salt.equals(result2.salt)).toBe(false);
      // Therefore different keys
      expect(result1.key.equals(result2.key)).toBe(false);
    });

    it('should derive same key with same salt', async () => {
      const salt = Buffer.from('1234567890123456'); // 16 bytes
      const result1 = await deriveKeyFromPassphrase('SamePassphrase123!', salt);
      const result2 = await deriveKeyFromPassphrase('SamePassphrase123!', salt);

      expect(result1.key.equals(result2.key)).toBe(true);
    });

    it('should reject short passphrases', async () => {
      await expect(deriveKeyFromPassphrase('short')).rejects.toThrow(
        'at least 8 characters and 8 bytes'
      );
    });

    it('should reject empty passphrases', async () => {
      await expect(deriveKeyFromPassphrase('')).rejects.toThrow('required');
    });

    it('should handle unicode passphrases', async () => {
      const result = await deriveKeyFromPassphrase('密码测试パスワード🔐');

      expect(result.key.length).toBe(32);
    });

    it('should handle very long passphrases', async () => {
      const longPassphrase = 'A'.repeat(1000);
      const result = await deriveKeyFromPassphrase(longPassphrase);

      expect(result.key.length).toBe(32);
    });
  });

  describe('verifyPassphrase', () => {
    it('should verify correct passphrase', async () => {
      const passphrase = 'MySecurePassphrase!123';
      const result = await deriveKeyFromPassphrase(passphrase);

      const isValid = await verifyPassphrase(passphrase, result.hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passphrase', async () => {
      const passphrase = 'MySecurePassphrase!123';
      const result = await deriveKeyFromPassphrase(passphrase);

      const isValid = await verifyPassphrase('WrongPassphrase', result.hash);
      expect(isValid).toBe(false);
    });

    it('should reject passphrase with wrong case', async () => {
      const passphrase = 'CaseSensitivePass123';
      const result = await deriveKeyFromPassphrase(passphrase);

      const isValid = await verifyPassphrase(
        'casesensitivepass123',
        result.hash
      );
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash gracefully', async () => {
      const isValid = await verifyPassphrase('anypassphrase', 'invalid-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('rederiveKey', () => {
    it('should rederive key from stored material', async () => {
      const passphrase = 'MyStoredPassphrase!456';
      const original = await deriveKeyFromPassphrase(passphrase);

      const storedMaterial = {
        salt: original.salt.toString('base64'),
        hash: original.hash,
        version: original.version,
        algorithm: original.algorithm,
      };

      const rederived = await rederiveKey(passphrase, storedMaterial);

      expect(constantTimeKeyCompare(original.key, rederived.key)).toBe(true);
    });

    it('should reject wrong passphrase', async () => {
      const passphrase = 'CorrectPassphrase!789';
      const original = await deriveKeyFromPassphrase(passphrase);

      const storedMaterial = {
        salt: original.salt.toString('base64'),
        hash: original.hash,
        version: original.version,
        algorithm: original.algorithm,
      };

      await expect(
        rederiveKey('WrongPassphrase', storedMaterial)
      ).rejects.toThrow('Invalid passphrase');
    });
  });

  describe('constantTimeKeyCompare', () => {
    it('should return true for equal keys', () => {
      const key = Buffer.from('0123456789abcdef0123456789abcdef');
      expect(constantTimeKeyCompare(key, key)).toBe(true);
    });

    it('should return true for equal content, different buffers', () => {
      const key1 = Buffer.from('0123456789abcdef0123456789abcdef');
      const key2 = Buffer.from('0123456789abcdef0123456789abcdef');
      expect(constantTimeKeyCompare(key1, key2)).toBe(true);
    });

    it('should return false for different keys', () => {
      const key1 = Buffer.from('0123456789abcdef0123456789abcdef');
      const key2 = Buffer.from('0123456789abcdef0123456789abcdee');
      expect(constantTimeKeyCompare(key1, key2)).toBe(false);
    });

    it('should return false for different length keys', () => {
      const key1 = Buffer.from('0123456789abcdef');
      const key2 = Buffer.from('0123456789abcdef0123456789abcdef');
      expect(constantTimeKeyCompare(key1, key2)).toBe(false);
    });
  });

  describe('generateSecurePassphrase', () => {
    it('should generate base64 passphrase', () => {
      const passphrase = generateSecurePassphrase();
      expect(typeof passphrase).toBe('string');
      // Should be valid base64
      expect(() => Buffer.from(passphrase, 'base64')).not.toThrow();
    });

    it('should generate passphrases of correct length', () => {
      const passphrase32 = generateSecurePassphrase(32);
      const passphrase64 = generateSecurePassphrase(64);

      // Base64 encoding adds ~33% overhead
      expect(Buffer.from(passphrase32, 'base64').length).toBe(32);
      expect(Buffer.from(passphrase64, 'base64').length).toBe(64);
    });

    it('should generate unique passphrases', () => {
      const passphrases = new Set<string>();
      for (let i = 0; i < 100; i++) {
        passphrases.add(generateSecurePassphrase());
      }
      expect(passphrases.size).toBe(100);
    });
  });

  describe('needsUpgrade', () => {
    it('should return false for current version', () => {
      const material = {
        salt: 'test',
        hash: 'test',
        version: KEY_DERIVATION_VERSION,
        algorithm: 'argon2id' as const,
      };
      expect(needsUpgrade(material)).toBe(false);
    });

    it('should return true for old version', () => {
      const material = {
        salt: 'test',
        hash: 'test',
        version: 'ARGON2ID-v0.9',
        algorithm: 'argon2id' as const,
      };
      expect(needsUpgrade(material)).toBe(true);
    });
  });

  describe('upgradeKeyDerivation', () => {
    it('should upgrade key with valid passphrase', async () => {
      const passphrase = 'UpgradeTest!123';
      const original = await deriveKeyFromPassphrase(passphrase);

      const oldMaterial = {
        salt: original.salt.toString('base64'),
        hash: original.hash,
        version: 'ARGON2ID-v0.9', // Simulated old version
        algorithm: original.algorithm,
      };

      const upgraded = await upgradeKeyDerivation(passphrase, oldMaterial);

      expect(upgraded.version).toBe(KEY_DERIVATION_VERSION);
      expect(upgraded.key.length).toBe(32);
    });

    it('should reject wrong passphrase during upgrade', async () => {
      const passphrase = 'UpgradeTest!456';
      const original = await deriveKeyFromPassphrase(passphrase);

      const oldMaterial = {
        salt: original.salt.toString('base64'),
        hash: original.hash,
        version: 'ARGON2ID-v0.9',
        algorithm: original.algorithm,
      };

      await expect(
        upgradeKeyDerivation('WrongPassphrase', oldMaterial)
      ).rejects.toThrow('Invalid passphrase');
    });
  });
});
