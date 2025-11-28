/**
 * Kyber768 Post-Quantum Encryption Service Tests
 *
 * Tests the Kyber768 key generation, encapsulation, decapsulation,
 * and quantum-safe envelope operations.
 */

import { describe, it, expect } from 'vitest';
import {
  generateKyber768KeyPair,
  kyber768Encapsulate,
  kyber768Decapsulate,
  createQuantumSafeEnvelope,
  openQuantumSafeEnvelope,
  verifyKyber768KeyPair,
  KYBER768_KEY_SIZES,
  KYBER768_ALGORITHM_VERSION,
} from '../kyber768Service';

describe('Kyber768 Post-Quantum Encryption Service', () => {
  describe('generateKyber768KeyPair', () => {
    it('should generate a valid key pair', () => {
      const keyPair = generateKyber768KeyPair();

      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair.publicKey.algorithm).toBe('KYBER768');
      expect(keyPair.privateKey.algorithm).toBe('KYBER768');
    });

    it('should generate keys with correct sizes', () => {
      const keyPair = generateKyber768KeyPair();

      const publicKeyBytes = Buffer.from(keyPair.publicKey.publicKey, 'base64');
      const privateKeyBytes = Buffer.from(
        keyPair.privateKey.privateKey,
        'base64'
      );

      expect(publicKeyBytes.length).toBe(KYBER768_KEY_SIZES.PUBLIC_KEY);
      expect(privateKeyBytes.length).toBe(KYBER768_KEY_SIZES.PRIVATE_KEY);
    });

    it('should generate unique key pairs', () => {
      const keyPair1 = generateKyber768KeyPair();
      const keyPair2 = generateKyber768KeyPair();

      expect(keyPair1.publicKey.keyId).not.toBe(keyPair2.publicKey.keyId);
      expect(keyPair1.publicKey.publicKey).not.toBe(
        keyPair2.publicKey.publicKey
      );
    });

    it('should have matching key IDs in public and private keys', () => {
      const keyPair = generateKyber768KeyPair();

      expect(keyPair.publicKey.keyId).toBe(keyPair.privateKey.keyId);
    });

    it('should include creation timestamps', () => {
      const before = new Date();
      const keyPair = generateKyber768KeyPair();
      const after = new Date();

      expect(keyPair.publicKey.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(keyPair.publicKey.createdAt.getTime()).toBeLessThanOrEqual(
        after.getTime()
      );
    });
  });

  describe('kyber768Encapsulate', () => {
    it('should encapsulate and produce ciphertext and shared secret', () => {
      const keyPair = generateKyber768KeyPair();
      const encapsulation = kyber768Encapsulate(keyPair.publicKey);

      expect(encapsulation).toHaveProperty('ciphertext');
      expect(encapsulation).toHaveProperty('sharedSecret');
    });

    it('should produce ciphertext with correct size', () => {
      const keyPair = generateKyber768KeyPair();
      const encapsulation = kyber768Encapsulate(keyPair.publicKey);

      const ciphertextBytes = Buffer.from(encapsulation.ciphertext, 'base64');
      expect(ciphertextBytes.length).toBe(KYBER768_KEY_SIZES.CIPHERTEXT);
    });

    it('should produce shared secret with correct size', () => {
      const keyPair = generateKyber768KeyPair();
      const encapsulation = kyber768Encapsulate(keyPair.publicKey);

      const secretBytes = Buffer.from(encapsulation.sharedSecret, 'base64');
      expect(secretBytes.length).toBe(KYBER768_KEY_SIZES.SHARED_SECRET);
    });

    it('should produce different encapsulations each time', () => {
      const keyPair = generateKyber768KeyPair();

      const encap1 = kyber768Encapsulate(keyPair.publicKey);
      const encap2 = kyber768Encapsulate(keyPair.publicKey);

      expect(encap1.sharedSecret).not.toBe(encap2.sharedSecret);
      expect(encap1.ciphertext).not.toBe(encap2.ciphertext);
    });
  });

  describe('kyber768Decapsulate', () => {
    it('should decapsulate and recover the shared secret', () => {
      const keyPair = generateKyber768KeyPair();
      const encapsulation = kyber768Encapsulate(keyPair.publicKey);

      const recoveredSecret = kyber768Decapsulate(
        encapsulation.ciphertext,
        keyPair.privateKey,
        keyPair.publicKey
      );

      expect(recoveredSecret).toBe(encapsulation.sharedSecret);
    });

    it('should produce wrong secret with different key pair', () => {
      const keyPair1 = generateKyber768KeyPair();
      const keyPair2 = generateKyber768KeyPair();

      const encapsulation = kyber768Encapsulate(keyPair1.publicKey);

      // Using keyPair2 to decapsulate should produce a different (wrong) secret
      // since the ciphertext was created with keyPair1's public key
      const recoveredSecret = kyber768Decapsulate(
        encapsulation.ciphertext,
        keyPair2.privateKey,
        keyPair2.publicKey
      );

      // The recovered secret will be wrong because we're using wrong keys
      expect(recoveredSecret).not.toBe(encapsulation.sharedSecret);
    });

    it('should fail with invalid ciphertext length', () => {
      const keyPair = generateKyber768KeyPair();
      const invalidCiphertext = Buffer.alloc(100).toString('base64');

      expect(() => {
        kyber768Decapsulate(
          invalidCiphertext,
          keyPair.privateKey,
          keyPair.publicKey
        );
      }).toThrow('Invalid ciphertext length');
    });
  });

  describe('createQuantumSafeEnvelope', () => {
    it('should create envelope from string data', () => {
      const keyPair = generateKyber768KeyPair();
      const data = 'sensitive medical information';

      const envelope = createQuantumSafeEnvelope(data, keyPair.publicKey);

      expect(envelope).toHaveProperty('id');
      expect(envelope).toHaveProperty('kyberCiphertext');
      expect(envelope).toHaveProperty('encryptedData');
      expect(envelope).toHaveProperty('iv');
      expect(envelope).toHaveProperty('authTag');
      expect(envelope.keyId).toBe(keyPair.publicKey.keyId);
      expect(envelope.algorithmVersion).toBe(KYBER768_ALGORITHM_VERSION);
    });

    it('should create envelope from Buffer data', () => {
      const keyPair = generateKyber768KeyPair();
      const data = Buffer.from([0x01, 0x02, 0x03, 0x04]);

      const envelope = createQuantumSafeEnvelope(data, keyPair.publicKey);

      expect(envelope.encryptedData).toBeTruthy();
    });

    it('should produce unique envelopes for same data', () => {
      const keyPair = generateKyber768KeyPair();
      const data = 'test data';

      const envelope1 = createQuantumSafeEnvelope(data, keyPair.publicKey);
      const envelope2 = createQuantumSafeEnvelope(data, keyPair.publicKey);

      expect(envelope1.id).not.toBe(envelope2.id);
      expect(envelope1.iv).not.toBe(envelope2.iv);
      expect(envelope1.encryptedData).not.toBe(envelope2.encryptedData);
    });
  });

  describe('openQuantumSafeEnvelope', () => {
    it('should decrypt envelope and recover original string data', () => {
      const keyPair = generateKyber768KeyPair();
      const originalData = 'sensitive medical information';

      const envelope = createQuantumSafeEnvelope(
        originalData,
        keyPair.publicKey
      );
      const decrypted = openQuantumSafeEnvelope(
        envelope,
        keyPair.privateKey,
        keyPair.publicKey
      );

      expect(decrypted.toString('utf8')).toBe(originalData);
    });

    it('should decrypt envelope and recover original Buffer data', () => {
      const keyPair = generateKyber768KeyPair();
      const originalData = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header

      const envelope = createQuantumSafeEnvelope(
        originalData,
        keyPair.publicKey
      );
      const decrypted = openQuantumSafeEnvelope(
        envelope,
        keyPair.privateKey,
        keyPair.publicKey
      );

      expect(Buffer.compare(decrypted, originalData)).toBe(0);
    });

    it('should handle large data', () => {
      const keyPair = generateKyber768KeyPair();
      const originalData = Buffer.alloc(1024 * 100); // 100KB
      for (let i = 0; i < originalData.length; i++) {
        originalData[i] = i % 256;
      }

      const envelope = createQuantumSafeEnvelope(
        originalData,
        keyPair.publicKey
      );
      const decrypted = openQuantumSafeEnvelope(
        envelope,
        keyPair.privateKey,
        keyPair.publicKey
      );

      expect(Buffer.compare(decrypted, originalData)).toBe(0);
    });

    it('should fail with wrong key pair', () => {
      const keyPair1 = generateKyber768KeyPair();
      const keyPair2 = generateKyber768KeyPair();
      const data = 'test';

      const envelope = createQuantumSafeEnvelope(data, keyPair1.publicKey);

      expect(() => {
        openQuantumSafeEnvelope(
          envelope,
          keyPair2.privateKey,
          keyPair2.publicKey
        );
      }).toThrow('Key ID mismatch');
    });

    it('should fail with tampered encrypted data', () => {
      const keyPair = generateKyber768KeyPair();
      const data = 'test data';

      const envelope = createQuantumSafeEnvelope(data, keyPair.publicKey);

      // Tamper with encrypted data
      const tamperedEnvelope = {
        ...envelope,
        encryptedData: Buffer.from('tampered').toString('base64'),
      };

      expect(() => {
        openQuantumSafeEnvelope(
          tamperedEnvelope,
          keyPair.privateKey,
          keyPair.publicKey
        );
      }).toThrow();
    });
  });

  describe('verifyKyber768KeyPair', () => {
    it('should verify a valid key pair', () => {
      const keyPair = generateKyber768KeyPair();

      expect(verifyKyber768KeyPair(keyPair)).toBe(true);
    });

    it('should reject mismatched key pair', () => {
      const keyPair1 = generateKyber768KeyPair();
      const keyPair2 = generateKyber768KeyPair();

      const mixedPair = {
        publicKey: keyPair1.publicKey,
        privateKey: keyPair2.privateKey,
      };

      expect(verifyKyber768KeyPair(mixedPair)).toBe(false);
    });
  });

  describe('End-to-End Quantum-Safe Encryption', () => {
    it('should complete full encryption/decryption cycle for medical document', () => {
      const keyPair = generateKyber768KeyPair();

      // Simulate a medical document
      const medicalDocument = JSON.stringify({
        type: 'DOCTORS_NOTE',
        patient: 'John Doe',
        diagnosis: 'Flu symptoms',
        returnDate: '2025-12-01',
        issueDate: '2025-11-25',
      });

      // Encrypt
      const envelope = createQuantumSafeEnvelope(
        medicalDocument,
        keyPair.publicKey
      );

      // Verify envelope structure
      expect(envelope.keyId).toBe(keyPair.publicKey.keyId);
      expect(envelope.algorithmVersion).toBe(KYBER768_ALGORITHM_VERSION);

      // Decrypt
      const decrypted = openQuantumSafeEnvelope(
        envelope,
        keyPair.privateKey,
        keyPair.publicKey
      );

      // Verify content
      const parsedDoc = JSON.parse(decrypted.toString('utf8'));
      expect(parsedDoc.type).toBe('DOCTORS_NOTE');
      expect(parsedDoc.patient).toBe('John Doe');
    });
  });
});
