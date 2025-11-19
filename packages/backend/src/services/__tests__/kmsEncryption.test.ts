/**
 * Tests for KMS Encryption Service
 * 
 * Tests the hybrid encryption implementation using KMS for key wrapping
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { kmsEncrypt, kmsDecrypt, kmsEncryptBatch, kmsDecryptBatch } from '../kmsEncryption';
import { initializeKMS } from '../kms';

// Mock environment variables
process.env.GCP_PROJECT_ID = 'test-project';
process.env.KMS_LOCATION = 'us-central1';
process.env.KMS_KEYRING_ID = 'test-keyring';
process.env.KMS_CRYPTO_KEY_ID = 'test-key';

describe('KMS Encryption Service', () => {
  beforeAll(() => {
    // Mock KMS client
    vi.mock('@google-cloud/kms', () => ({
      KeyManagementServiceClient: vi.fn().mockImplementation(() => ({
        cryptoKeyPath: vi.fn((projectId, locationId, keyRingId, cryptoKeyId) => 
          `projects/${projectId}/locations/${locationId}/keyRings/${keyRingId}/cryptoKeys/${cryptoKeyId}`
        ),
        encrypt: vi.fn(async ({ plaintext }) => [{ 
          ciphertext: Buffer.from(plaintext).toString('base64') 
        }]),
        decrypt: vi.fn(async ({ ciphertext }) => [{ 
          plaintext: Buffer.from(ciphertext as Buffer | string, 'base64') 
        }]),
      })),
    }));

    initializeKMS();
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt string data', async () => {
      const data = 'sensitive information';
      const encrypted = await kmsEncrypt(data);

      expect(encrypted).toBeDefined();
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.wrappedKey).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(typeof encrypted.encryptedData).toBe('string');
      expect(typeof encrypted.wrappedKey).toBe('string');
    });

    it('should decrypt encrypted data', async () => {
      const originalData = 'test data';
      const encrypted = await kmsEncrypt(originalData);
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe(originalData);
    });

    it('should handle empty strings', async () => {
      const encrypted = await kmsEncrypt('');
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should handle unicode characters', async () => {
      const data = '🔐 Encrypted: 日本語 français العربية';
      const encrypted = await kmsEncrypt(data);
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe(data);
    });

    it('should handle large data', async () => {
      const largeData = 'A'.repeat(10000);
      const encrypted = await kmsEncrypt(largeData);
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe(largeData);
    });

    it('should handle buffer data', async () => {
      const buffer = Buffer.from('binary data');
      const encrypted = await kmsEncrypt(buffer);
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe(buffer.toString('utf8'));
    });
  });

  describe('Batch Encryption/Decryption', () => {
    it('should encrypt multiple fields', async () => {
      const fields = {
        ssn: '123-45-6789',
        address: '123 Main St',
        phone: '555-1234',
      };

      const encrypted = await kmsEncryptBatch(fields);

      expect(encrypted).toBeDefined();
      expect(encrypted.ssn).toBeDefined();
      expect(encrypted.address).toBeDefined();
      expect(encrypted.phone).toBeDefined();
      expect(encrypted.ssn.encryptedData).toBeDefined();
      expect(encrypted.ssn.wrappedKey).toBeDefined();
    });

    it('should decrypt multiple fields', async () => {
      const fields = {
        ssn: '123-45-6789',
        address: '123 Main St',
        phone: '555-1234',
      };

      const encrypted = await kmsEncryptBatch(fields);
      const decrypted = await kmsDecryptBatch(encrypted);

      expect(decrypted.ssn).toBe(fields.ssn);
      expect(decrypted.address).toBe(fields.address);
      expect(decrypted.phone).toBe(fields.phone);
    });

    it('should handle empty batch', async () => {
      const encrypted = await kmsEncryptBatch({});
      const decrypted = await kmsDecryptBatch(encrypted);

      expect(decrypted).toEqual({});
    });

    it('should handle single field batch', async () => {
      const fields = { ssn: '123-45-6789' };
      const encrypted = await kmsEncryptBatch(fields);
      const decrypted = await kmsDecryptBatch(encrypted);

      expect(decrypted.ssn).toBe(fields.ssn);
    });
  });

  describe('Security Properties', () => {
    it('should generate unique IVs for each encryption', async () => {
      const data = 'same data';
      const encrypted1 = await kmsEncrypt(data);
      const encrypted2 = await kmsEncrypt(data);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should generate different ciphertexts for same data', async () => {
      const data = 'same data';
      const encrypted1 = await kmsEncrypt(data);
      const encrypted2 = await kmsEncrypt(data);

      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
    });

    it('should include authentication tag', async () => {
      const encrypted = await kmsEncrypt('data');
      
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.authTag.length).toBeGreaterThan(0);
    });

    it('should detect tampered ciphertext', async () => {
      const encrypted = await kmsEncrypt('original data');
      
      // Tamper with encrypted data
      const tamperedPayload = {
        ...encrypted,
        encryptedData: encrypted.encryptedData.slice(0, -4) + 'XXXX',
      };

      await expect(kmsDecrypt(tamperedPayload)).rejects.toThrow();
    });

    it('should detect tampered auth tag', async () => {
      const encrypted = await kmsEncrypt('original data');
      
      // Tamper with auth tag
      const tamperedPayload = {
        ...encrypted,
        authTag: encrypted.authTag.slice(0, -4) + 'YYYY',
      };

      await expect(kmsDecrypt(tamperedPayload)).rejects.toThrow();
    });
  });

  describe('File Encryption', () => {
    it('should encrypt binary file data', async () => {
      const fileData = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
      const encrypted = await kmsEncrypt(fileData);

      expect(encrypted).toBeDefined();
      expect(encrypted.encryptedData).toBeDefined();
    });

    it('should handle large files', async () => {
      const largeFile = Buffer.alloc(1024 * 100); // 100KB
      const encrypted = await kmsEncrypt(largeFile);
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe(largeFile.toString('utf8'));
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid payload structure', async () => {
      const invalidPayload = {
        encryptedData: 'test',
        // Missing required fields
      } as any;

      await expect(kmsDecrypt(invalidPayload)).rejects.toThrow();
    });

    it('should handle invalid base64', async () => {
      const invalidPayload = {
        encryptedData: 'not-valid-base64!@#$',
        wrappedKey: 'test',
        iv: 'test',
        authTag: 'test',
      };

      await expect(kmsDecrypt(invalidPayload)).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      try {
        await kmsDecrypt({
          encryptedData: '',
          wrappedKey: '',
          iv: '',
          authTag: '',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('KMS-backed decryption failed');
      }
    });
  });

  describe('Payload Structure', () => {
    it('should have correct payload structure', async () => {
      const encrypted = await kmsEncrypt('test');

      // Check all required fields are present
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('wrappedKey');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');

      // Check all values are base64 strings
      expect(typeof encrypted.encryptedData).toBe('string');
      expect(typeof encrypted.wrappedKey).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.authTag).toBe('string');
    });

    it('should be JSON serializable', async () => {
      const encrypted = await kmsEncrypt('test');
      const json = JSON.stringify(encrypted);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(encrypted);
    });

    it('should support storage in database', async () => {
      const encrypted = await kmsEncrypt('sensitive data');
      
      // Simulate database storage
      const stored = JSON.parse(JSON.stringify(encrypted));
      
      // Should be able to decrypt after storage
      const decrypted = await kmsDecrypt(stored);
      expect(decrypted).toBe('sensitive data');
    });
  });

  describe('PII Data Types', () => {
    it('should encrypt SSN format', async () => {
      const ssn = '123-45-6789';
      const encrypted = await kmsEncrypt(ssn);
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe(ssn);
    });

    it('should encrypt address', async () => {
      const address = '123 Main Street, City, State 12345';
      const encrypted = await kmsEncrypt(address);
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe(address);
    });

    it('should encrypt phone number', async () => {
      const phone = '+1 (555) 123-4567';
      const encrypted = await kmsEncrypt(phone);
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe(phone);
    });

    it('should encrypt medical information', async () => {
      const medical = 'Patient has diabetes and requires insulin';
      const encrypted = await kmsEncrypt(medical);
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe(medical);
    });

    it('should encrypt salary information', async () => {
      const salary = '$75,000.00 annually';
      const encrypted = await kmsEncrypt(salary);
      const decrypted = await kmsDecrypt(encrypted);

      expect(decrypted).toBe(salary);
    });
  });

  describe('Performance', () => {
    it('should encrypt quickly for small data', async () => {
      const start = Date.now();
      await kmsEncrypt('small data');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should handle concurrent encryptions', async () => {
      const promises = Array(10).fill(null).map((_, i) => 
        kmsEncrypt(`data ${i}`)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.encryptedData).toBeDefined();
      });
    });

    it('should handle batch encryption efficiently', async () => {
      const fields = Object.fromEntries(
        Array(20).fill(null).map((_, i) => [`field${i}`, `value ${i}`])
      );

      const start = Date.now();
      const encrypted = await kmsEncryptBatch(fields);
      const duration = Date.now() - start;

      expect(Object.keys(encrypted)).toHaveLength(20);
      expect(duration).toBeLessThan(2000); // Reasonable for 20 fields
    });
  });
});
