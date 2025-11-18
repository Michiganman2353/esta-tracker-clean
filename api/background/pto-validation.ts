/**
 * Multi-Day PTO Validation Background Function
 * Validates PTO requests against balances, schedules, and compliance rules
 * Handles complex validation logic with progress streaming
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

interface PTOValidationRequest {
  tenantId: string;
  userId: string;
  action: 'initiate' | 'status';
  jobId?: string;
  requestIds?: string[]; // Optional: validate specific requests
  startDate?: string; // Optional: validate requests in date range
  endDate?: string;
}

interface ValidationResult {
  requestId: string;
  valid: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Validate a single PTO request
 */
async function validatePTORequest(
  requestDoc: FirebaseFirestore.DocumentSnapshot,
  tenantId: string
): Promise<ValidationResult> {
  const requestData = requestDoc.data();
  const requestId = requestDoc.id;
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!requestData) {
    return {
      requestId,
      valid: false,
      issues: ['Request data not found'],
      warnings: [],
    };
  }

  try {
    const employeeId = requestData.userId || requestData.employeeId;
    const startDate = requestData.startDate?.toDate();
    const endDate = requestData.endDate?.toDate();
    const requestedHours = requestData.requestedHours || 8;

    // Validate dates
    if (!startDate || !endDate) {
      issues.push('Missing start or end date');
    } else if (startDate > endDate) {
      issues.push('Start date is after end date');
    }

    // Get employee's accrual balance
    const balanceQuery = await db
      .collection('accrualBalances')
      .where('userId', '==', employeeId)
      .where('tenantId', '==', tenantId)
      .limit(1)
      .get();

    if (balanceQuery.empty) {
      issues.push('Employee accrual balance not found');
    } else {
      const balanceData = balanceQuery.docs[0].data();
      const availableHours = balanceData.availablePaidHours || 0;

      // Check if employee has enough balance
      if (requestedHours > availableHours) {
        issues.push(`Insufficient balance: requested ${requestedHours} hours, available ${availableHours} hours`);
      } else if (requestedHours > availableHours * 0.8) {
        warnings.push(`Request uses ${Math.round((requestedHours / availableHours) * 100)}% of available balance`);
      }
    }

    // Check for overlapping requests
    if (startDate && endDate) {
      const overlappingQuery = await db
        .collection('sickTimeRequests')
        .where('userId', '==', employeeId)
        .where('tenantId', '==', tenantId)
        .where('status', 'in', ['pending', 'approved'])
        .get();

      overlappingQuery.forEach(doc => {
        if (doc.id === requestId) return; // Skip self

        const otherData = doc.data();
        const otherStart = otherData.startDate?.toDate();
        const otherEnd = otherData.endDate?.toDate();

        if (otherStart && otherEnd) {
          // Check for overlap
          if (
            (startDate >= otherStart && startDate <= otherEnd) ||
            (endDate >= otherStart && endDate <= otherEnd) ||
            (startDate <= otherStart && endDate >= otherEnd)
          ) {
            issues.push(`Overlaps with existing request ${doc.id}`);
          }
        }
      });
    }

    // Validate documentation requirements for multi-day requests
    if (startDate && endDate) {
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 3) {
        // Check for required documentation
        if (!requestData.hasDocuments && !requestData.documentIds?.length) {
          warnings.push('Multi-day request (3+ days) should have supporting documentation');
        }

        // Check reason is appropriate
        if (requestData.reason && !['illness', 'medical', 'injury', 'emergency'].includes(requestData.reason.toLowerCase())) {
          warnings.push('Multi-day request reason should be medical-related');
        }
      }
    }

    // Check advance notice compliance (Michigan ESTA requirements)
    if (startDate) {
      const now = new Date();
      const daysBefore = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysBefore < 0) {
        warnings.push('Request is for past date - retroactive approval required');
      } else if (daysBefore > 180) {
        warnings.push('Request is more than 6 months in advance');
      }
    }

    // Validate request status
    if (!requestData.status || !['pending', 'approved', 'denied', 'cancelled'].includes(requestData.status)) {
      issues.push('Invalid or missing request status');
    }

    // Validate employee exists and is active
    const employeeDoc = await db.collection('users').doc(employeeId).get();
    if (!employeeDoc.exists) {
      issues.push('Employee not found');
    } else {
      const employeeData = employeeDoc.data();
      if (employeeData?.status !== 'active') {
        warnings.push(`Employee status is ${employeeData?.status}`);
      }
      if (employeeData?.tenantId !== tenantId && employeeData?.employerId !== tenantId) {
        issues.push('Employee does not belong to this tenant');
      }
    }

  } catch (error) {
    issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    requestId,
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Process PTO validation in the background
 */
async function processPTOValidation(
  jobId: string,
  tenantId: string,
  userId: string,
  requestIds?: string[],
  startDate?: string,
  endDate?: string
): Promise<void> {
  try {
    await updateJobProgress(jobId, 5, 'processing', 'Starting PTO validation');
    await writeJobLog(jobId, 'info', 'Fetching PTO requests to validate');

    // Build query for requests to validate
    let requestsQuery = db
      .collection('sickTimeRequests')
      .where('tenantId', '==', tenantId);

    if (requestIds && requestIds.length > 0) {
      if (requestIds.length <= 10) {
        requestsQuery = requestsQuery.where(admin.firestore.FieldPath.documentId(), 'in', requestIds);
      } else {
        await writeJobLog(jobId, 'warn', 'Request ID list truncated to first 10 for query optimization');
        requestsQuery = requestsQuery.where(admin.firestore.FieldPath.documentId(), 'in', requestIds.slice(0, 10));
      }
    } else {
      // If no specific requests, validate pending requests in date range
      requestsQuery = requestsQuery.where('status', '==', 'pending');
      
      if (startDate) {
        requestsQuery = requestsQuery.where('startDate', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
      }
      if (endDate) {
        requestsQuery = requestsQuery.where('startDate', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
      }
    }

    const requestsSnapshot = await requestsQuery.get();
    const requests = requestsSnapshot.docs;

    await updateJobProgress(jobId, 15, undefined, `Found ${requests.length} requests to validate`);
    await writeJobLog(jobId, 'info', `Validating ${requests.length} PTO requests`);

    if (requests.length === 0) {
      await writeJobLog(jobId, 'info', 'No requests found to validate');
      await markJobCompleted(jobId, { totalProcessed: 0, validCount: 0, invalidCount: 0 });
      return;
    }

    const totalRequests = requests.length;
    let validatedCount = 0;
    let validCount = 0;
    let invalidCount = 0;
    const validationResults: ValidationResult[] = [];

    // Process each request
    for (let i = 0; i < requests.length; i++) {
      const requestDoc = requests[i];
      const progress = 15 + Math.floor((i / totalRequests) * 70);

      try {
        await writeJobLog(jobId, 'info', `Validating request ${i + 1}/${totalRequests}: ${requestDoc.id}`);

        const result = await validatePTORequest(requestDoc, tenantId);
        validationResults.push(result);

        if (result.valid) {
          validCount++;
          await writeJobLog(jobId, 'info', `Request ${requestDoc.id}: VALID ${result.warnings.length > 0 ? `(${result.warnings.length} warnings)` : ''}`);
        } else {
          invalidCount++;
          await writeJobLog(jobId, 'error', `Request ${requestDoc.id}: INVALID - ${result.issues.join('; ')}`);
        }

        // Update request with validation results
        await requestDoc.ref.update({
          validationStatus: result.valid ? 'valid' : 'invalid',
          validationIssues: result.issues,
          validationWarnings: result.warnings,
          lastValidated: admin.firestore.FieldValue.serverTimestamp(),
          validatedBy: userId,
        });

        validatedCount++;
        await updateJobProgress(jobId, progress, undefined, `Validated ${validatedCount}/${totalRequests} requests`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await writeJobLog(jobId, 'error', `Failed to validate request ${requestDoc.id}: ${errorMsg}`);
      }
    }

    // Complete the job
    const result = {
      totalProcessed: totalRequests,
      validatedCount,
      validCount,
      invalidCount,
      results: validationResults,
    };

    await markJobCompleted(jobId, result);
    await writeJobLog(jobId, 'info', `PTO validation completed: ${validCount} valid, ${invalidCount} invalid`);

    // Send notification
    const message = `PTO validation completed: ${validCount} valid, ${invalidCount} invalid out of ${totalRequests} requests`;
    await sendJobNotification(userId, tenantId, jobId, 'PTO Validation', 'completed', message);

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'pto_validation_completed',
      details: {
        totalProcessed: totalRequests,
        validCount,
        invalidCount,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await markJobFailed(jobId, errorMsg);
    await writeJobLog(jobId, 'error', `PTO validation failed: ${errorMsg}`);
    await sendJobNotification(userId, tenantId, jobId, 'PTO Validation', 'failed', `Validation failed: ${errorMsg}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, tenantId, userId, jobId, requestIds, startDate, endDate } = req.body as PTOValidationRequest;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Missing tenantId or userId' });
    }

    // Verify user permission
    const hasPermission = await verifyUserPermission(userId, tenantId, 'manager');
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
      const newJobId = await createJob('pto_validation', tenantId, userId, {
        requestCount: requestIds?.length || 'all',
        dateRange: { start: startDate || null, end: endDate || null },
      });

      // Start processing in the background (don't await)
      processPTOValidation(newJobId, tenantId, userId, requestIds, startDate, endDate).catch(err => {
        console.error('Background job error:', err);
      });

      return res.status(202).json({
        message: 'PTO validation job started',
        jobId: newJobId,
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('PTO validation handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
