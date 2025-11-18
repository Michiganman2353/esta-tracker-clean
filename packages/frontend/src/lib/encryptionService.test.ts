import { describe, it, expect } from 'vitest';
import {
  encryptHybrid,
  decryptHybrid,
  encryptFile,
  decryptBlob,
} from './encryptionService';

describe('Encryption Service', () => {
  describe('encryptHybrid and decryptHybrid', () => {
    it('should encrypt and decrypt a simple string', () => {
      const originalData = 'Hello, World!';
      
      // Encrypt
      const encrypted = encryptHybrid(originalData);
      
      // Verify encryption result structure
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('serpentKey');
      expect(encrypted).toHaveProperty('twofishKey');
      expect(encrypted).toHaveProperty('aesKey');
      expect(encrypted).toHaveProperty('iv');
      
      // Verify keys are hex strings of appropriate length
      expect(encrypted.serpentKey).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(encrypted.twofishKey).toHaveLength(64);
      expect(encrypted.aesKey).toHaveLength(64);
      expect(encrypted.iv).toHaveLength(32); // 16 bytes = 32 hex chars
      
      // Verify encrypted data is different from original
      expect(encrypted.encryptedData).not.toBe(originalData);
      
      // Decrypt
      const decrypted = decryptHybrid({
        encryptedData: encrypted.encryptedData,
        serpentKey: encrypted.serpentKey,
        twofishKey: encrypted.twofishKey,
        aesKey: encrypted.aesKey,
        iv: encrypted.iv,
      });
      
      // Verify decryption returns original data
      expect(decrypted).toBe(originalData);
    });

    it('should encrypt and decrypt a longer text', () => {
      const originalData = 'This is a longer text that contains multiple sentences. It should be encrypted and decrypted correctly. The encryption service uses hybrid encryption with Serpent-like, Twofish, and AES algorithms.';
      
      const encrypted = encryptHybrid(originalData);
      const decrypted = decryptHybrid({
        encryptedData: encrypted.encryptedData,
        serpentKey: encrypted.serpentKey,
        twofishKey: encrypted.twofishKey,
        aesKey: encrypted.aesKey,
        iv: encrypted.iv,
      });
      
      expect(decrypted).toBe(originalData);
    });

    it('should produce different encrypted data for same input with different keys', () => {
      const originalData = 'Sensitive medical information';
      
      const encrypted1 = encryptHybrid(originalData);
      const encrypted2 = encryptHybrid(originalData);
      
      // Different keys should produce different encrypted data
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
      expect(encrypted1.serpentKey).not.toBe(encrypted2.serpentKey);
      expect(encrypted1.twofishKey).not.toBe(encrypted2.twofishKey);
      expect(encrypted1.aesKey).not.toBe(encrypted2.aesKey);
    });

    it('should fail decryption with wrong serpent key', () => {
      const originalData = 'Secret data';
      const encrypted = encryptHybrid(originalData);
      
      // Use wrong serpent key
      const wrongKey = '0'.repeat(64);
      
      // Serpent-like decryption with wrong key may or may not throw depending on the data
      // It might decode to garbage. We'll check that it either throws or returns garbage
      try {
        const decrypted = decryptHybrid({
          encryptedData: encrypted.encryptedData,
          serpentKey: wrongKey,
          twofishKey: encrypted.twofishKey,
          aesKey: encrypted.aesKey,
          iv: encrypted.iv,
        });
        
        // If it didn't throw, the data should not match the original
        expect(decrypted).not.toBe(originalData);
      } catch (error) {
        // Or it might throw, which is also acceptable
        expect(error).toBeDefined();
      }
    });

    it('should fail decryption with wrong twofish key', () => {
      const originalData = 'Secret data';
      const encrypted = encryptHybrid(originalData);
      
      // Use wrong twofish key
      const wrongKey = 'f'.repeat(64);
      
      // Twofish decryption with wrong key may or may not throw depending on the data
      // It might decode to garbage. We'll check that it either throws or returns garbage
      try {
        const decrypted = decryptHybrid({
          encryptedData: encrypted.encryptedData,
          serpentKey: encrypted.serpentKey,
          twofishKey: wrongKey,
          aesKey: encrypted.aesKey,
          iv: encrypted.iv,
        });
        
        // If it didn't throw, the data should not match the original
        expect(decrypted).not.toBe(originalData);
      } catch (error) {
        // Or it might throw, which is also acceptable
        expect(error).toBeDefined();
      }
    });

    it('should fail decryption with wrong AES key', () => {
      const originalData = 'Secret data';
      const encrypted = encryptHybrid(originalData);
      
      // Use wrong AES key
      const wrongKey = 'a'.repeat(64);
      
      // Decryption with wrong AES key should throw an error
      expect(() => {
        decryptHybrid({
          encryptedData: encrypted.encryptedData,
          serpentKey: encrypted.serpentKey,
          twofishKey: encrypted.twofishKey,
          aesKey: wrongKey,
          iv: encrypted.iv,
        });
      }).toThrow();
    });

    it('should handle empty string', () => {
      const originalData = '';
      
      const encrypted = encryptHybrid(originalData);
      const decrypted = decryptHybrid({
        encryptedData: encrypted.encryptedData,
        serpentKey: encrypted.serpentKey,
        twofishKey: encrypted.twofishKey,
        aesKey: encrypted.aesKey,
        iv: encrypted.iv,
      });
      
      expect(decrypted).toBe(originalData);
    });

    it('should handle special characters', () => {
      const originalData = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`\\';
      
      const encrypted = encryptHybrid(originalData);
      const decrypted = decryptHybrid({
        encryptedData: encrypted.encryptedData,
        serpentKey: encrypted.serpentKey,
        twofishKey: encrypted.twofishKey,
        aesKey: encrypted.aesKey,
        iv: encrypted.iv,
      });
      
      expect(decrypted).toBe(originalData);
    });

    it('should handle unicode characters', () => {
      const originalData = 'Hello 世界 🌍 Привет';
      
      const encrypted = encryptHybrid(originalData);
      const decrypted = decryptHybrid({
        encryptedData: encrypted.encryptedData,
        serpentKey: encrypted.serpentKey,
        twofishKey: encrypted.twofishKey,
        aesKey: encrypted.aesKey,
        iv: encrypted.iv,
      });
      
      expect(decrypted).toBe(originalData);
    });
  });

  describe('encryptFile and decryptBlob', () => {
    it('should encrypt and decrypt a text file', async () => {
      const originalContent = 'This is the content of a medical document.';
      const file = new File([originalContent], 'medical-note.txt', {
        type: 'text/plain',
      });
      
      // Encrypt
      const { encryptedBlob, keys } = await encryptFile(file);
      
      // Verify encrypted blob is different
      expect(encryptedBlob.size).toBeGreaterThan(0);
      expect(encryptedBlob.type).toBe('application/octet-stream');
      
      // Decrypt
      const decryptedBlob = await decryptBlob(encryptedBlob, keys, 'text/plain');
      
      // Verify decrypted content using FileReader (jsdom compatible)
      const decryptedText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(decryptedBlob);
      });
      
      expect(decryptedText).toBe(originalContent);
      expect(decryptedBlob.type).toBe('text/plain');
    });

    it('should encrypt and decrypt a binary file', async () => {
      // Create a fake image file
      const imageData = new Uint8Array([
        0xFF, 0xD8, 0xFF, 0xE0, // JPEG header
        0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01
      ]);
      const file = new File([imageData], 'doctor-note.jpg', {
        type: 'image/jpeg',
      });
      
      // Encrypt
      const { encryptedBlob, keys } = await encryptFile(file);
      
      // Decrypt
      const decryptedBlob = await decryptBlob(encryptedBlob, keys, 'image/jpeg');
      
      // Verify decrypted content using FileReader (jsdom compatible)
      const decryptedBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(decryptedBlob);
      });
      const decryptedArray = new Uint8Array(decryptedBuffer);
      
      expect(decryptedArray).toEqual(imageData);
      expect(decryptedBlob.type).toBe('image/jpeg');
    });

    it('should encrypt and decrypt a PDF file', async () => {
      // Create a minimal PDF file signature
      const pdfData = new TextEncoder().encode('%PDF-1.4\n%âãÏÓ\n');
      const file = new File([pdfData], 'prescription.pdf', {
        type: 'application/pdf',
      });
      
      // Encrypt
      const { encryptedBlob, keys } = await encryptFile(file);
      
      // Decrypt
      const decryptedBlob = await decryptBlob(encryptedBlob, keys, 'application/pdf');
      
      // Verify decrypted content using FileReader (jsdom compatible)
      const decryptedBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(decryptedBlob);
      });
      const decryptedArray = new Uint8Array(decryptedBuffer);
      
      // Compare byte by byte
      expect(decryptedArray.length).toBe(pdfData.length);
      for (let i = 0; i < pdfData.length; i++) {
        expect(decryptedArray[i]).toBe(pdfData[i]);
      }
      expect(decryptedBlob.type).toBe('application/pdf');
    });

    it('should handle large files', async () => {
      // Create a larger file (1KB)
      const largeContent = 'A'.repeat(1024);
      const file = new File([largeContent], 'large-document.txt', {
        type: 'text/plain',
      });
      
      // Encrypt
      const { encryptedBlob, keys } = await encryptFile(file);
      
      // Decrypt
      const decryptedBlob = await decryptBlob(encryptedBlob, keys, 'text/plain');
      
      // Verify using FileReader (jsdom compatible)
      const decryptedText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(decryptedBlob);
      });
      
      expect(decryptedText).toBe(largeContent);
    });

    it('should fail decryption with wrong keys', async () => {
      const originalContent = 'Confidential medical information';
      const file = new File([originalContent], 'confidential.txt', {
        type: 'text/plain',
      });
      
      // Encrypt
      const { encryptedBlob, keys } = await encryptFile(file);
      
      // Try to decrypt with wrong AES key (this will cause UTF-8 decoding error)
      const wrongKeys = {
        serpentKey: keys.serpentKey,
        twofishKey: keys.twofishKey,
        aesKey: 'a'.repeat(64),
        iv: keys.iv,
      };
      
      // Decryption with wrong AES key should throw an error
      await expect(
        decryptBlob(encryptedBlob, wrongKeys, 'text/plain')
      ).rejects.toThrow();
    });
  });

  describe('Key generation', () => {
    it('should generate unique keys for each encryption', () => {
      const data = 'Test data';
      
      const result1 = encryptHybrid(data);
      const result2 = encryptHybrid(data);
      
      // All keys should be unique
      expect(result1.serpentKey).not.toBe(result2.serpentKey);
      expect(result1.twofishKey).not.toBe(result2.twofishKey);
      expect(result1.aesKey).not.toBe(result2.aesKey);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('should generate keys of correct length', () => {
      const data = 'Test data';
      const result = encryptHybrid(data);
      
      // 256-bit keys = 64 hex characters
      expect(result.serpentKey).toMatch(/^[0-9a-f]{64}$/);
      expect(result.twofishKey).toMatch(/^[0-9a-f]{64}$/);
      expect(result.aesKey).toMatch(/^[0-9a-f]{64}$/);
      
      // 128-bit IV = 32 hex characters
      expect(result.iv).toMatch(/^[0-9a-f]{32}$/);
    });
  });
});
