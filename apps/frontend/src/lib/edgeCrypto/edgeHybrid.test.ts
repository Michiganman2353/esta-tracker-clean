/**
 * Tests for Edge Hybrid Encryption Module
 * 
 * Tests cover:
 * - RSA key pair generation and export/import
 * - Hybrid encryption/decryption (AES-GCM + RSA-OAEP)
 * - Binary data encryption/decryption
 * - Error handling
 * - Web Crypto API compatibility
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateEdgeRSAKeys,
  exportEdgeRSAKeyPair,
  importEdgeRSAKeyPair,
  importEdgePublicKey,
  importEdgePrivateKey,
  edgeEncryptHybrid,
  edgeDecryptHybrid,
  edgeEncryptBinaryData,
  edgeDecryptBinaryData,
  edgeEncryptFile,
  type EdgeRSAKeyPair,
  type ExportableEdgeRSAKeyPair
} from './edgeHybrid';

describe('Edge Hybrid Encryption Module', () => {
  let testKeyPair: EdgeRSAKeyPair;
  let exportedKeyPair: ExportableEdgeRSAKeyPair;

  beforeAll(async () => {
    // Generate key pair for tests
    testKeyPair = await generateEdgeRSAKeys();
    exportedKeyPair = await exportEdgeRSAKeyPair(testKeyPair);
  });

  describe('generateEdgeRSAKeys', () => {
    it('should generate RSA key pair', async () => {
      const keyPair = await generateEdgeRSAKeys();
      
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair.publicKey).toBeInstanceOf(CryptoKey);
      expect(keyPair.privateKey).toBeInstanceOf(CryptoKey);
      expect(keyPair.publicKey.type).toBe('public');
      expect(keyPair.privateKey.type).toBe('private');
    });

    it('should generate unique key pairs', async () => {
      const keyPair1 = await generateEdgeRSAKeys();
      const keyPair2 = await generateEdgeRSAKeys();
      
      const exported1 = await exportEdgeRSAKeyPair(keyPair1);
      const exported2 = await exportEdgeRSAKeyPair(keyPair2);
      
      expect(JSON.stringify(exported1.publicKey)).not.toBe(JSON.stringify(exported2.publicKey));
      expect(JSON.stringify(exported1.privateKey)).not.toBe(JSON.stringify(exported2.privateKey));
    });

    it('should generate key pair with custom size', async () => {
      const keyPair = await generateEdgeRSAKeys(4096);
      
      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.privateKey).toBeTruthy();
    });
  });

  describe('exportEdgeRSAKeyPair', () => {
    it('should export key pair to JWK format', async () => {
      const keyPair = await generateEdgeRSAKeys();
      const exported = await exportEdgeRSAKeyPair(keyPair);
      
      expect(exported).toHaveProperty('publicKey');
      expect(exported).toHaveProperty('privateKey');
      expect(exported.publicKey).toHaveProperty('kty');
      expect(exported.publicKey.kty).toBe('RSA');
      expect(exported.privateKey).toHaveProperty('kty');
      expect(exported.privateKey.kty).toBe('RSA');
    });

    it('should produce serializable JWK', async () => {
      const keyPair = await generateEdgeRSAKeys();
      const exported = await exportEdgeRSAKeyPair(keyPair);
      
      // Should be able to stringify and parse
      const stringified = JSON.stringify(exported);
      const parsed = JSON.parse(stringified);
      
      expect(parsed.publicKey.kty).toBe('RSA');
      expect(parsed.privateKey.kty).toBe('RSA');
    });
  });

  describe('importEdgeRSAKeyPair', () => {
    it('should import key pair from JWK format', async () => {
      const keyPair = await generateEdgeRSAKeys();
      const exported = await exportEdgeRSAKeyPair(keyPair);
      const imported = await importEdgeRSAKeyPair(exported);
      
      expect(imported.publicKey).toBeInstanceOf(CryptoKey);
      expect(imported.privateKey).toBeInstanceOf(CryptoKey);
      expect(imported.publicKey.type).toBe('public');
      expect(imported.privateKey.type).toBe('private');
    });

    it('should work with stored and retrieved JWK', async () => {
      const keyPair = await generateEdgeRSAKeys();
      const exported = await exportEdgeRSAKeyPair(keyPair);
      
      // Simulate storage
      const stored = JSON.stringify(exported);
      const retrieved = JSON.parse(stored);
      
      // Should be able to import
      const imported = await importEdgeRSAKeyPair(retrieved);
      expect(imported.publicKey).toBeInstanceOf(CryptoKey);
    });
  });

  describe('importEdgePublicKey / importEdgePrivateKey', () => {
    it('should import only public key', async () => {
      const publicKey = await importEdgePublicKey(exportedKeyPair.publicKey);
      
      expect(publicKey).toBeInstanceOf(CryptoKey);
      expect(publicKey.type).toBe('public');
    });

    it('should import only private key', async () => {
      const privateKey = await importEdgePrivateKey(exportedKeyPair.privateKey);
      
      expect(privateKey).toBeInstanceOf(CryptoKey);
      expect(privateKey.type).toBe('private');
    });
  });

  describe('edgeEncryptHybrid', () => {
    it('should encrypt string data', async () => {
      const data = 'sensitive information';
      
      const result = await edgeEncryptHybrid(data, testKeyPair.publicKey);
      
      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('encryptedAESKey');
      expect(result).toHaveProperty('iv');
      expect(typeof result.encryptedData).toBe('string');
      expect(typeof result.encryptedAESKey).toBe('string');
      expect(typeof result.iv).toBe('string');
    });

    it('should encrypt with JWK public key', async () => {
      const data = 'test data';
      
      const result = await edgeEncryptHybrid(data, exportedKeyPair.publicKey);
      
      expect(result.encryptedData).toBeTruthy();
      expect(result.encryptedAESKey).toBeTruthy();
    });

    it('should produce different encrypted results for same data', async () => {
      const data = 'test data';
      
      const result1 = await edgeEncryptHybrid(data, testKeyPair.publicKey);
      const result2 = await edgeEncryptHybrid(data, testKeyPair.publicKey);
      
      // Should be different due to random IV and AES key
      expect(result1.encryptedData).not.toBe(result2.encryptedData);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encryptedAESKey).not.toBe(result2.encryptedAESKey);
    });

    it('should handle empty string', async () => {
      const data = '';
      
      const result = await edgeEncryptHybrid(data, testKeyPair.publicKey);
      
      expect(result.encryptedAESKey).toBeTruthy();
      expect(result.iv).toBeTruthy();
    });

    it('should handle special characters and unicode', async () => {
      const data = '🔒 Encryption test with émojis and spëcial çharacters! 你好';
      
      const result = await edgeEncryptHybrid(data, testKeyPair.publicKey);
      
      expect(result.encryptedData).toBeTruthy();
      expect(result.encryptedAESKey).toBeTruthy();
    });

    it('should encrypt ArrayBuffer data', async () => {
      const data = new TextEncoder().encode('binary data').buffer;
      
      const result = await edgeEncryptHybrid(data, testKeyPair.publicKey);
      
      expect(result.encryptedData).toBeTruthy();
      expect(result.encryptedAESKey).toBeTruthy();
    });
  });

  describe('edgeDecryptHybrid', () => {
    it('should decrypt data correctly', async () => {
      const originalData = 'sensitive information';
      
      const encrypted = await edgeEncryptHybrid(originalData, testKeyPair.publicKey);
      const decrypted = await edgeDecryptHybrid(encrypted, testKeyPair.privateKey);
      
      expect(decrypted).toBe(originalData);
    });

    it('should decrypt with JWK private key', async () => {
      const originalData = 'test data';
      
      const encrypted = await edgeEncryptHybrid(originalData, exportedKeyPair.publicKey);
      const decrypted = await edgeDecryptHybrid(encrypted, exportedKeyPair.privateKey);
      
      expect(decrypted).toBe(originalData);
    });

    it('should decrypt unicode and special characters', async () => {
      const originalData = '🔒 Test émojis and 你好 special chars!';
      
      const encrypted = await edgeEncryptHybrid(originalData, testKeyPair.publicKey);
      const decrypted = await edgeDecryptHybrid(encrypted, testKeyPair.privateKey);
      
      expect(decrypted).toBe(originalData);
    });

    it('should decrypt empty string', async () => {
      const originalData = '';
      
      const encrypted = await edgeEncryptHybrid(originalData, testKeyPair.publicKey);
      const decrypted = await edgeDecryptHybrid(encrypted, testKeyPair.privateKey);
      
      expect(decrypted).toBe(originalData);
    });

    it('should decrypt large text', async () => {
      const originalData = 'A'.repeat(10000); // 10KB of text
      
      const encrypted = await edgeEncryptHybrid(originalData, testKeyPair.publicKey);
      const decrypted = await edgeDecryptHybrid(encrypted, testKeyPair.privateKey);
      
      expect(decrypted).toBe(originalData);
      expect(decrypted.length).toBe(10000);
    });

    it('should fail with wrong private key', async () => {
      const data = 'test data';
      const wrongKeyPair = await generateEdgeRSAKeys();
      
      const encrypted = await edgeEncryptHybrid(data, testKeyPair.publicKey);
      
      await expect(async () => {
        await edgeDecryptHybrid(encrypted, wrongKeyPair.privateKey);
      }).rejects.toThrow();
    });

    it('should fail with tampered encrypted data', async () => {
      const data = 'test data';
      
      const encrypted = await edgeEncryptHybrid(data, testKeyPair.publicKey);
      
      // Tamper with encrypted data
      const tamperedEncrypted = {
        ...encrypted,
        encryptedData: encrypted.encryptedData.split('').reverse().join('')
      };
      
      await expect(async () => {
        await edgeDecryptHybrid(tamperedEncrypted, testKeyPair.privateKey);
      }).rejects.toThrow();
    });

    it('should fail with invalid base64 encoding', async () => {
      const data = 'test data';
      
      const encrypted = await edgeEncryptHybrid(data, testKeyPair.publicKey);
      
      const invalidEncrypted = {
        ...encrypted,
        encryptedData: 'invalid-base64!@#$%'
      };
      
      await expect(async () => {
        await edgeDecryptHybrid(invalidEncrypted, testKeyPair.privateKey);
      }).rejects.toThrow();
    });
  });

  describe('edgeEncryptBinaryData / edgeDecryptBinaryData', () => {
    it('should encrypt and decrypt binary data', async () => {
      const originalData = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]).buffer;
      
      const encrypted = await edgeEncryptBinaryData(originalData, testKeyPair.publicKey);
      const decrypted = await edgeDecryptBinaryData(encrypted, testKeyPair.privateKey);
      
      expect(new Uint8Array(decrypted)).toEqual(new Uint8Array(originalData));
    });

    it('should encrypt and decrypt large binary data', async () => {
      const originalData = new Uint8Array(1024 * 100); // 100KB
      for (let i = 0; i < originalData.length; i++) {
        originalData[i] = Math.floor(Math.random() * 256);
      }
      
      const encrypted = await edgeEncryptBinaryData(originalData.buffer, testKeyPair.publicKey);
      const decrypted = await edgeDecryptBinaryData(encrypted, testKeyPair.privateKey);
      
      expect(new Uint8Array(decrypted)).toEqual(originalData);
    });

    it('should handle empty buffer', async () => {
      const originalData = new Uint8Array(0).buffer;
      
      const encrypted = await edgeEncryptBinaryData(originalData, testKeyPair.publicKey);
      const decrypted = await edgeDecryptBinaryData(encrypted, testKeyPair.privateKey);
      
      expect(new Uint8Array(decrypted)).toEqual(new Uint8Array(originalData));
    });

    it('should preserve binary data integrity', async () => {
      const originalData = new Uint8Array([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8
      ]).buffer;
      
      const encrypted = await edgeEncryptBinaryData(originalData, testKeyPair.publicKey);
      const decrypted = await edgeDecryptBinaryData(encrypted, testKeyPair.privateKey);
      
      const decryptedArray = new Uint8Array(decrypted);
      const originalArray = new Uint8Array(originalData);
      
      expect(decryptedArray).toEqual(originalArray);
    });
  });

  describe('edgeEncryptFile', () => {
    it('should encrypt a File object', async () => {
      const fileContent = 'file content';
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });
      
      const encrypted = await edgeEncryptFile(file, testKeyPair.publicKey);
      
      expect(encrypted.encryptedData).toBeTruthy();
      expect(encrypted.encryptedAESKey).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      
      // Should be able to decrypt
      const decrypted = await edgeDecryptHybrid(encrypted, testKeyPair.privateKey);
      expect(decrypted).toBe(fileContent);
    });

    it('should handle binary file', async () => {
      const binaryData = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
      const file = new File([binaryData], 'test.png', { type: 'image/png' });
      
      const encrypted = await edgeEncryptFile(file, testKeyPair.publicKey);
      const decrypted = await edgeDecryptBinaryData(encrypted, testKeyPair.privateKey);
      
      expect(new Uint8Array(decrypted)).toEqual(binaryData);
    });
  });

  describe('End-to-End Encryption Flow', () => {
    it('should complete full encryption/decryption cycle', async () => {
      // Simulate real-world usage
      const keyPair = await generateEdgeRSAKeys(2048);
      
      // Encrypt sensitive employee data
      const employeeData = JSON.stringify({
        ssn: '123-45-6789',
        email: 'employee@example.com',
        phone: '555-123-4567',
        address: '123 Main St'
      });
      
      const encrypted = await edgeEncryptHybrid(employeeData, keyPair.publicKey);
      
      // Store encrypted data (simulated)
      const storedData = {
        encryptedData: encrypted.encryptedData,
        encryptedAESKey: encrypted.encryptedAESKey,
        iv: encrypted.iv
      };
      
      // Later, decrypt the data
      const decrypted = await edgeDecryptHybrid(storedData, keyPair.privateKey);
      const parsedData = JSON.parse(decrypted);
      
      expect(parsedData.ssn).toBe('123-45-6789');
      expect(parsedData.email).toBe('employee@example.com');
      expect(parsedData.phone).toBe('555-123-4567');
    });

    it('should handle export/import cycle', async () => {
      const keyPair = await generateEdgeRSAKeys();
      const exported = await exportEdgeRSAKeyPair(keyPair);
      
      // Simulate storage and retrieval
      const stored = JSON.stringify(exported);
      const retrieved = JSON.parse(stored);
      
      const imported = await importEdgeRSAKeyPair(retrieved);
      
      // Should work with imported keys
      const data = 'test message';
      const encrypted = await edgeEncryptHybrid(data, imported.publicKey);
      const decrypted = await edgeDecryptHybrid(encrypted, imported.privateKey);
      
      expect(decrypted).toBe(data);
    });

    it('should handle multiple encryption operations', async () => {
      const data1 = 'First message';
      const data2 = 'Second message';
      const data3 = 'Third message';
      
      const enc1 = await edgeEncryptHybrid(data1, testKeyPair.publicKey);
      const enc2 = await edgeEncryptHybrid(data2, testKeyPair.publicKey);
      const enc3 = await edgeEncryptHybrid(data3, testKeyPair.publicKey);
      
      const dec1 = await edgeDecryptHybrid(enc1, testKeyPair.privateKey);
      const dec2 = await edgeDecryptHybrid(enc2, testKeyPair.privateKey);
      const dec3 = await edgeDecryptHybrid(enc3, testKeyPair.privateKey);
      
      expect(dec1).toBe(data1);
      expect(dec2).toBe(data2);
      expect(dec3).toBe(data3);
    });
  });

  describe('Security Properties', () => {
    it('should not leak plaintext in encrypted output', async () => {
      const data = 'secret password 123';
      
      const encrypted = await edgeEncryptHybrid(data, testKeyPair.publicKey);
      
      // Encrypted data should not contain plaintext
      expect(encrypted.encryptedData).not.toContain('secret');
      expect(encrypted.encryptedData).not.toContain('password');
      expect(encrypted.encryptedData).not.toContain('123');
    });

    it('should produce non-deterministic encryption', async () => {
      const data = 'test';
      
      const results = new Set<string>();
      
      // Encrypt same data multiple times
      for (let i = 0; i < 10; i++) {
        const encrypted = await edgeEncryptHybrid(data, testKeyPair.publicKey);
        results.add(encrypted.encryptedData);
      }
      
      // All results should be unique
      expect(results.size).toBe(10);
    });

    it('should use different IVs for each encryption', async () => {
      const data = 'test';
      
      const ivs = new Set<string>();
      
      for (let i = 0; i < 10; i++) {
        const encrypted = await edgeEncryptHybrid(data, testKeyPair.publicKey);
        ivs.add(encrypted.iv);
      }
      
      // All IVs should be unique
      expect(ivs.size).toBe(10);
    });
  });
});
