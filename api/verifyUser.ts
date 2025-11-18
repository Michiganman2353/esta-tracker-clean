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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uid } = req.body as { uid: string };

    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get the user's auth record
    const userRecord = await auth.getUser(uid);

    if (!userRecord.emailVerified) {
      return res.status(400).json({ 
        error: 'Email is not verified yet. Please verify your email first.',
        emailVerified: false,
      });
    }

    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User document not found in Firestore.' });
    }

    const userData = userDoc.data();

    // Update user status to active
    await db.collection('users').doc(uid).update({
      status: 'active',
      emailVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If user is an employer, also activate the tenant
    if (userData?.role === 'employer' && userData?.tenantId) {
      await db.collection('tenants').doc(userData.tenantId).update({
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Set custom claims based on role
    const claims: { [key: string]: any } = {
      role: userData?.role || 'employee',
      tenantId: userData?.tenantId || userData?.employerId,
      emailVerified: true,
    };

    await auth.setCustomUserClaims(uid, claims);

    // Create audit log
    await db.collection('auditLogs').add({
      userId: uid,
      employerId: userData?.employerId || userData?.tenantId,
      action: 'email_verified',
      details: {
        email: userRecord.email,
        role: userData?.role,
        approvedAt: new Date().toISOString(),
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`User ${uid} approved and custom claims set`);

    return res.status(200).json({
      success: true,
      message: 'Account activated successfully',
      emailVerified: true,
      status: 'active',
      user: {
        id: uid,
        email: userRecord.email,
        role: userData?.role,
        tenantId: userData?.tenantId || userData?.employerId,
      },
    });
  } catch (error: any) {
    console.error('Verification error:', error);

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(500).json({ 
      error: 'Verification failed. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
