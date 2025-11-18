import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadEncryptedDocument,
  downloadEncryptedDocument,
  storeEncryptionKeysSecurely,
  uploadEncryptedDocumentComplete,
} from './encryptedDocumentService';
import * as encryptionService from './encryptionService';
import * as documentService from './documentService';

// Mock the dependencies
vi.mock('./encryptionService');
vi.mock('./documentService');

describe('Encrypted Document Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadEncryptedDocument', () => {
    it('should encrypt and upload document successfully', async () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const mockRequestId = 'request123';

      const mockEncryptedBlob = new Blob(['encrypted']);
      const mockKeys = {
        encryptedData: 'encrypted-base64-data',
        serpentKey: 'a'.repeat(64),
        twofishKey: 'b'.repeat(64),
        aesKey: 'c'.repeat(64),
        iv: 'd'.repeat(32),
      };

      // Mock validation
      vi.mocked(documentService.validateDocumentFile).mockReturnValue({
        valid: true,
      });

      // Mock encryption
      vi.mocked(encryptionService.encryptFile).mockResolvedValue({
        encryptedBlob: mockEncryptedBlob,
        keys: mockKeys,
      });

      // Mock URL generation
      vi.mocked(documentService.generateDocumentUploadUrl).mockResolvedValue({
        success: true,
        uploadUrl: 'https://upload.url',
        documentId: 'doc123',
        storagePath: '/path/to/doc',
        expiresIn: 900,
      });

      // Mock upload
      vi.mocked(documentService.uploadDocumentToSignedUrl).mockResolvedValue(undefined);

      // Mock confirmation
      vi.mocked(documentService.confirmDocumentUpload).mockResolvedValue({
        success: true,
        message: 'Confirmed',
      });

      // Execute
      const result = await uploadEncryptedDocument(mockRequestId, mockFile);

      // Verify
      expect(result.documentId).toBe('doc123');
      expect(result.encryptionKeys).toEqual({
        serpentKey: mockKeys.serpentKey,
        twofishKey: mockKeys.twofishKey,
        aesKey: mockKeys.aesKey,
        iv: mockKeys.iv,
      });

      expect(documentService.validateDocumentFile).toHaveBeenCalledWith(mockFile);
      expect(encryptionService.encryptFile).toHaveBeenCalledWith(mockFile);
      expect(documentService.generateDocumentUploadUrl).toHaveBeenCalled();
      expect(documentService.uploadDocumentToSignedUrl).toHaveBeenCalled();
      expect(documentService.confirmDocumentUpload).toHaveBeenCalledWith('doc123');
    });

    it('should throw error if file validation fails', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const mockRequestId = 'request123';

      vi.mocked(documentService.validateDocumentFile).mockReturnValue({
        valid: false,
        error: 'Invalid file type',
      });

      await expect(
        uploadEncryptedDocument(mockRequestId, mockFile)
      ).rejects.toThrow('Invalid file type');
    });

    it('should call progress callback', async () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const mockRequestId = 'request123';
      const onProgress = vi.fn();

      const mockEncryptedBlob = new Blob(['encrypted']);
      const mockKeys = {
        encryptedData: 'encrypted-base64-data',
        serpentKey: 'a'.repeat(64),
        twofishKey: 'b'.repeat(64),
        aesKey: 'c'.repeat(64),
        iv: 'd'.repeat(32),
      };

      vi.mocked(documentService.validateDocumentFile).mockReturnValue({ valid: true });
      vi.mocked(encryptionService.encryptFile).mockResolvedValue({
        encryptedBlob: mockEncryptedBlob,
        keys: mockKeys,
      });
      vi.mocked(documentService.generateDocumentUploadUrl).mockResolvedValue({
        success: true,
        uploadUrl: 'https://upload.url',
        documentId: 'doc123',
        storagePath: '/path',
        expiresIn: 900,
      });
      vi.mocked(documentService.uploadDocumentToSignedUrl).mockResolvedValue(undefined);
      vi.mocked(documentService.confirmDocumentUpload).mockResolvedValue({
        success: true,
        message: 'Confirmed',
      });

      await uploadEncryptedDocument(mockRequestId, mockFile, onProgress);

      expect(onProgress).toHaveBeenCalledWith(5);
      expect(onProgress).toHaveBeenCalledWith(20);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(onProgress).toHaveBeenCalledWith(100);
    });
  });

  describe('downloadEncryptedDocument', () => {
    it('should download and decrypt document successfully', async () => {
      const mockDocumentId = 'doc123';
      const mockKeys = {
        encryptedData: 'encrypted-base64-data',
        serpentKey: 'a'.repeat(64),
        twofishKey: 'b'.repeat(64),
        aesKey: 'c'.repeat(64),
        iv: 'd'.repeat(32),
      };
      const mockOriginalType = 'image/jpeg';
      const mockOriginalName = 'photo.jpg';

      // Mock download URL
      vi.mocked(documentService.getDocumentDownloadUrl).mockResolvedValue({
        success: true,
        downloadUrl: 'https://download.url',
        fileName: 'encrypted_photo.jpg',
        contentType: 'application/octet-stream',
        expiresIn: 300,
      });

      // Mock fetch
      const mockEncryptedBlob = new Blob(['encrypted']);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockEncryptedBlob),
      });

      // Mock decryption
      const mockDecryptedBlob = new Blob(['decrypted'], { type: mockOriginalType });
      vi.mocked(encryptionService.decryptBlob).mockResolvedValue(mockDecryptedBlob);

      // Execute
      const result = await downloadEncryptedDocument(
        mockDocumentId,
        mockKeys,
        mockOriginalType,
        mockOriginalName
      );

      // Verify
      expect(result.name).toBe(mockOriginalName);
      expect(result.type).toBe(mockOriginalType);
      expect(documentService.getDocumentDownloadUrl).toHaveBeenCalledWith(mockDocumentId);
      expect(encryptionService.decryptBlob).toHaveBeenCalledWith(
        mockEncryptedBlob,
        expect.objectContaining({
          serpentKey: mockKeys.serpentKey,
          twofishKey: mockKeys.twofishKey,
          aesKey: mockKeys.aesKey,
          iv: mockKeys.iv,
        }),
        mockOriginalType
      );
    });

    it('should throw error if download fails', async () => {
      const mockDocumentId = 'doc123';
      const mockKeys = {
        encryptedData: 'encrypted-base64-data',
        serpentKey: 'a'.repeat(64),
        twofishKey: 'b'.repeat(64),
        aesKey: 'c'.repeat(64),
        iv: 'd'.repeat(32),
      };

      vi.mocked(documentService.getDocumentDownloadUrl).mockResolvedValue({
        success: true,
        downloadUrl: 'https://download.url',
        fileName: 'encrypted_photo.jpg',
        contentType: 'application/octet-stream',
        expiresIn: 300,
      });

      // Mock failed fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      await expect(
        downloadEncryptedDocument(mockDocumentId, mockKeys, 'image/jpeg', 'photo.jpg')
      ).rejects.toThrow('Failed to download and decrypt document');
    });

    it('should throw error if decryption fails', async () => {
      const mockDocumentId = 'doc123';
      const mockKeys = {
        encryptedData: 'encrypted-base64-data',
        serpentKey: 'a'.repeat(64),
        twofishKey: 'b'.repeat(64),
        aesKey: 'c'.repeat(64),
        iv: 'd'.repeat(32),
      };

      vi.mocked(documentService.getDocumentDownloadUrl).mockResolvedValue({
        success: true,
        downloadUrl: 'https://download.url',
        fileName: 'encrypted_photo.jpg',
        contentType: 'application/octet-stream',
        expiresIn: 300,
      });

      const mockEncryptedBlob = new Blob(['encrypted']);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockEncryptedBlob),
      });

      // Mock decryption failure
      vi.mocked(encryptionService.decryptBlob).mockRejectedValue(
        new Error('Decryption failed')
      );

      await expect(
        downloadEncryptedDocument(mockDocumentId, mockKeys, 'image/jpeg', 'photo.jpg')
      ).rejects.toThrow('Failed to download and decrypt document');
    });
  });

  describe('storeEncryptionKeysSecurely', () => {
    it('should return a key ID (placeholder implementation)', async () => {
      const documentId = 'doc123';
      const keys = {
        encryptedData: 'encrypted-base64-data',
        serpentKey: 'a'.repeat(64),
        twofishKey: 'b'.repeat(64),
        aesKey: 'c'.repeat(64),
        iv: 'd'.repeat(32),
      };

      const keyId = await storeEncryptionKeysSecurely(documentId, keys);

      expect(keyId).toContain('key_doc123_');
    });
  });

  describe('uploadEncryptedDocumentComplete', () => {
    it('should upload document and store keys', async () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const mockRequestId = 'request123';

      const mockEncryptedBlob = new Blob(['encrypted']);
      const mockKeys = {
        encryptedData: 'encrypted-base64-data',
        serpentKey: 'a'.repeat(64),
        twofishKey: 'b'.repeat(64),
        aesKey: 'c'.repeat(64),
        iv: 'd'.repeat(32),
      };

      vi.mocked(documentService.validateDocumentFile).mockReturnValue({ valid: true });
      vi.mocked(encryptionService.encryptFile).mockResolvedValue({
        encryptedBlob: mockEncryptedBlob,
        keys: mockKeys,
      });
      vi.mocked(documentService.generateDocumentUploadUrl).mockResolvedValue({
        success: true,
        uploadUrl: 'https://upload.url',
        documentId: 'doc123',
        storagePath: '/path',
        expiresIn: 900,
      });
      vi.mocked(documentService.uploadDocumentToSignedUrl).mockResolvedValue(undefined);
      vi.mocked(documentService.confirmDocumentUpload).mockResolvedValue({
        success: true,
        message: 'Confirmed',
      });

      const result = await uploadEncryptedDocumentComplete(mockRequestId, mockFile);

      expect(result.documentId).toBe('doc123');
      expect(result.keyId).toContain('key_doc123_');
      expect(result.encryptionKeys).toEqual({
        serpentKey: mockKeys.serpentKey,
        twofishKey: mockKeys.twofishKey,
        aesKey: mockKeys.aesKey,
        iv: mockKeys.iv,
      });
    });
  });
});
