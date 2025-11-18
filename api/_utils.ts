import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK
 * This ensures the SDK is only initialized once across all serverless functions
 */
export function initializeFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  
  return {
    db: admin.firestore(),
    auth: admin.auth(),
    storage: admin.storage(),
  };
}

/**
 * CORS headers for all API responses
 */
export function getCorsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Set CORS headers on response
 */
export function setCorsHeaders(res: any, origin?: string) {
  const headers = getCorsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

/**
 * Handle OPTIONS preflight requests
 */
export function handlePreflight(res: any) {
  return res.status(200).end();
}

/**
 * Verify Firebase ID token and return decoded token
 */
export async function verifyAuthToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No token provided');
  }

  const token = authHeader.split('Bearer ')[1];
  const { auth } = initializeFirebase();
  
  try {
    return await auth.verifyIdToken(token);
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Token expired. Please log in again.');
    }
    if (error.code === 'auth/invalid-id-token') {
      throw new Error('Invalid token.');
    }
    throw new Error('Authentication failed');
  }
}

/**
 * Standard error response
 */
export function sendError(res: any, status: number, message: string, details?: any) {
  return res.status(status).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
  });
}

/**
 * Standard success response
 */
export function sendSuccess(res: any, data: any) {
  return res.status(200).json({
    success: true,
    ...data,
  });
}
