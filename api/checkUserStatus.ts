import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uid } = req.query as { uid: string };

    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get the user's auth record
    const userRecord = await auth.getUser(uid);
    
    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    return res.status(200).json({
      success: true,
      emailVerified: userRecord.emailVerified,
      status: userData?.status || 'pending',
      approved: userData?.status === 'active',
      user: {
        id: uid,
        email: userRecord.email,
        role: userData?.role,
        tenantId: userData?.tenantId || userData?.employerId,
        emailVerified: userRecord.emailVerified,
        status: userData?.status,
      },
    });
  } catch (error: any) {
    console.error('Status check error:', error);

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(500).json({ 
      error: 'Status check failed. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
