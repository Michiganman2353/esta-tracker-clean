import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Document upload service for secure document handling
 * Implements signed URL upload flow with audit logging
 */

interface UploadUrlResponse {
  success: boolean;
  uploadUrl: string;
  documentId: string;
  storagePath: string;
  expiresIn: number;
}

interface ConfirmUploadResponse {
  success: boolean;
  message: string;
}

interface DownloadUrlResponse {
  success: boolean;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  expiresIn: number;
}

export interface DocumentMetadata {
  documentId: string;
  requestId: string;
  userId: string;
  tenantId: string;
  fileName: string;
  originalFileName: string;
  storagePath: string;
  contentType: string;
  status: 'pending' | 'uploaded' | 'failed';
  uploadedAt: Date | null;
  createdAt: Date;
  immutable?: boolean;
  approvedAt?: Date;
  accessCount?: number;
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
}

/**
 * Generate a signed URL for uploading a document
 * @param requestId - The PTO request ID
 * @param file - The file to upload
 * @returns Upload URL and document metadata
 */
export async function generateDocumentUploadUrl(
  requestId: string,
  file: File
): Promise<UploadUrlResponse> {
  try {
    const functions = getFunctions();
    const generateUrl = httpsCallable<
      { requestId: string; fileName: string; contentType: string },
      UploadUrlResponse
    >(functions, 'generateDocumentUploadUrl');

    const result = await generateUrl({
      requestId,
      fileName: file.name,
      contentType: file.type,
    });

    return result.data;
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw new Error('Failed to generate upload URL. Please try again.');
  }
}

/**
 * Upload a document using a signed URL
 * @param uploadUrl - The signed URL from Cloud Function
 * @param file - The file to upload
 * @param onProgress - Optional progress callback
 * @returns Promise that resolves when upload completes
 */
export async function uploadDocumentToSignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Confirm document upload after successful transfer
 * @param documentId - The document ID from generateDocumentUploadUrl
 * @returns Confirmation response
 */
export async function confirmDocumentUpload(
  documentId: string
): Promise<ConfirmUploadResponse> {
  try {
    const functions = getFunctions();
    const confirmUpload = httpsCallable<
      { documentId: string },
      ConfirmUploadResponse
    >(functions, 'confirmDocumentUpload');

    const result = await confirmUpload({ documentId });
    return result.data;
  } catch (error) {
    console.error('Error confirming upload:', error);
    throw new Error('Failed to confirm document upload.');
  }
}

/**
 * Complete document upload flow: generate URL, upload, confirm
 * @param requestId - The PTO request ID
 * @param file - The file to upload
 * @param onProgress - Optional progress callback
 * @returns Document ID
 */
export async function uploadDocument(
  requestId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Step 1: Generate signed URL
    const { uploadUrl, documentId } = await generateDocumentUploadUrl(
      requestId,
      file
    );

    // Step 2: Upload file to signed URL
    await uploadDocumentToSignedUrl(uploadUrl, file, onProgress);

    // Step 3: Confirm upload
    await confirmDocumentUpload(documentId);

    return documentId;
  } catch (error) {
    console.error('Error in document upload flow:', error);
    throw error;
  }
}

/**
 * Get a download URL for a document
 * @param documentId - The document ID
 * @returns Download URL and metadata
 */
export async function getDocumentDownloadUrl(
  documentId: string
): Promise<DownloadUrlResponse> {
  try {
    const functions = getFunctions();
    const getDownloadUrl = httpsCallable<
      { documentId: string },
      DownloadUrlResponse
    >(functions, 'getDocumentDownloadUrl');

    const result = await getDownloadUrl({ documentId });
    return result.data;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw new Error('Failed to get document download URL.');
  }
}

/**
 * Download a document
 * @param documentId - The document ID
 * @returns Blob of the document
 */
export async function downloadDocument(documentId: string): Promise<Blob> {
  try {
    const { downloadUrl } = await getDocumentDownloadUrl(documentId);

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
}

/**
 * Validate file before upload
 * @param file - The file to validate
 * @returns Validation result
 */
export function validateDocumentFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB',
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only images (JPEG, PNG) and PDF files are allowed',
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
