import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAuth, getFirebaseDb } from '../../../lib/firebase';
import { setCorsHeaders, handlePreflight } from '../../../lib/cors';
import { validateRequiredFields } from '../../../lib/validation';

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

    console.log('[DEBUG] Employee registration request received');
    console.log('[DEBUG] Request body (sanitized):', {
      name,
      email,
      hasPassword: !!password,
      passwordLength: password?.length,
    });

    // Validation - use defensive check utility for consistency
    const requestData = { name, email, password };
    try {
      validateRequiredFields(
        requestData,
        ['name', 'email', 'password'],
        'request data'
      );
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Missing required fields',
      });
    }

    if (password.length < 8) {
      console.error('[DEBUG] Validation failed: Password too short');
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
      });
    }

    // Create Firebase Auth user
    console.log('[DEBUG] Creating Firebase Auth user');
    const auth = getFirebaseAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });
    console.log('[DEBUG] Firebase Auth user created:', userRecord.uid);

    // Generate custom token for immediate login
    console.log('[DEBUG] Generating custom token');
    const customToken = await auth.createCustomToken(userRecord.uid);
    console.log('[DEBUG] Custom token generated successfully');

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

    // Defensive check: Ensure all required fields are present
    validateRequiredFields(userData, ['id', 'email', 'name', 'role'], 'user data');

    console.log('[DEBUG] Saving user data to Firestore');
    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('[DEBUG] User data saved successfully');

    console.log('[DEBUG] Employee registration completed successfully');
    return res.status(200).json({
      success: true,
      message: 'Registration completed successfully.',
      token: customToken,
      user: userData,
    });
  } catch (error: any) {
    console.error('[DEBUG] Employee registration error:', error);
    console.error('[DEBUG] Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      console.error('[DEBUG] Error: Email already exists');
      return res.status(409).json({
        message: 'Email already registered',
      });
    }

    if (error.code === 'auth/invalid-email') {
      console.error('[DEBUG] Error: Invalid email');
      return res.status(400).json({
        message: 'Invalid email address',
      });
    }

    if (error.code === 'auth/weak-password') {
      console.error('[DEBUG] Error: Weak password');
      return res.status(400).json({
        message: 'Password is too weak',
      });
    }

    console.error('[DEBUG] Unhandled error, returning 500');
    return res.status(500).json({
      message: 'Registration failed. Please try again later.',
      error: error.message,
    });
  }
}
