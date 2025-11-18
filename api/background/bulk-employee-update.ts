/**
 * Bulk Employee Update Background Function
 * Handles mass updates to employee records (department, role, status, etc.)
 * Supports progress streaming and audit logging
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import {
  createJob,
  updateJobProgress,
  markJobCompleted,
  markJobFailed,
  sendJobNotification,
  writeJobLog,
  verifyUserPermission,
  getJobStatus,
} from '../lib/backgroundJobUtils';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface BulkEmployeeUpdateRequest {
  tenantId: string;
  userId: string;
  action: 'initiate' | 'status';
  jobId?: string;
  employeeIds: string[];
  updates: {
    department?: string;
    role?: string;
    status?: 'active' | 'inactive' | 'terminated';
    hireDate?: string;
    manager?: string;
    customFields?: Record<string, any>;
  };
}

/**
 * Validate update fields
 */
function validateUpdates(updates: BulkEmployeeUpdateRequest['updates']): { valid: boolean; error?: string } {
  if (!updates || Object.keys(updates).length === 0) {
    return { valid: false, error: 'No update fields provided' };
  }

  // Validate role
  if (updates.role && !['employee', 'manager', 'employer', 'admin'].includes(updates.role)) {
    return { valid: false, error: 'Invalid role value' };
  }

  // Validate status
  if (updates.status && !['active', 'inactive', 'terminated'].includes(updates.status)) {
    return { valid: false, error: 'Invalid status value' };
  }

  // Validate hire date
  if (updates.hireDate) {
    const date = new Date(updates.hireDate);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid hire date format' };
    }
  }

  return { valid: true };
}

/**
 * Process bulk employee updates in the background
 */
