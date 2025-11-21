import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAuth, getFirebaseDb } from '../../../lib/firebase';
import { setCorsHeaders, handlePreflight } from '../../../lib/cors';

/**
 * Employee Registration API Endpoint
 * POST /api/v1/auth/register/employee
 * 
 * Note: Employee registration creates a basic account.
 * Employees must be associated with an employer through the employer's invite system.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  const origin = req.headers.origin || '';
  setCorsHeaders(res, origin);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(res, origin);
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
      });
    }

    // Create Firebase Auth user
    const auth = getFirebaseAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // Generate custom token for immediate login
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Store user data in Firestore
    const db = getFirebaseDb();
    
    // Note: employerSize will be updated when employee is associated with an employer
    const userData = {
      id: userRecord.uid,
      email,
      name,
      role: 'employee',
      employerSize: null, // Will be set when associated with employer
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    return res.status(200).json({
      success: true,
      message: 'Registration completed successfully.',
      token: customToken,
      user: userData,
    });
  } catch (error: any) {
    console.error('Employee registration error:', error);

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
