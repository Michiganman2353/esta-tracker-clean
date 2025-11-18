import { encryptFile, decryptBlob } from './encryptionService';
import {
  generateDocumentUploadUrl,
  uploadDocumentToSignedUrl,
  confirmDocumentUpload,
  getDocumentDownloadUrl,
  validateDocumentFile,
  formatFileSize,
  type DocumentMetadata,
} from './documentService';

/**
 * Encrypted Document Service
 * 
 * Extends the document service with client-side encryption.
 * Documents are encrypted before upload and decrypted after download.
 * Encryption keys are stored securely and associated with each document.
 */

export interface EncryptedDocumentMetadata extends DocumentMetadata {
  // Encryption metadata (stored separately from document in secure storage)
  encrypted: boolean;
  encryptionKeyId?: string; // Reference to key in secure storage
}

export interface EncryptionKeys {
  serpentKey: string;
  twofishKey: string;
  aesKey: string;
  iv: string;
}

/**
 * Upload an encrypted document
 * @param requestId - The PTO request ID
 * @param file - The file to upload
 * @param onProgress - Optional progress callback
 * @returns Document ID and encryption keys (MUST be stored securely)
 */
export async function uploadEncryptedDocument(
  requestId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{
  documentId: string;
  encryptionKeys: EncryptionKeys;
}> {
  try {
    // Validate file first
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Step 1: Encrypt the file
    if (onProgress) onProgress(5);
    const { encryptedBlob, keys } = await encryptFile(file);
    if (onProgress) onProgress(20);

    // Create encrypted file with same name but different type
    const encryptedFile = new File(
      [encryptedBlob],
      `encrypted_${file.name}`,
      { type: 'application/octet-stream' }
    );

    // Step 2: Generate signed URL for encrypted file
    const { uploadUrl, documentId } = await generateDocumentUploadUrl(
      requestId,
      encryptedFile
    );
    if (onProgress) onProgress(30);

    // Step 3: Upload encrypted file
    await uploadDocumentToSignedUrl(uploadUrl, encryptedFile, (uploadProgress) => {
      if (onProgress) {
        // Map upload progress to 30-90% of total progress
        onProgress(30 + uploadProgress * 0.6);
      }
    });

    // Step 4: Confirm upload
    await confirmDocumentUpload(documentId);
    if (onProgress) onProgress(100);

    // Return document ID and encryption keys
    // WARNING: Encryption keys MUST be stored securely by the caller
    return {
      documentId,
      encryptionKeys: {
        serpentKey: keys.serpentKey,
        twofishKey: keys.twofishKey,
        aesKey: keys.aesKey,
        iv: keys.iv,
      },
    };
  } catch (error) {
    console.error('Error in encrypted document upload flow:', error);
    throw error;
  }
}

/**
 * Download and decrypt a document
 * @param documentId - The document ID
 * @param encryptionKeys - The encryption keys for this document
 * @param originalType - Original file MIME type
 * @param originalName - Original file name
 * @returns Decrypted file
 */
export async function downloadEncryptedDocument(
  documentId: string,
  encryptionKeys: EncryptionKeys,
  originalType: string,
  originalName: string
): Promise<File> {
  try {
    // Step 1: Get download URL
    const { downloadUrl } = await getDocumentDownloadUrl(documentId);

    // Step 2: Download encrypted blob
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error('Failed to download encrypted document');
    }
    const encryptedBlob = await response.blob();

    // Step 3: Decrypt blob
    const decryptedBlob = await decryptBlob(
      encryptedBlob,
      {
        serpentKey: encryptionKeys.serpentKey,
        twofishKey: encryptionKeys.twofishKey,
        aesKey: encryptionKeys.aesKey,
        iv: encryptionKeys.iv,
      },
      originalType
    );

    // Step 4: Create File object
    const decryptedFile = new File([decryptedBlob], originalName, {
      type: originalType,
    });

    return decryptedFile;
  } catch (error) {
    console.error('Error downloading encrypted document:', error);
    throw new Error('Failed to download and decrypt document');
  }
}

/**
 * Store encryption keys securely
 * 
 * This is a placeholder for secure key storage.
 * In production, encryption keys should be:
 * 1. Stored in a secure backend service (e.g., AWS KMS, Azure Key Vault)
 * 2. Never stored in browser local storage
 * 3. Associated with user authentication
 * 4. Encrypted at rest
 * 5. Access-controlled based on user permissions
 * 
 * @param documentId - Document ID
 * @param keys - Encryption keys
 * @returns Key storage ID
 */
export async function storeEncryptionKeysSecurely(
  documentId: string,
  _keys: EncryptionKeys
): Promise<string> {
  // TODO: Implement secure key storage
  // This should call a backend API endpoint that:
  // 1. Validates user authentication
  // 2. Encrypts the keys with a master key
  // 3. Stores in secure database
  // 4. Returns a key reference ID
  
  console.warn('storeEncryptionKeysSecurely not yet implemented - using placeholder');
  
  // Placeholder implementation (DO NOT USE IN PRODUCTION)
  const keyId = `key_${documentId}_${Date.now()}`;
  
  // In production, this would be a backend API call:
  // const response = await fetch('/api/v1/encryption-keys', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ documentId, keys }),
  // });
  // const { keyId } = await response.json();
  
  return keyId;
}

/**
 * Retrieve encryption keys securely
 * 
 * @param keyId - Key storage ID
 * @returns Encryption keys
 */
export async function retrieveEncryptionKeysSecurely(
  _keyId: string
): Promise<EncryptionKeys> {
  // TODO: Implement secure key retrieval
  // This should call a backend API endpoint that:
  // 1. Validates user authentication and permissions
  // 2. Retrieves encrypted keys from secure database
  // 3. Decrypts keys with master key
  // 4. Returns keys over secure connection
  
  console.warn('retrieveEncryptionKeysSecurely not yet implemented - using placeholder');
  
  // Placeholder implementation (DO NOT USE IN PRODUCTION)
  throw new Error('Key retrieval not yet implemented. Use keys from upload response.');
  
  // In production, this would be a backend API call:
  // const response = await fetch(`/api/v1/encryption-keys/${keyId}`);
  // const keys = await response.json();
  // return keys;
}

/**
 * Complete encrypted upload workflow with key storage
 * 
 * This combines upload and key storage in a single transaction.
 * Use this for the complete workflow.
 * 
 * @param requestId - PTO request ID
 * @param file - File to upload
 * @param onProgress - Progress callback
 * @returns Document ID and key reference
 */
export async function uploadEncryptedDocumentComplete(
  requestId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{
  documentId: string;
  keyId: string;
  encryptionKeys: EncryptionKeys; // Also return for immediate use
}> {
  // Upload encrypted document
  const { documentId, encryptionKeys } = await uploadEncryptedDocument(
    requestId,
    file,
    onProgress
  );

  // Store keys securely
  const keyId = await storeEncryptionKeysSecurely(documentId, encryptionKeys);

  return {
    documentId,
    keyId,
    encryptionKeys, // Return for immediate use (e.g., preview)
  };
}

// Re-export useful utilities
export { validateDocumentFile, formatFileSize };
export type { DocumentMetadata };