async function processBulkEmployeeUpdate(
  jobId: string,
  tenantId: string,
  userId: string,
  employeeIds: string[],
  updates: BulkEmployeeUpdateRequest['updates']
): Promise<void> {
  try {
    await updateJobProgress(jobId, 5, 'processing', 'Starting bulk employee update');
    await writeJobLog(jobId, 'info', `Updating ${employeeIds.length} employees`);

    // Validate updates
    const validation = validateUpdates(updates);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const totalEmployees = employeeIds.length;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Build Firestore update object
    const firestoreUpdates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId,
    };

    if (updates.department !== undefined) {
      firestoreUpdates.department = updates.department;
    }
    if (updates.role !== undefined) {
      firestoreUpdates.role = updates.role;
    }
    if (updates.status !== undefined) {
      firestoreUpdates.status = updates.status;
      if (updates.status === 'terminated') {
        firestoreUpdates.terminatedAt = admin.firestore.FieldValue.serverTimestamp();
      }
    }
    if (updates.hireDate !== undefined) {
      firestoreUpdates.hireDate = admin.firestore.Timestamp.fromDate(new Date(updates.hireDate));
    }
    if (updates.manager !== undefined) {
      firestoreUpdates.managerId = updates.manager;
    }
    if (updates.customFields) {
      Object.entries(updates.customFields).forEach(([key, value]) => {
        firestoreUpdates[`customFields.${key}`] = value;
      });
    }

    await writeJobLog(jobId, 'info', `Update fields: ${Object.keys(firestoreUpdates).join(', ')}`);

    // Process each employee
    for (let i = 0; i < employeeIds.length; i++) {
      const employeeId = employeeIds[i];
      const progress = 5 + Math.floor((i / totalEmployees) * 80);

      try {
        // Get employee document
        const employeeDoc = await db.collection('users').doc(employeeId).get();

        if (!employeeDoc.exists) {
          errorCount++;
          errors.push(`${employeeId}: Employee not found`);
          await writeJobLog(jobId, 'error', `Employee ${employeeId} not found`);
          continue;
        }

        const employeeData = employeeDoc.data();

        // Verify employee belongs to tenant
        if (employeeData?.tenantId !== tenantId && employeeData?.employerId !== tenantId) {
          errorCount++;
          errors.push(`${employeeId}: Employee does not belong to this tenant`);
          await writeJobLog(jobId, 'error', `Employee ${employeeId} does not belong to tenant ${tenantId}`);
          continue;
        }

        await writeJobLog(jobId, 'info', `Updating employee ${i + 1}/${totalEmployees}: ${employeeData?.email}`);

        // Update employee document
        await employeeDoc.ref.update(firestoreUpdates);

        // If role changed, update Firebase Auth custom claims
        if (updates.role) {
          try {
            await admin.auth().setCustomUserClaims(employeeId, {
              role: updates.role,
              tenantId: employeeData?.tenantId || tenantId,
            });
            await writeJobLog(jobId, 'info', `Updated auth claims for ${employeeData?.email}`);
          } catch (authError) {
            await writeJobLog(jobId, 'warn', `Could not update auth claims for ${employeeData?.email}: ${authError}`);
          }
        }

        // Create audit log entry
        await db.collection('auditLogs').add({
          userId: employeeId,
          employerId: tenantId,
          action: 'bulk_employee_update',
          performedBy: userId,
          details: {
            updates: firestoreUpdates,
            jobId,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        updatedCount++;
        await updateJobProgress(jobId, progress, undefined, `Updated ${updatedCount}/${totalEmployees} employees`);
      } catch (error) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${employeeId}: ${errorMsg}`);
        await writeJobLog(jobId, 'error', `Failed to update employee ${employeeId}: ${errorMsg}`);
      }
    }

    // Complete the job
    const result = {
      totalProcessed: totalEmployees,
      successCount: updatedCount,
      errorCount,
      errors: errors.slice(0, 10),
      updateFields: Object.keys(updates),
    };

    await markJobCompleted(jobId, result);
    await writeJobLog(jobId, 'info', `Bulk employee update completed: ${updatedCount} successful, ${errorCount} failed`);

    // Send notification
    const message = errorCount > 0
      ? `Bulk update completed with ${updatedCount} successful and ${errorCount} failed updates`
      : `Bulk update completed successfully for ${updatedCount} employees`;
    
    await sendJobNotification(userId, tenantId, jobId, 'Bulk Employee Update', 'completed', message);

    // Create summary audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'bulk_employee_update_completed',
      details: result,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await markJobFailed(jobId, errorMsg);
    await writeJobLog(jobId, 'error', `Bulk employee update failed: ${errorMsg}`);
    await sendJobNotification(userId, tenantId, jobId, 'Bulk Employee Update', 'failed', `Update failed: ${errorMsg}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, tenantId, userId, jobId, employeeIds, updates } = req.body as BulkEmployeeUpdateRequest;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Missing tenantId or userId' });
    }

    // Verify user permission
    const hasPermission = await verifyUserPermission(userId, tenantId, 'employer');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Handle status check
    if (action === 'status') {
      if (!jobId) {
        return res.status(400).json({ error: 'Missing jobId for status check' });
      }

      const status = await getJobStatus(jobId);
      if (!status) {
        return res.status(404).json({ error: 'Job not found' });
      }

      return res.status(200).json({ job: status });
    }

    // Handle job initiation
    if (action === 'initiate') {
      if (!employeeIds || employeeIds.length === 0) {
        return res.status(400).json({ error: 'Missing or empty employeeIds array' });
      }

      if (!updates) {
        return res.status(400).json({ error: 'Missing updates object' });
      }

      // Create job
      const newJobId = await createJob('bulk_employee_update', tenantId, userId, {
        employeeCount: employeeIds.length,
        updateFields: Object.keys(updates),
      });

      // Start processing in the background (don't await)
      processBulkEmployeeUpdate(newJobId, tenantId, userId, employeeIds, updates).catch(err => {
        console.error('Background job error:', err);
      });

      return res.status(202).json({
        message: 'Bulk employee update job started',
        jobId: newJobId,
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Bulk employee update handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
