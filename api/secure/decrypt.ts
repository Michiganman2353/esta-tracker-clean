/**
 * Node.js Function: Decrypt Data
 * 
 * This endpoint runs in Node.js runtime for server-side decryption operations.
 * Uses Node.js crypto module for hybrid decryption.
 * 
 * Runtime: Node.js (serverless)
 * 
 * Security: Protected endpoint - requires authentication and authorization.
 * Only authenticated users can decrypt data they have permission to access.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { decryptHybrid, type HybridDecryptionPayload } from '../../packages/backend/src/utils/encryption/hybridEncryption';
import { 
  requireAuth, 
  isResourceOwner, 
  hasTenantAccess, 
  logSecurityEvent,
  type AuthenticatedVercelRequest 
} from '../lib/authMiddleware';

/**
 * Decrypt data using hybrid decryption (RSA-OAEP + AES-GCM)
 * 
 * POST /api/secure/decrypt
 * 
 * Headers:
 * Authorization: Bearer <firebase-id-token>
 * 
 * Request Body:
 * {
 *   payload: {
 *     encryptedData: string;      // Base64 encoded
 *     encryptedAESKey: string;    // Base64 encoded
 *     iv: string;                 // Base64 encoded
 *     authTag: string;            // Base64 encoded
 *   },
 *   privateKey: string;  // RSA private key in PEM format
 *   resourceOwnerId?: string;  // User ID that owns the encrypted data
 *   tenantId?: string;  // Tenant ID for the encrypted data
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   decrypted?: string;
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
    const { payload, privateKey, resourceOwnerId, tenantId } = req.body;

    // Authorization checks
    // 1. If resourceOwnerId is provided, verify user has access to it
    if (resourceOwnerId) {
      const hasAccess = isResourceOwner(req, resourceOwnerId);
      
      // Employers can access their employees' data if in same tenant
      const isEmployerWithAccess = req.user?.role === 'employer' && 
                                    tenantId && 
                                    hasTenantAccess(req, tenantId);
      
      if (!hasAccess && !isEmployerWithAccess && req.user?.role !== 'admin') {
        await logSecurityEvent('decrypt_access_denied', req, {
          reason: 'insufficient_permissions',
          resourceOwnerId,
          tenantId
        });
        
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You do not have permission to decrypt this data'
        });
      }
    }

    // 2. If tenantId is provided, verify user has access to the tenant
    if (tenantId && !hasTenantAccess(req, tenantId)) {
      await logSecurityEvent('decrypt_access_denied', req, {
        reason: 'tenant_access_denied',
        tenantId
      });
      
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have access to this tenant\'s data'
      });
    }

    // Validate input
    if (!payload || typeof payload !== 'object') {
      await logSecurityEvent('decrypt_validation_error', req, {
        error: 'invalid_payload'
      });
      
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payload parameter' 
      });
    }

    if (!privateKey || typeof privateKey !== 'string') {
      await logSecurityEvent('decrypt_validation_error', req, {
        error: 'invalid_private_key'
      });
      
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid privateKey parameter' 
      });
    }

    // Validate payload structure
    const { encryptedData, encryptedAESKey, iv, authTag } = payload;
    
    if (!encryptedData || !encryptedAESKey || !iv || !authTag) {
      await logSecurityEvent('decrypt_validation_error', req, {
        error: 'missing_payload_fields'
      });
      
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required payload fields' 
      });
    }

    // Decrypt data
    const decryptedData = decryptHybrid(
      {
        encryptedData,
        encryptedAESKey,
        iv,
        authTag
      } as HybridDecryptionPayload,
      privateKey
    );

    // Log successful decryption
    await logSecurityEvent('decrypt_success', req, {
      resourceOwnerId: resourceOwnerId || 'not_specified',
      tenantId: tenantId || 'not_specified',
      dataSize: encryptedData.length
    });

    // Return decrypted data
    return res.status(200).json({
      success: true,
      decrypted: decryptedData
    });

  } catch (error) {
    console.error('Decryption error:', error);
    
    // Log decryption failure
    await logSecurityEvent('decrypt_error', req, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({ 
      success: false, 
      error: 'Decryption failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
