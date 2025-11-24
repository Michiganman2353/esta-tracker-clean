/**
 * Node.js Function: KMS Encrypt Data
 * 
 * This endpoint runs in Node.js runtime for server-side encryption operations.
 * Uses KMS-backed hybrid encryption for production-grade security.
 * 
 * Runtime: Node.js (serverless)
 * 
 * Security: Can be used by authenticated users to encrypt their data.
 * Rate-limited to prevent abuse.
 */

import type { VercelResponse } from '@vercel/node';
import { encryptWithKMS } from '../lib/services/kmsHybridEncryption';
import { 
  requireAuth, 
  logSecurityEvent,
  type AuthenticatedVercelRequest 
} from '../lib/authMiddleware';

/**
 * Encrypt data using KMS-backed hybrid encryption
 * 
 * POST /api/secure/encrypt
 * 
 * Headers:
 * Authorization: Bearer <firebase-id-token>
 * 
 * Request Body:
 * {
 *   data: string;              // Data to encrypt
 *   keyVersion?: string;       // Optional KMS key version
 *   metadata?: {               // Optional metadata for audit logging
 *     resourceType?: string;   // e.g., "employee_ssn", "company_ein"
 *     resourceId?: string;     // Resource identifier
 *     tenantId?: string;       // Tenant identifier
 *   }
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   encrypted?: {
 *     encryptedData: string;      // Base64 AES-encrypted data
 *     encryptedAESKey: string;    // Base64 KMS-encrypted AES key
 *     iv: string;                 // Base64 initialization vector
 *     authTag: string;            // Base64 authentication tag
 *     keyPath: string;            // KMS key path used
 *     keyVersion: string;         // KMS key version used
 *   };
 *   error?: string;
 * }
 */
export default async function handler(req: AuthenticatedVercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // Require authentication
  const authResult = await requireAuth(req, res);
  if (!authResult.success) {
    // Response already sent by requireAuth
    return;
  }

  try {
    const { data, keyVersion, metadata } = req.body;

    // Validate input
    if (!data || typeof data !== 'string') {
      await logSecurityEvent('encrypt_validation_error', req, {
        error: 'invalid_data_parameter'
      });
      
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid data parameter - must be a non-empty string' 
      });
    }

    // Check data size (prevent abuse)
    if (data.length > 10 * 1024 * 1024) { // 10MB limit
      await logSecurityEvent('encrypt_validation_error', req, {
        error: 'data_too_large',
        size: data.length
      });
      
      return res.status(400).json({ 
        success: false, 
        error: 'Data too large - maximum 10MB' 
      });
    }

    // Validate key version if provided
    if (keyVersion && typeof keyVersion !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid keyVersion parameter' 
      });
    }

    // Encrypt data with KMS
    const encrypted = await encryptWithKMS(data, keyVersion);

    // Log successful encryption
    await logSecurityEvent('encrypt_success_kms', req, {
      userId: req.user?.uid,
      dataSize: data.length,
      keyVersion: encrypted.keyVersion,
      resourceType: metadata?.resourceType || 'unspecified',
      resourceId: metadata?.resourceId || 'unspecified',
      tenantId: metadata?.tenantId || 'unspecified'
    });

    // Return encrypted data
    return res.status(200).json({
      success: true,
      encrypted: {
        encryptedData: encrypted.encryptedData,
        encryptedAESKey: encrypted.encryptedAESKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        keyPath: encrypted.keyPath,
        keyVersion: encrypted.keyVersion
      }
    });

  } catch (error) {
    console.error('KMS encryption error:', error);
    
    // Log encryption failure
    await logSecurityEvent('encrypt_error', req, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({ 
      success: false, 
      error: 'Encryption failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
