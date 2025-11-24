/**
 * Edge Function: Encrypt Data
 * 
 * This endpoint runs on Vercel Edge Network for low-latency encryption operations.
 * Uses Web Crypto API for client-side encryption helpers.
 * 
 * Runtime: Edge (Vercel Edge Functions)
 */

import type { NextRequest } from 'next/server';

// Specify Edge runtime
export const config = {
  runtime: 'edge',
};

/**
 * Encrypt data using hybrid encryption (AES-GCM + RSA-OAEP)
 * 
 * POST /api/edge/encrypt
 * 
 * Request Body:
 * {
 *   data: string;          // Data to encrypt
 *   publicKey: JsonWebKey; // RSA public key in JWK format
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   encrypted: {
 *     encryptedData: string;      // Base64 encoded
 *     encryptedAESKey: string;    // Base64 encoded
 *     iv: string;                 // Base64 encoded
 *   }
 * }
 */
export default async function handler(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // GET request - health check
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'ok',
      runtime: 'edge',
      service: 'encryption',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request body
    const body = await request.json() as unknown;
    
    // Validate body is an object
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request body' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const { data, publicKey } = body as { data?: unknown; publicKey?: unknown };

    // Validate input
    if (!data || typeof data !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid data parameter' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!publicKey || typeof publicKey !== 'object') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid publicKey parameter' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Import public key
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      publicKey,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    );

    // Generate AES key
    const aesKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt']
    );

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt data with AES-GCM
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      aesKey,
      dataBuffer
    );

    // Encrypt AES key with RSA
    const aesKeyData = await crypto.subtle.exportKey('raw', aesKey);
    const encryptedAESKey = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      cryptoKey,
      aesKeyData
    );

    // Convert to base64
    const encryptedDataBase64 = arrayBufferToBase64(encryptedData);
    const encryptedAESKeyBase64 = arrayBufferToBase64(encryptedAESKey);
    const ivBase64 = arrayBufferToBase64(iv.buffer);

    // Return encrypted data
    return new Response(JSON.stringify({
      success: true,
      encrypted: {
        encryptedData: encryptedDataBase64,
        encryptedAESKey: encryptedAESKeyBase64,
        iv: ivBase64
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Edge encryption error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Encryption failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Helper: Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}
