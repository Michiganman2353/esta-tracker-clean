/**
 * Node.js Function: Decrypt Data
 * 
 * This endpoint runs in Node.js runtime for server-side decryption operations.
 * Uses Google Cloud KMS for secure key management.
 * 
 * Runtime: Node.js (serverless)
 * 
 * Security: This endpoint MUST be protected and only accessible to authenticated users.
 * 
 * UPDATED: Now uses KMS-backed decryption instead of accepting private keys
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kmsDecrypt, type KMSDecryptionPayload } from '../../packages/backend/src/services/kmsEncryption';
import { initializeKMS } from '../../packages/backend/src/services/kms';

/**
 * Decrypt data using KMS-backed hybrid decryption
 * 
 * POST /api/secure/decrypt
 * 
 * Request Body:
 * {
 *   payload: {
 *     encryptedData: string;      // Base64 encoded
 *     wrappedKey: string;         // Base64 encoded KMS-wrapped key (formerly encryptedAESKey)
 *     iv: string;                 // Base64 encoded
 *     authTag: string;            // Base64 encoded
 *   }
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   decrypted?: string;
 *   error?: string;
 * }
 * 
 * SECURITY IMPROVEMENTS:
 * - No longer accepts private keys in request (security risk)
 * - Uses KMS for key unwrapping (keys never leave secure hardware)
 * - IAM-based access control via KMS
 * - All key operations are audited by Cloud Audit Logs
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // TODO: Add authentication check here
  // Example:
  // const token = req.headers.authorization?.replace('Bearer ', '');
  // if (!token || !verifyToken(token)) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    // Initialize KMS
    initializeKMS();

    const { payload } = req.body;

    // Validate input
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payload parameter' 
      });
    }

    // Validate payload structure
    const { encryptedData, wrappedKey, iv, authTag } = payload;
    
    // Support both old format (encryptedAESKey) and new format (wrappedKey)
    const keyField = wrappedKey || payload.encryptedAESKey;
    
    if (!encryptedData || !keyField || !iv || !authTag) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required payload fields (encryptedData, wrappedKey, iv, authTag)' 
      });
    }

    // Decrypt data using KMS
    const decryptedData = await kmsDecrypt({
      encryptedData,
      wrappedKey: keyField,
      iv,
      authTag
    } as KMSDecryptionPayload);

    // Return decrypted data
    return res.status(200).json({
      success: true,
      decrypted: decryptedData
    });

  } catch (error) {
    console.error('KMS decryption error:', error);
    
    // Don't leak detailed error messages in production
    return res.status(500).json({ 
      success: false, 
      error: 'Decryption failed',
      message: process.env.NODE_ENV === 'development'
        ? (error instanceof Error ? error.message : 'Unknown error')
        : 'Internal server error'
    });
  }
} 
        error: 'Invalid payload parameter' 
      });
    }

    if (!privateKey || typeof privateKey !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid privateKey parameter' 
      });
    }

    // Validate payload structure
    const { encryptedData, encryptedAESKey, iv, authTag } = payload;
    
    if (!encryptedData || !encryptedAESKey || !iv || !authTag) {
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

    // Return decrypted data
    return res.status(200).json({
      success: true,
      decrypted: decryptedData
    });

  } catch (error) {
    console.error('Decryption error:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Decryption failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
