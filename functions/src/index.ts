import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

/**
 * Cloud Function triggered when a user's email is verified
 * Automatically approves the user and sets custom claims
 */
export const onEmailVerified = functions.auth.user().onCreate(async (user) => {
  const { uid, email, emailVerified } = user;

  console.log(`New user created: ${uid}, email: ${email}, verified: ${emailVerified}`);

  // Note: onCreate fires when user is created, not when email is verified
  // We'll use a separate scheduled function or client-side trigger for verification
  return null;
});

/**
 * HTTP Function to check and approve user after email verification
 * Called by the client after email verification is detected
 */
export const approveUserAfterVerification = functions.https.onCall(
  async (data, context) => {
    // Verify the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to call this function.'
      );
    }

    const uid = context.auth.uid;

    try {
      // Get the current user's auth record
      const userRecord = await auth.getUser(uid);

      if (!userRecord.emailVerified) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Email is not verified yet. Please verify your email first.'
        );
      }

      // Get user document from Firestore
      const userDocRef = db.collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User document not found in Firestore.'
        );
      }

      const userData = userDoc.data();

      // Update user status to approved (matches frontend User type)
      await userDocRef.update({
        status: 'approved',
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

      console.log(`User ${uid} approved and custom claims set`);

      return {
        success: true,
        message: 'Account activated successfully',
        user: {
          id: uid,
          email: userRecord.email,
          role: userData?.role,
          status: 'approved',
        },
      };
    } catch (error) {
      console.error('Error approving user:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to approve user account',
        error
      );
    }
  }
);

/**
 * HTTP Function to set custom claims for a user (admin only)
 * Can be used by administrators to manually approve users
 */
export const setUserClaims = functions.https.onCall(async (data, context) => {
  // Verify the caller is an admin
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can set custom claims.'
    );
  }

  const { uid, claims } = data;

  if (!uid || !claims) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing uid or claims in request.'
    );
  }

  try {
    await auth.setCustomUserClaims(uid, claims);

    // Update Firestore document
    await db.collection('users').doc(uid).update({
      status: 'approved',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create audit log
    await db.collection('auditLogs').add({
      userId: uid,
      action: 'claims_updated',
      details: {
        claims,
        performedBy: context.auth.uid,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Custom claims set successfully' };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to set custom claims',
      error
    );
  }
});

/**
 * Scheduled function to clean up unverified accounts after 7 days
 * Runs daily at midnight
 */
export const cleanupUnverifiedAccounts = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/Detroit')
  .onRun(async (context) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      // Find unverified users older than 7 days
      const unverifiedUsersQuery = db
        .collection('users')
        .where('emailVerified', '==', false)
        .where('createdAt', '<', sevenDaysAgo);

      const unverifiedUsers = await unverifiedUsersQuery.get();

      const deletePromises: Promise<any>[] = [];

      unverifiedUsers.forEach((doc) => {
        const userData = doc.data();
        console.log(`Deleting unverified user: ${doc.id} (${userData.email})`);

        // Delete auth user
        deletePromises.push(auth.deleteUser(doc.id));

        // Delete Firestore document
        deletePromises.push(doc.ref.delete());
      });

      await Promise.all(deletePromises);

      console.log(`Cleaned up ${unverifiedUsers.size} unverified accounts`);
      return null;
    } catch (error) {
      console.error('Error cleaning up unverified accounts:', error);
      return null;
    }
  });

/**
 * HTTP Function to get tenant information by tenant code
 */
export const getTenantByCode = functions.https.onCall(async (data, context) => {
  const { tenantCode } = data;

  if (!tenantCode) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Tenant code is required.'
    );
  }

  try {
    const tenantsQuery = db
      .collection('tenants')
      .where('tenantCode', '==', tenantCode.toUpperCase())
      .limit(1);

    const tenantSnapshot = await tenantsQuery.get();

    if (tenantSnapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'No company found with this tenant code.'
      );
    }

    const tenantDoc = tenantSnapshot.docs[0];
    const tenantData = tenantDoc.data();

    return {
      success: true,
      tenant: {
        id: tenantDoc.id,
        companyName: tenantData.companyName,
        size: tenantData.size,
        tenantCode: tenantData.tenantCode,
      },
    };
  } catch (error) {
    console.error('Error fetching tenant:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch tenant information',
      error
    );
  }
});

/**
 * HTTP Function to generate a signed URL for document upload
 * Provides secure direct-to-storage upload capability
 */
