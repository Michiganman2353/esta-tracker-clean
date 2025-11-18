/**
 * Shared utilities for Vercel Background Functions
 * Handles job tracking, progress updates, logging, and notifications
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export interface BackgroundJob {
  id: string;
  type: 'csv_import' | 'accrual_recalculation' | 'bulk_employee_update' | 'pto_validation' | 'audit_export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
  tenantId: string;
  userId: string;
  metadata: Record<string, any>;
  error?: string;
  logs: string[];
}

/**
 * Create a new background job in Firestore
 */
export async function createJob(
  type: BackgroundJob['type'],
  tenantId: string,
  userId: string,
  metadata: Record<string, any> = {}
): Promise<string> {
  const jobRef = await db.collection('backgroundJobs').add({
    type,
    status: 'pending',
    progress: 0,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    tenantId,
    userId,
    metadata,
    logs: [],
  });

  return jobRef.id;
}

/**
 * Update job status and progress
 */
export async function updateJobProgress(
  jobId: string,
  progress: number,
  status?: BackgroundJob['status'],
  log?: string
): Promise<void> {
  const updateData: any = {
    progress,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (status) {
    updateData.status = status;
    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
    }
  }

  if (log) {
    updateData.logs = admin.firestore.FieldValue.arrayUnion(
      `[${new Date().toISOString()}] ${log}`
    );
  }

  await db.collection('backgroundJobs').doc(jobId).update(updateData);
}

/**
 * Mark job as failed with error message
 */
export async function markJobFailed(
  jobId: string,
  error: string
): Promise<void> {
  await db.collection('backgroundJobs').doc(jobId).update({
    status: 'failed',
    error,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    logs: admin.firestore.FieldValue.arrayUnion(
      `[${new Date().toISOString()}] ERROR: ${error}`
    ),
  });
}

/**
 * Mark job as completed
 */
export async function markJobCompleted(
  jobId: string,
  result?: Record<string, any>
): Promise<void> {
  const updateData: any = {
    status: 'completed',
    progress: 100,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    logs: admin.firestore.FieldValue.arrayUnion(
      `[${new Date().toISOString()}] Job completed successfully`
    ),
  };

  if (result) {
    updateData.result = result;
  }

  await db.collection('backgroundJobs').doc(jobId).update(updateData);
}

/**
 * Send notification to user about job completion or failure
 */
export async function sendJobNotification(
  userId: string,
  tenantId: string,
  jobId: string,
  jobType: string,
  status: 'completed' | 'failed',
  message: string
): Promise<void> {
  await db.collection('notifications').add({
    userId,
    tenantId,
    type: 'background_job',
    title: `${jobType} ${status}`,
    message,
    jobId,
    status,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Also log to audit trail
  await db.collection('auditLogs').add({
    userId,
    employerId: tenantId,
    action: `background_job_${status}`,
    details: {
      jobId,
      jobType,
      message,
    },
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Write detailed log entry to Firestore
 */
export async function writeJobLog(
  jobId: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  await db.collection('backgroundJobs').doc(jobId).collection('detailedLogs').add({
    level,
    message,
    metadata: metadata || {},
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Also append to main job logs array
  await updateJobProgress(jobId, -1, undefined, `[${level.toUpperCase()}] ${message}`);
}

/**
 * Verify user has permission for the tenant
 */
export async function verifyUserPermission(
  userId: string,
  tenantId: string,
  requiredRole: 'employee' | 'manager' | 'employer' | 'admin' = 'employee'
): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    const userTenantId = userData?.tenantId || userData?.employerId;
    const userRole = userData?.role || 'employee';

    // Check tenant match
    if (userTenantId !== tenantId) {
      return false;
    }

    // Check role hierarchy
    const roleHierarchy: Record<string, number> = {
      employee: 1,
      manager: 2,
      employer: 3,
      admin: 4,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  } catch (error) {
    console.error('Error verifying user permission:', error);
    return false;
  }
}

/**
 * Get job status for client polling
 */
export async function getJobStatus(jobId: string): Promise<BackgroundJob | null> {
  const jobDoc = await db.collection('backgroundJobs').doc(jobId).get();
  
  if (!jobDoc.exists) {
    return null;
  }

  return { id: jobDoc.id, ...jobDoc.data() } as BackgroundJob;
}
