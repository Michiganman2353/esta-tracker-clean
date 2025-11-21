import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAuth, getFirebaseDb, generateId } from '../../../lib/firebase';
import { setCorsHeaders, handlePreflight } from '../../../lib/cors';

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
    const employerId = generateId('company');
    
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
