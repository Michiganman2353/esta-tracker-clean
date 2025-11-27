/**
 * Server-side Firebase Configuration Proxy
 *
 * This endpoint provides Firebase configuration via server-side scripting
 * instead of exposing VITE secrets directly in the frontend bundle.
 *
 * Runtime: Node.js (serverless)
 *
 * Security:
 * - Rate-limited to prevent abuse
 * - Validates request origin
 * - Returns only necessary public configuration
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Allowed origins for CORS
 * In production, this should be restricted to your domain
 */
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  process.env.PRODUCTION_URL || '',
].filter(Boolean);

/**
 * Simple in-memory rate limiter
 * In production, use Redis or a proper rate limiting service
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(clientIP);

  if (!record || now > record.resetTime) {
    requestCounts.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count++;
  return false;
}

/**
 * Get Firebase configuration from environment variables
 * Returns only the public configuration needed for client initialization
 */
function getFirebaseConfig(): Record<string, string | undefined> {
  return {
    apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain:
      process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:
      process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      process.env.FIREBASE_MESSAGING_SENDER_ID ||
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
    measurementId:
      process.env.FIREBASE_MEASUREMENT_ID ||
      process.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

/**
 * Firebase Configuration Endpoint
 *
 * GET /api/secure/firebase-config
 *
 * Response:
 * {
 *   success: boolean;
 *   config?: {
 *     apiKey: string;
 *     authDomain: string;
 *     projectId: string;
 *     storageBucket: string;
 *     messagingSenderId: string;
 *     appId: string;
 *     measurementId?: string;
 *   };
 *   error?: string;
 * }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS handling - set headers for all requests
  const origin = req.headers.origin || '';

  // Use exact matching for allowed origins to prevent subdomain bypasses
  const isAllowedOrigin = ALLOWED_ORIGINS.some((allowed) => {
    if (allowed === '*') return true;
    // Exact match for security
    return origin === allowed;
  });

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Only allow GET for actual requests
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
    return;
  }

  // Get client IP for rate limiting
  const clientIP =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  // Check rate limit
  if (isRateLimited(clientIP)) {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
    });
    return;
  }

  try {
    const config = getFirebaseConfig();

    // Validate that required fields are present
    const requiredFields = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId',
    ];
    const missingFields = requiredFields.filter((field) => !config[field]);

    if (missingFields.length > 0) {
      console.error(
        '[firebase-config] Missing required environment variables:',
        missingFields
      );
      res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
      return;
    }

    // Return Firebase configuration
    res.status(200).json({
      success: true,
      config: {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
        ...(config.measurementId && { measurementId: config.measurementId }),
      },
    });
  } catch (error) {
    console.error('[firebase-config] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration',
    });
  }
}
