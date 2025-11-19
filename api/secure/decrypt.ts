/**
 * Node.js Function: Decrypt Data
 * 
 * This endpoint runs in Node.js runtime for server-side decryption operations.
 * Uses Node.js crypto module for hybrid decryption.
 * 
 * Runtime: Node.js (serverless)
 * 
 * Security: This endpoint should be protected and only accessible to authenticated users.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { decryptHybrid, type HybridDecryptionPayload } from '../../packages/backend/src/utils/encryption/hybridEncryption';

/**
 * Decrypt data using hybrid decryption (RSA-OAEP + AES-GCM)
 * 
 * POST /api/secure/decrypt
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
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   decrypted?: string;
 *   error?: string;
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payload, privateKey } = req.body;

    // Validate input
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ 
        success: false, 
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
