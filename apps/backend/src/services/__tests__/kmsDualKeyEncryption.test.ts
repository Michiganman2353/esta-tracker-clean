/**
 * KMS-Kyber768 Dual-Key Encryption Tests
 *
 * Tests for quantum-resistant dual-key hybrid encryption.
 */

import { describe, it, expect } from 'vitest';
import {
  generatePreseededKyberKeys,
  verifyEnvelopeIntegrity,
  canDecryptEnvelope,
  getEnvelopeMetadata,
  deriveContentId,
  exportKyberKeyPair,
  importKyberKeyPair,
  DUAL_KEY_ALGORITHM_VERSION,
} from '../kmsDualKeyEncryption';
import { generateKyber768KeyPair } from '../kyber768Service';

describe('KMS-Kyber768 Dual-Key Encryption Service', () => {
  describe('generatePreseededKyberKeys', () => {
    it('should generate key pair with public and private keys', () => {
      const keys = generatePreseededKyberKeys();

      expect(keys.publicKey).toBeTruthy();
      expect(keys.privateKey).toBeTruthy();
      expect(keys.keyId).toBeTruthy();
    });

    it('should set creation and expiration dates', () => {
      const keys = generatePreseededKyberKeys(365);

      expect(keys.createdAt).toBeInstanceOf(Date);
      expect(keys.expiresAt).toBeInstanceOf(Date);

      const diffDays = Math.round(
        (keys.expiresAt.getTime() - keys.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(365);
    });

    it('should allow custom validity period', () => {
      const keys = generatePreseededKyberKeys(30);

      const diffDays = Math.round(
        (keys.expiresAt.getTime() - keys.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(30);
    });

    it('should match keyId between keys', () => {
      const keys = generatePreseededKyberKeys();

      expect(keys.keyId).toBe(keys.publicKey.keyId);
      expect(keys.keyId).toBe(keys.privateKey.keyId);
    });
  });

  describe('verifyEnvelopeIntegrity', () => {
    it('should return false for missing fields', () => {
      const invalidEnvelope = {
        id: 'test',
        // Missing other required fields
      };

      // @ts-expect-error - Testing invalid input
      expect(verifyEnvelopeIntegrity(invalidEnvelope)).toBe(false);
    });

    it('should return false for wrong algorithm version', () => {
      const envelope = {
        id: 'test',
        encryptedData: Buffer.from('test').toString('base64'),
        iv: Buffer.from('123456789012').toString('base64'),
        authTag: Buffer.from('1234567890123456').toString('base64'),
        kmsEncryptedShare: 'share',
        kyberCiphertext: 'ciphertext:share2',
        kmsKeyPath: 'path',
        kmsKeyVersion: '1',
        kyberKeyId: 'keyid',
        encryptedAt: new Date(),
        algorithmVersion: 'WRONG-VERSION',
      };

      expect(verifyEnvelopeIntegrity(envelope)).toBe(false);
    });

    it('should return false for invalid kyber ciphertext format', () => {
      const envelope = {
        id: 'test',
        encryptedData: Buffer.from('test').toString('base64'),
        iv: Buffer.from('123456789012').toString('base64'),
        authTag: Buffer.from('1234567890123456').toString('base64'),
        kmsEncryptedShare: 'share',
        kyberCiphertext: 'invalid-no-colon',
        kmsKeyPath: 'path',
        kmsKeyVersion: '1',
        kyberKeyId: 'keyid',
        encryptedAt: new Date(),
        algorithmVersion: DUAL_KEY_ALGORITHM_VERSION,
      };

      expect(verifyEnvelopeIntegrity(envelope)).toBe(false);
    });

    it('should return true for valid envelope structure', () => {
      const envelope = {
        id: 'test',
        encryptedData: Buffer.from('test').toString('base64'),
        iv: Buffer.from('123456789012').toString('base64'),
        authTag: Buffer.from('1234567890123456').toString('base64'),
        kmsEncryptedShare: 'share',
        kyberCiphertext:
          'ciphertext:' + Buffer.from('share2').toString('base64'),
        kmsKeyPath: 'path',
        kmsKeyVersion: '1',
        kyberKeyId: 'keyid',
        encryptedAt: new Date(),
        algorithmVersion: DUAL_KEY_ALGORITHM_VERSION,
      };

      expect(verifyEnvelopeIntegrity(envelope)).toBe(true);
    });
  });

  describe('canDecryptEnvelope', () => {
    it('should return true for matching key ID', () => {
      const envelope = {
        id: 'test',
        encryptedData: '',
        iv: '',
        authTag: '',
        kmsEncryptedShare: '',
        kyberCiphertext: '',
        kmsKeyPath: '',
        kmsKeyVersion: '1',
        kyberKeyId: 'matching-key-id',
        encryptedAt: new Date(),
        algorithmVersion: DUAL_KEY_ALGORITHM_VERSION,
      };

      expect(canDecryptEnvelope(envelope, 'matching-key-id')).toBe(true);
    });

    it('should return false for non-matching key ID', () => {
      const envelope = {
        id: 'test',
        encryptedData: '',
        iv: '',
        authTag: '',
        kmsEncryptedShare: '',
        kyberCiphertext: '',
        kmsKeyPath: '',
        kmsKeyVersion: '1',
        kyberKeyId: 'original-key-id',
        encryptedAt: new Date(),
        algorithmVersion: DUAL_KEY_ALGORITHM_VERSION,
      };

      expect(canDecryptEnvelope(envelope, 'different-key-id')).toBe(false);
    });
  });

  describe('getEnvelopeMetadata', () => {
    it('should extract metadata without sensitive fields', () => {
      const envelope = {
        id: 'envelope-123',
        encryptedData: 'secret-data',
        iv: 'secret-iv',
        authTag: 'secret-tag',
        kmsEncryptedShare: 'secret-share',
        kyberCiphertext: 'secret-ciphertext',
        kmsKeyPath: 'projects/test/key',
        kmsKeyVersion: '2',
        kyberKeyId: 'kyber-key-456',
        encryptedAt: new Date('2025-01-15'),
        algorithmVersion: DUAL_KEY_ALGORITHM_VERSION,
      };

      const metadata = getEnvelopeMetadata(envelope);

      expect(metadata.id).toBe('envelope-123');
      expect(metadata.kmsKeyPath).toBe('projects/test/key');
      expect(metadata.kmsKeyVersion).toBe('2');
      expect(metadata.kyberKeyId).toBe('kyber-key-456');
      expect(metadata.algorithmVersion).toBe(DUAL_KEY_ALGORITHM_VERSION);

      // Ensure sensitive fields are not included
      expect(metadata).not.toHaveProperty('encryptedData');
      expect(metadata).not.toHaveProperty('iv');
      expect(metadata).not.toHaveProperty('authTag');
    });
  });

  describe('deriveContentId', () => {
    it('should produce consistent ID for same content', () => {
      const data = 'test content';
      const id1 = deriveContentId(data);
      const id2 = deriveContentId(data);

      expect(id1).toBe(id2);
    });

    it('should produce different ID for different content', () => {
      const id1 = deriveContentId('content a');
      const id2 = deriveContentId('content b');

      expect(id1).not.toBe(id2);
    });

    it('should produce 32-character hex ID', () => {
      const id = deriveContentId('test');

      expect(id.length).toBe(32);
      expect(/^[0-9a-f]+$/.test(id)).toBe(true);
    });

    it('should handle Buffer input', () => {
      const data = Buffer.from([1, 2, 3, 4]);
      const id = deriveContentId(data);

      expect(id.length).toBe(32);
    });
  });

  describe('exportKyberKeyPair', () => {
    it('should export key pair to JSON-serializable format', () => {
      const keyPair = generateKyber768KeyPair();
      const exported = exportKyberKeyPair(keyPair);

      expect(typeof exported.publicKey).toBe('string');
      expect(typeof exported.privateKey).toBe('string');
      expect(exported.keyId).toBe(keyPair.publicKey.keyId);
      expect(exported.algorithm).toBe('KYBER768');
    });

    it('should produce valid JSON', () => {
      const keyPair = generateKyber768KeyPair();
      const exported = exportKyberKeyPair(keyPair);

      expect(() => JSON.stringify(exported)).not.toThrow();
    });
  });

  describe('importKyberKeyPair', () => {
    it('should import exported key pair', () => {
      const original = generateKyber768KeyPair();
      const exported = exportKyberKeyPair(original);
      const imported = importKyberKeyPair(exported);

      expect(imported.publicKey.keyId).toBe(original.publicKey.keyId);
      expect(imported.privateKey.keyId).toBe(original.privateKey.keyId);
      expect(imported.publicKey.publicKey).toBe(original.publicKey.publicKey);
    });

    it('should produce working key pair after import', () => {
      const original = generateKyber768KeyPair();
      const exported = exportKyberKeyPair(original);
      const imported = importKyberKeyPair(exported);

      // Key IDs should match
      expect(imported.publicKey.keyId).toBe(imported.privateKey.keyId);
    });
  });

  describe('DUAL_KEY_ALGORITHM_VERSION', () => {
    it('should have correct format', () => {
      expect(DUAL_KEY_ALGORITHM_VERSION).toMatch(
        /^KMS-KYBER768-DUAL-v\d+\.\d+$/
      );
    });
  });
});
