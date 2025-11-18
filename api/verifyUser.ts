import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { initializeFirebase, setCorsHeaders, handlePreflight, verifyAuthToken, sendError, sendSuccess } from './_utils';

const { db, auth } = initializeFirebase();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return handlePreflight(res);
  }

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const decodedToken = await verifyAuthToken(req.headers.authorization);
    const uid = decodedToken.uid;

    // Get the current user's auth record
    const userRecord = await auth.getUser(uid);

    if (!userRecord.emailVerified) {
      return sendError(res, 400, 'Email is not verified yet. Please verify your email first.');
    }

    // Get user document from Firestore
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return sendError(res, 404, 'User document not found in Firestore.');
    }

    const userData = userDoc.data();

    // Update user status to active
    await userDocRef.update({
      status: 'active',
      emailVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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

    console.log(`User ${uid} verified and activated`);

    return sendSuccess(res, {
      message: 'Account activated successfully',
      user: {
        id: uid,
        email: userRecord.email,
        role: userData?.role,
        status: 'active',
      },
    });
  } catch (error: any) {
    console.error('Email verification error:', error);

    if (error.message?.includes('Token expired')) {
      return sendError(res, 401, error.message);
    }

    if (error.message?.includes('Invalid token')) {
      return sendError(res, 401, error.message);
    }

    if (error.message?.includes('Unauthorized')) {
      return sendError(res, 401, error.message);
    }

    return sendError(res, 500, 'Failed to verify user account', error.message);
  }
}
