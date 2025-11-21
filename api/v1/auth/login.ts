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
 * Login API Endpoint
 * POST /api/v1/auth/login
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

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, idToken } = req.body;

    // Validation
    if (!idToken && (!email || !password)) {
      return res.status(400).json({
        message: 'Email and password or ID token are required',
      });
    }

    const auth = getAuth();
    let uid: string;

    if (idToken) {
      // Verify Firebase ID token from client-side auth
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
    } else {
      // For development/testing: lookup user by email
      // In production, clients should use Firebase Auth client SDK
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    }

    // Get user data from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const userData = userDoc.data();

    // Generate custom token
    const customToken = await auth.createCustomToken(uid);

    return res.status(200).json({
      success: true,
      token: customToken,
      user: userData,
    });
  } catch (error: any) {
    console.error('Login error:', error);

    // Handle Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    if (error.code === 'auth/invalid-credential') {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        message: 'Session expired. Please login again.',
      });
    }

    return res.status(500).json({
      message: 'Login failed. Please try again later.',
      error: error.message,
    });
  }
}