export const generateDocumentUploadUrl = functions.https.onCall(
  async (data, context) => {
    // Verify the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to upload documents.'
      );
    }

    const { requestId, fileName, contentType } = data;
    const userId = context.auth.uid;
    const tenantId = context.auth.token.tenantId;

    // Validate input
    if (!requestId || !fileName || !contentType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Request ID, file name, and content type are required.'
      );
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid file type. Only images and PDFs are allowed.'
      );
    }

    try {
      // Verify the request exists and belongs to the user
      const requestDoc = await db.collection('sickTimeRequests').doc(requestId).get();
      
      if (!requestDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Sick time request not found.'
        );
      }

      const requestData = requestDoc.data();
      
      // Verify ownership
      if (requestData?.userId !== userId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You can only upload documents for your own requests.'
        );
      }

      // Check if request is already approved (immutability check)
      if (requestData?.status === 'approved') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Cannot upload documents to an approved request. Documents are immutable after approval.'
        );
      }

      // Generate the storage path
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `tenants/${tenantId}/employees/${userId}/documents/${requestId}/${timestamp}_${sanitizedFileName}`;

      // Get a reference to the file
      const bucket = storage.bucket();
      const file = bucket.file(storagePath);

      // Generate a signed URL for upload (valid for 15 minutes)
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType,
      });

      // Create a document metadata record in Firestore
      const documentMetadata = {
        requestId,
        userId,
        tenantId,
        fileName: sanitizedFileName,
        originalFileName: fileName,
        storagePath,
        contentType,
        status: 'pending', // Will be 'uploaded' once confirmed
        uploadedAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('documents').add(documentMetadata);

      // Log the upload URL generation
      await db.collection('auditLogs').add({
        userId,
        employerId: tenantId,
        action: 'document_upload_url_generated',
        details: {
          documentId: docRef.id,
          requestId,
          fileName: sanitizedFileName,
          storagePath,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Generated upload URL for user ${userId}, request ${requestId}`);

      return {
        success: true,
        uploadUrl: signedUrl,
        documentId: docRef.id,
        storagePath,
        expiresIn: 900, // seconds
      };
    } catch (error) {
      console.error('Error generating upload URL:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate upload URL',
        error
      );
    }
  }
);

/**
 * HTTP Function to confirm document upload and update metadata
 * Called by the client after successful upload
 */
export const confirmDocumentUpload = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated.'
      );
    }

    const { documentId } = data;
    const userId = context.auth.uid;

    if (!documentId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Document ID is required.'
      );
    }

    try {
      const docRef = db.collection('documents').doc(documentId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Document not found.'
        );
      }

      const docData = docSnap.data();

      // Verify ownership
      if (docData?.userId !== userId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You can only confirm your own uploads.'
        );
      }

      // Update document status
      await docRef.update({
        status: 'uploaded',
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update the sick time request with document reference
      const requestRef = db.collection('sickTimeRequests').doc(docData.requestId);
      await requestRef.update({
        hasDocuments: true,
        documentIds: admin.firestore.FieldValue.arrayUnion(documentId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log the confirmation
      await db.collection('auditLogs').add({
        userId,
        employerId: docData.tenantId,
        action: 'document_upload_confirmed',
        details: {
          documentId,
          requestId: docData.requestId,
          fileName: docData.fileName,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: 'Document upload confirmed' };
    } catch (error) {
      console.error('Error confirming upload:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Failed to confirm upload',
        error
      );
    }
  }
);

/**
 * HTTP Function to get a signed URL for document download/viewing
 * Logs all document access for audit trail
 */
export const getDocumentDownloadUrl = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated.'
      );
    }

    const { documentId } = data;
    const userId = context.auth.uid;
    const tenantId = context.auth.token.tenantId;
    const userRole = context.auth.token.role;

    if (!documentId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Document ID is required.'
      );
    }

    try {
      const docRef = db.collection('documents').doc(documentId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Document not found.'
        );
      }

      const docData = docSnap.data();

      if (!docData) {
        throw new functions.https.HttpsError(
          'not-found',
          'Document data not found.'
        );
      }

      // Verify access permissions
      const isOwner = docData.userId === userId;
      const isEmployer = (userRole === 'employer' || userRole === 'admin') && 
                         docData.tenantId === tenantId;

      if (!isOwner && !isEmployer) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You do not have permission to access this document.'
        );
      }

      // Generate signed URL for download (valid for 5 minutes)
      const bucket = storage.bucket();
      const file = bucket.file(docData.storagePath);

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      });

      // Log the document access
      await db.collection('auditLogs').add({
        userId,
        employerId: docData.tenantId,
        action: 'document_accessed',
        details: {
          documentId,
          requestId: docData.requestId,
          fileName: docData.fileName,
          accessedBy: userId,
          accessorRole: userRole,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update document access count
      await docRef.update({
        accessCount: admin.firestore.FieldValue.increment(1),
        lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastAccessedBy: userId,
      });

      return {
        success: true,
        downloadUrl: signedUrl,
        fileName: docData.originalFileName || docData.fileName,
        contentType: docData.contentType,
        expiresIn: 300, // seconds
      };
    } catch (error) {
      console.error('Error generating download URL:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate download URL',
        error
      );
    }
  }
);

/**
 * Firestore trigger to mark documents as immutable when PTO is approved
 */
export const onPtoApproval = functions.firestore
  .document('sickTimeRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const requestId = context.params.requestId;

    // Check if status changed to approved
    if (beforeData.status !== 'approved' && afterData.status === 'approved') {
      console.log(`PTO request ${requestId} approved. Marking documents as immutable.`);

      try {
        // Get all documents for this request
        const documentsQuery = db
          .collection('documents')
          .where('requestId', '==', requestId);
        
        const documentsSnapshot = await documentsQuery.get();

        // Update each document to mark as immutable
        const updatePromises = documentsSnapshot.docs.map(async (doc) => {
          const docData = doc.data();
          
          // Update Firestore metadata
          await doc.ref.update({
            immutable: true,
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Update storage file metadata
          try {
            const bucket = storage.bucket();
            const file = bucket.file(docData.storagePath);
            await file.setMetadata({
              metadata: {
                approved: 'true',
                approvedAt: new Date().toISOString(),
                requestId: requestId,
              },
            });
          } catch (storageError) {
            console.error(`Error updating storage metadata for ${doc.id}:`, storageError);
          }
        });

        await Promise.all(updatePromises);

        // Create audit log
        await db.collection('auditLogs').add({
          userId: afterData.userId,
          employerId: afterData.employerId,
          action: 'documents_marked_immutable',
          details: {
            requestId,
            documentCount: documentsSnapshot.size,
            approvedBy: afterData.approvedBy || 'system',
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Marked ${documentsSnapshot.size} documents as immutable for request ${requestId}`);
      } catch (error) {
        console.error('Error marking documents as immutable:', error);
      }
    }

    return null;
  });
