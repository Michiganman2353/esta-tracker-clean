/**
 * Accrual Recalculation Background Function
 * Recalculates sick time accruals for all employees or specific date ranges
 * Handles bulk recalculations with progress streaming
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

interface AccrualRecalculationRequest {
  tenantId: string;
  userId: string;
  action: 'initiate' | 'status';
  jobId?: string;
  startDate?: string; // Optional: recalculate from this date
  endDate?: string; // Optional: recalculate until this date
  employeeIds?: string[]; // Optional: specific employees to recalculate
}

/**
 * Calculate accrual based on hours worked
 * Michigan ESTA: 1 hour per 30 hours worked
 */
function calculateAccrual(hoursWorked: number, employerSize: 'small' | 'large'): number {
  // Small employers (<50) grant annually, large employers accrue
  if (employerSize === 'small') {
    return 0; // Annual grant, not accrual-based
  }
  
  return Math.floor(hoursWorked / 30);
}

/**
 * Get employer size from tenant data
 */
async function getEmployerSize(tenantId: string): Promise<'small' | 'large'> {
  const tenantDoc = await db.collection('tenants').doc(tenantId).get();
  const tenantData = tenantDoc.data();
  
  // Assuming size is stored in tenant document
  const employeeCount = tenantData?.employeeCount || 0;
  return employeeCount >= 50 ? 'large' : 'small';
}

/**
 * Process accrual recalculation in the background
 */
async function processAccrualRecalculation(
  jobId: string,
  tenantId: string,
  userId: string,
  startDate?: string,
  endDate?: string,
  employeeIds?: string[]
): Promise<void> {
  try {
    await updateJobProgress(jobId, 5, 'processing', 'Starting accrual recalculation');
    await writeJobLog(jobId, 'info', 'Fetching tenant and employee data');

    // Get employer size for calculation rules
    const employerSize = await getEmployerSize(tenantId);
    await writeJobLog(jobId, 'info', `Employer size: ${employerSize} (${employerSize === 'large' ? '>=50' : '<50'} employees)`);

    // Get employees to recalculate
    let employeesQuery = db.collection('users').where('tenantId', '==', tenantId);
    
    if (employeeIds && employeeIds.length > 0) {
      // Firestore 'in' operator supports up to 10 values
      if (employeeIds.length <= 10) {
        employeesQuery = employeesQuery.where(admin.firestore.FieldPath.documentId(), 'in', employeeIds);
      } else {
        await writeJobLog(jobId, 'warn', `Employee ID list truncated to first 10 for query optimization`);
        employeesQuery = employeesQuery.where(admin.firestore.FieldPath.documentId(), 'in', employeeIds.slice(0, 10));
      }
    }

    const employeesSnapshot = await employeesQuery.get();
    const employees = employeesSnapshot.docs;

    await updateJobProgress(jobId, 15, undefined, `Found ${employees.length} employees to recalculate`);
    await writeJobLog(jobId, 'info', `Processing ${employees.length} employees`);

    if (employees.length === 0) {
      throw new Error('No employees found for recalculation');
    }

    const totalEmployees = employees.length;
    let recalculatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each employee
    for (let i = 0; i < employees.length; i++) {
      const employeeDoc = employees[i];
      const employeeData = employeeDoc.data();
      const employeeId = employeeDoc.id;
      const progress = 15 + Math.floor((i / totalEmployees) * 70);

      try {
        await writeJobLog(jobId, 'info', `Recalculating for employee ${i + 1}/${totalEmployees}: ${employeeData.email}`);

        // Get work logs for date range
        let workLogsQuery = db
          .collection('workLogs')
          .where('userId', '==', employeeId)
          .where('tenantId', '==', tenantId);

        if (startDate) {
          workLogsQuery = workLogsQuery.where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
        }
        if (endDate) {
          workLogsQuery = workLogsQuery.where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
        }

        const workLogsSnapshot = await workLogsQuery.get();
        
        // Calculate total hours worked
        let totalHoursWorked = 0;
        workLogsSnapshot.forEach(doc => {
          const logData = doc.data();
          totalHoursWorked += logData.hoursWorked || 0;
        });

        // Calculate accrued hours
        const accruedHours = calculateAccrual(totalHoursWorked, employerSize);

        await writeJobLog(jobId, 'info', `Employee ${employeeData.email}: ${totalHoursWorked} hours worked, ${accruedHours} hours accrued`);

        // Get existing balance
        const balanceQuery = await db
          .collection('accrualBalances')
          .where('userId', '==', employeeId)
          .where('tenantId', '==', tenantId)
          .limit(1)
          .get();

        let balanceDoc;
        if (balanceQuery.empty) {
          // Create new balance record
          balanceDoc = await db.collection('accrualBalances').add({
            userId: employeeId,
            tenantId,
            availablePaidHours: accruedHours,
            yearlyAccrued: accruedHours,
            yearlyUsed: 0,
            carryoverFromPriorYear: 0,
            lastCalculated: admin.firestore.FieldValue.serverTimestamp(),
            recalculatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          // Update existing balance
          balanceDoc = balanceQuery.docs[0].ref;
          const currentBalance = balanceQuery.docs[0].data();
          const yearlyUsed = currentBalance.yearlyUsed || 0;
          
          await balanceDoc.update({
            yearlyAccrued: accruedHours,
            availablePaidHours: accruedHours - yearlyUsed,
            lastCalculated: admin.firestore.FieldValue.serverTimestamp(),
            recalculatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        recalculatedCount++;
        await updateJobProgress(jobId, progress, undefined, `Recalculated ${recalculatedCount}/${totalEmployees} employees`);
      } catch (error) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${employeeData.email}: ${errorMsg}`);
        await writeJobLog(jobId, 'error', `Failed to recalculate for ${employeeData.email}: ${errorMsg}`);
      }
    }

    // Complete the job
    const result = {
      totalProcessed: totalEmployees,
      successCount: recalculatedCount,
      errorCount,
      errors: errors.slice(0, 10),
      dateRange: {
        start: startDate || 'beginning',
        end: endDate || 'now',
      },
    };

    await markJobCompleted(jobId, result);
    await writeJobLog(jobId, 'info', `Accrual recalculation completed: ${recalculatedCount} successful, ${errorCount} failed`);

    // Send notification
    const message = errorCount > 0
      ? `Accrual recalculation completed with ${recalculatedCount} successful and ${errorCount} failed`
      : `Accrual recalculation completed successfully for ${recalculatedCount} employees`;
    
    await sendJobNotification(userId, tenantId, jobId, 'Accrual Recalculation', 'completed', message);

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'accrual_recalculation_completed',
      details: result,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await markJobFailed(jobId, errorMsg);
    await writeJobLog(jobId, 'error', `Accrual recalculation failed: ${errorMsg}`);
    await sendJobNotification(userId, tenantId, jobId, 'Accrual Recalculation', 'failed', `Recalculation failed: ${errorMsg}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, tenantId, userId, jobId, startDate, endDate, employeeIds } = req.body as AccrualRecalculationRequest;

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
      // Create job
      const newJobId = await createJob('accrual_recalculation', tenantId, userId, {
        startDate: startDate || null,
        endDate: endDate || null,
        employeeCount: employeeIds?.length || 'all',
      });

      // Start processing in the background (don't await)
      processAccrualRecalculation(newJobId, tenantId, userId, startDate, endDate, employeeIds).catch(err => {
        console.error('Background job error:', err);
      });

      return res.status(202).json({
        message: 'Accrual recalculation job started',
        jobId: newJobId,
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Accrual recalculation handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
