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
 * Manager Registration API Endpoint
 * POST /api/v1/auth/register/manager
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
    const { name, email, password, companyName, employeeCount } = req.body;

    // Validation
    if (!name || !email || !password || !companyName || !employeeCount) {
      return res.status(400).json({
        message: 'Name, email, password, company name, and employee count are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
      });
    }

    if (employeeCount < 1) {
      return res.status(400).json({
        message: 'Employee count must be at least 1',
      });
    }

    // Determine employer size based on Michigan ESTA law
    const employerSize = employeeCount < 10 ? 'small' : 'large';

    // Create Firebase Auth user
    const auth = getAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // Generate custom token for immediate login
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Store user data in Firestore
    const db = getFirestore();
    const employerId = `company-${Date.now()}`;
    
    const userData = {
      id: userRecord.uid,
      email,
      name,
      role: 'employer',
      employerId,
      employerSize,
      companyName,
      employeeCount,
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Create employer record
    await db.collection('employers').doc(employerId).set({
      id: employerId,
      name: companyName,
      size: employerSize,
      employeeCount,
      ownerId: userRecord.uid,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Registration completed successfully.',
      token: customToken,
      user: userData,
    });
  } catch (error: any) {
    console.error('Manager registration error:', error);

    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        message: 'Email already registered',
      });
    }

    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({
        message: 'Invalid email address',
      });
    }

    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        message: 'Password is too weak',
      });
    }

    return res.status(500).json({
      message: 'Registration failed. Please try again later.',
      error: error.message,
    });
  }
}
