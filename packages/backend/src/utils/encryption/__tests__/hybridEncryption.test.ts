/**
 * Tests for Hybrid Encryption Module
 * 
 * Tests cover:
 * - Key pair generation
 * - Hybrid encryption/decryption (AES-GCM + RSA-OAEP)
 * - File data encryption/decryption
 * - Error handling
 * - Data integrity verification
 */

import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  encryptHybrid,
  decryptHybrid,
  encryptFileData,
  decryptFileData,
  type RSAKeyPair,
  type HybridEncryptionResult
} from '../hybridEncryption';

describe('Hybrid Encryption Module', () => {
  describe('generateKeyPair', () => {
    it('should generate RSA key pair', () => {
      const keyPair = generateKeyPair();
      
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.privateKey).toBe('string');
      expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
    });

    it('should generate unique key pairs', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });

    it('should generate key pair with custom size', () => {
      const keyPair = generateKeyPair(4096);
      
      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.privateKey).toBeTruthy();
      // 4096-bit keys are longer
      expect(keyPair.publicKey.length).toBeGreaterThan(500);
    });
  });

  describe('encryptHybrid', () => {
    it('should encrypt string data', () => {
      const { publicKey } = generateKeyPair();
      const data = 'sensitive information';
      
      const result = encryptHybrid(data, publicKey);
      
      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('encryptedAESKey');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('authTag');
      expect(typeof result.encryptedData).toBe('string');
      expect(typeof result.encryptedAESKey).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(typeof result.authTag).toBe('string');
    });

    it('should encrypt buffer data', () => {
      const { publicKey } = generateKeyPair();
      const data = Buffer.from('binary data', 'utf8');
      
      const result = encryptHybrid(data, publicKey);
      
      expect(result.encryptedData).toBeTruthy();
      expect(result.encryptedAESKey).toBeTruthy();
    });

    it('should produce different encrypted results for same data', () => {
      const { publicKey } = generateKeyPair();
      const data = 'test data';
      
      const result1 = encryptHybrid(data, publicKey);
      const result2 = encryptHybrid(data, publicKey);
      
      // Should be different due to random IV and AES key
      expect(result1.encryptedData).not.toBe(result2.encryptedData);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encryptedAESKey).not.toBe(result2.encryptedAESKey);
    });

    it('should handle empty string', () => {
      const { publicKey } = generateKeyPair();
      const data = '';
      
      const result = encryptHybrid(data, publicKey);
      
      // Empty string still produces encrypted output (with auth tag and metadata)
      expect(result.encryptedAESKey).toBeTruthy();
      expect(result.iv).toBeTruthy();
      expect(result.authTag).toBeTruthy();
    });

    it('should handle special characters and unicode', () => {
      const { publicKey } = generateKeyPair();
      const data = '🔒 Encryption test with émojis and spëcial çharacters! 你好';
      
      const result = encryptHybrid(data, publicKey);
      
      expect(result.encryptedData).toBeTruthy();
      expect(result.encryptedAESKey).toBeTruthy();
    });
  });

  describe('decryptHybrid', () => {
    it('should decrypt data correctly', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const originalData = 'sensitive information';
      
      const encrypted = encryptHybrid(originalData, publicKey);
      const decrypted = decryptHybrid(encrypted, privateKey);
      
      expect(decrypted).toBe(originalData);
    });

    it('should decrypt unicode and special characters', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const originalData = '🔒 Test émojis and 你好 special chars!';
      
      const encrypted = encryptHybrid(originalData, publicKey);
      const decrypted = decryptHybrid(encrypted, privateKey);
      
      expect(decrypted).toBe(originalData);
    });

    it('should decrypt empty string', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const originalData = '';
      
      const encrypted = encryptHybrid(originalData, publicKey);
      const decrypted = decryptHybrid(encrypted, privateKey);
      
      expect(decrypted).toBe(originalData);
    });

    it('should decrypt large text', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const originalData = 'A'.repeat(10000); // 10KB of text
      
      const encrypted = encryptHybrid(originalData, publicKey);
      const decrypted = decryptHybrid(encrypted, privateKey);
      
      expect(decrypted).toBe(originalData);
      expect(decrypted.length).toBe(10000);
    });

    it('should fail with wrong private key', () => {
      const { publicKey } = generateKeyPair();
      const { privateKey: wrongPrivateKey } = generateKeyPair();
      const data = 'test data';
      
      const encrypted = encryptHybrid(data, publicKey);
      
      expect(() => {
        decryptHybrid(encrypted, wrongPrivateKey);
      }).toThrow();
    });

    it('should fail with tampered encrypted data', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const data = 'test data';
      
      const encrypted = encryptHybrid(data, publicKey);
      
      // Tamper with encrypted data
      const tamperedEncrypted = {
        ...encrypted,
        encryptedData: Buffer.from(encrypted.encryptedData, 'base64')
          .toString('base64')
          .split('')
          .reverse()
          .join('')
      };
      
      expect(() => {
        decryptHybrid(tamperedEncrypted, privateKey);
      }).toThrow();
    });

    it('should fail with tampered auth tag', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const data = 'test data';
      
      const encrypted = encryptHybrid(data, publicKey);
      
      // Tamper with auth tag
      const tamperedEncrypted = {
        ...encrypted,
        authTag: Buffer.from('invalid-tag').toString('base64')
      };
      
      expect(() => {
        decryptHybrid(tamperedEncrypted, privateKey);
      }).toThrow();
    });

    it('should fail with invalid base64 encoding', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const data = 'test data';
      
      const encrypted = encryptHybrid(data, publicKey);
      
      const invalidEncrypted = {
        ...encrypted,
        encryptedData: 'invalid-base64!@#$%'
      };
      
      expect(() => {
        decryptHybrid(invalidEncrypted, privateKey);
      }).toThrow();
    });
  });

  describe('encryptFileData / decryptFileData', () => {
    it('should encrypt and decrypt binary file data', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const originalData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      
      const encrypted = encryptFileData(originalData, publicKey);
      const decrypted = decryptFileData(encrypted, privateKey);
      
      expect(Buffer.compare(decrypted, originalData)).toBe(0);
    });

    it('should encrypt and decrypt large binary data', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const originalData = Buffer.alloc(1024 * 100); // 100KB
      // Fill with random data
      for (let i = 0; i < originalData.length; i++) {
        originalData[i] = Math.floor(Math.random() * 256);
      }
      
      const encrypted = encryptFileData(originalData, publicKey);
      const decrypted = decryptFileData(encrypted, privateKey);
      
      expect(Buffer.compare(decrypted, originalData)).toBe(0);
      expect(decrypted.length).toBe(originalData.length);
    });

    it('should handle empty buffer', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const originalData = Buffer.alloc(0);
      
      const encrypted = encryptFileData(originalData, publicKey);
      const decrypted = decryptFileData(encrypted, privateKey);
      
      expect(Buffer.compare(decrypted, originalData)).toBe(0);
    });

    it('should preserve binary data integrity', () => {
      const { publicKey, privateKey } = generateKeyPair();
      // Create a buffer with specific byte pattern
      const originalData = Buffer.from([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8
      ]);
      
      const encrypted = encryptFileData(originalData, publicKey);
      const decrypted = decryptFileData(encrypted, privateKey);
      
      expect(Buffer.compare(decrypted, originalData)).toBe(0);
      // Verify each byte
      for (let i = 0; i < originalData.length; i++) {
        expect(decrypted[i]).toBe(originalData[i]);
      }
    });
  });

  describe('End-to-End Encryption Flow', () => {
    it('should complete full encryption/decryption cycle', () => {
      // Simulate real-world usage
      const keyPair = generateKeyPair(2048);
      
      // Encrypt sensitive employee data
      const employeeData = JSON.stringify({
        ssn: '123-45-6789',
        email: 'employee@example.com',
        phone: '555-123-4567',
        address: '123 Main St'
      });
      
      const encrypted = encryptHybrid(employeeData, keyPair.publicKey);
      
      // Store encrypted data (simulated)
      const storedData = {
        encryptedData: encrypted.encryptedData,
        encryptedAESKey: encrypted.encryptedAESKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag
      };
      
      // Later, decrypt the data
      const decrypted = decryptHybrid(storedData, keyPair.privateKey);
      const parsedData = JSON.parse(decrypted);
      
      expect(parsedData.ssn).toBe('123-45-6789');
      expect(parsedData.email).toBe('employee@example.com');
      expect(parsedData.phone).toBe('555-123-4567');
    });

    it('should handle multiple encryption operations', () => {
      const { publicKey, privateKey } = generateKeyPair();
      
      const data1 = 'First message';
      const data2 = 'Second message';
      const data3 = 'Third message';
      
      const enc1 = encryptHybrid(data1, publicKey);
      const enc2 = encryptHybrid(data2, publicKey);
      const enc3 = encryptHybrid(data3, publicKey);
      
      const dec1 = decryptHybrid(enc1, privateKey);
      const dec2 = decryptHybrid(enc2, privateKey);
      const dec3 = decryptHybrid(enc3, privateKey);
      
      expect(dec1).toBe(data1);
      expect(dec2).toBe(data2);
      expect(dec3).toBe(data3);
    });
  });

  describe('Security Properties', () => {
    it('should not leak plaintext in encrypted output', () => {
      const { publicKey } = generateKeyPair();
      const data = 'secret password 123';
      
      const encrypted = encryptHybrid(data, publicKey);
      
      // Encrypted data should not contain plaintext
      expect(encrypted.encryptedData).not.toContain('secret');
      expect(encrypted.encryptedData).not.toContain('password');
      expect(encrypted.encryptedData).not.toContain('123');
    });

    it('should produce non-deterministic encryption', () => {
      const { publicKey } = generateKeyPair();
      const data = 'test';
      
      const results = new Set<string>();
      
      // Encrypt same data multiple times
      for (let i = 0; i < 10; i++) {
        const encrypted = encryptHybrid(data, publicKey);
        results.add(encrypted.encryptedData);
      }
      
      // All results should be unique
      expect(results.size).toBe(10);
    });

    it('should use different IVs for each encryption', () => {
      const { publicKey } = generateKeyPair();
      const data = 'test';
      
      const ivs = new Set<string>();
      
      for (let i = 0; i < 10; i++) {
        const encrypted = encryptHybrid(data, publicKey);
        ivs.add(encrypted.iv);
      }
      
      // All IVs should be unique
      expect(ivs.size).toBe(10);
    });
  });
});
