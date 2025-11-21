import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    // For local development, use default credentials
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
}

/**
 * Get Current User API Endpoint
 * GET /api/v1/auth/me
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://estatracker.com',
    'https://www.estatracker.com',
  ];

  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null') {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    // Verify the Firebase ID token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const userData = userDoc.data();

    return res.status(200).json({
      user: userData,
    });
  } catch (error: any) {
    console.error('Get user error:', error);

    // Handle Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        message: 'Session expired. Please login again.',
      });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        message: 'Invalid token',
      });
    }

    return res.status(500).json({
      message: 'Failed to get user information.',
      error: error.message,
    });
  }
}
