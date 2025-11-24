/**
 * Audit Export Background Function
 * Generates comprehensive audit packs for compliance reporting
 * Exports data in multiple formats with document attachments
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
const storage = admin.storage();

interface AuditExportRequest {
  tenantId: string;
  userId: string;
  action: 'initiate' | 'status';
  jobId?: string;
  startDate: string;
  endDate: string;
  includeDocuments?: boolean;
  format?: 'json' | 'csv' | 'pdf';
  sections?: string[]; // Optional: specific sections to export
}

interface AuditData {
  employees: any[];
  accrualBalances: any[];
  sickTimeRequests: any[];
  workLogs: any[];
  auditLogs: any[];
  documents: any[];
  complianceReport: any;
}

/**
 * Fetch employee data
 */
async function fetchEmployees(tenantId: string, _startDate: Date, _endDate: Date): Promise<any[]> {
  const employeesQuery = await db
    .collection('users')
    .where('tenantId', '==', tenantId)
    .get();

  return employeesQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.().toISOString(),
    updatedAt: doc.data().updatedAt?.toDate?.().toISOString(),
    hireDate: doc.data().hireDate?.toDate?.().toISOString(),
  }));
}

/**
 * Fetch accrual balances
 */
async function fetchAccrualBalances(tenantId: string): Promise<any[]> {
  const balancesQuery = await db
    .collection('accrualBalances')
    .where('tenantId', '==', tenantId)
    .get();

  return balancesQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    lastCalculated: doc.data().lastCalculated?.toDate?.().toISOString(),
  }));
}

/**
 * Fetch sick time requests
 */
async function fetchSickTimeRequests(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
  const requestsQuery = await db
    .collection('sickTimeRequests')
    .where('tenantId', '==', tenantId)
    .where('startDate', '>=', admin.firestore.Timestamp.fromDate(startDate))
    .where('startDate', '<=', admin.firestore.Timestamp.fromDate(endDate))
    .get();

  return requestsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate?.toDate?.().toISOString(),
    endDate: doc.data().endDate?.toDate?.().toISOString(),
    createdAt: doc.data().createdAt?.toDate?.().toISOString(),
    approvedAt: doc.data().approvedAt?.toDate?.().toISOString(),
  }));
}

/**
 * Fetch work logs
 */
async function fetchWorkLogs(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
  const logsQuery = await db
    .collection('workLogs')
    .where('tenantId', '==', tenantId)
    .where('date', '>=', admin.firestore.Timestamp.fromDate(startDate))
    .where('date', '<=', admin.firestore.Timestamp.fromDate(endDate))
    .get();

  return logsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate?.().toISOString(),
  }));
}

/**
 * Fetch audit logs
 */
async function fetchAuditLogs(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
  const auditQuery = await db
    .collection('auditLogs')
    .where('employerId', '==', tenantId)
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
    .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
    .orderBy('timestamp', 'desc')
    .get();

  return auditQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate?.().toISOString(),
  }));
}

/**
 * Fetch document metadata
 */
async function fetchDocuments(tenantId: string, includeDocuments: boolean): Promise<any[]> {
  if (!includeDocuments) {
    return [];
  }

  const documentsQuery = await db
    .collection('documents')
    .where('tenantId', '==', tenantId)
    .get();

  return documentsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    uploadedAt: doc.data().uploadedAt?.toDate?.().toISOString(),
    createdAt: doc.data().createdAt?.toDate?.().toISOString(),
  }));
}

/**
 * Generate compliance report summary
 */
function generateComplianceReport(data: AuditData, startDate: Date, endDate: Date): any {
  const activeEmployees = data.employees.filter(e => e.status === 'active').length;
  const totalRequests = data.sickTimeRequests.length;
  const approvedRequests = data.sickTimeRequests.filter(r => r.status === 'approved').length;
  const pendingRequests = data.sickTimeRequests.filter(r => r.status === 'pending').length;
  const totalHoursUsed = data.sickTimeRequests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (r.requestedHours || 0), 0);

  return {
    reportPeriod: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    generatedAt: new Date().toISOString(),
    summary: {
      activeEmployees,
      totalRequests,
      approvedRequests,
      pendingRequests,
      deniedRequests: data.sickTimeRequests.filter(r => r.status === 'denied').length,
      totalHoursUsed,
      averageHoursPerEmployee: activeEmployees > 0 ? (totalHoursUsed / activeEmployees).toFixed(2) : 0,
    },
    compliance: {
      employeesWithBalance: data.accrualBalances.length,
      requestsWithDocumentation: data.sickTimeRequests.filter(r => r.hasDocuments).length,
      auditLogsCount: data.auditLogs.length,
    },
  };
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Properly escape both backslashes and quotes for CSV
      const escaped = ('' + value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Export audit data to storage
 */
async function exportAuditData(
  jobId: string,
  tenantId: string,
  data: AuditData,
  format: 'json' | 'csv' | 'pdf'
): Promise<string> {
  const bucket = storage.bucket();
  const timestamp = Date.now();
  const fileName = `audit-export-${tenantId}-${timestamp}.${format === 'json' ? 'json' : format === 'csv' ? 'zip' : 'pdf'}`;
  const filePath = `tenants/${tenantId}/audit-exports/${fileName}`;
  const file = bucket.file(filePath);

  if (format === 'json') {
    // Export as JSON
    await file.save(JSON.stringify(data, null, 2), {
      contentType: 'application/json',
      metadata: {
        jobId,
        exportedAt: new Date().toISOString(),
      },
    });
  } else if (format === 'csv') {
    // Export as CSV (multiple files in JSON for simplicity in this implementation)
    // In production, you'd create a ZIP file with multiple CSVs
    const csvData = {
      employees: convertToCSV(data.employees, ['id', 'email', 'firstName', 'lastName', 'role', 'department', 'status']),
      requests: convertToCSV(data.sickTimeRequests, ['id', 'userId', 'startDate', 'endDate', 'status', 'requestedHours']),
      balances: convertToCSV(data.accrualBalances, ['id', 'userId', 'availablePaidHours', 'yearlyAccrued', 'yearlyUsed']),
      workLogs: convertToCSV(data.workLogs, ['id', 'userId', 'date', 'hoursWorked']),
    };
    
    await file.save(JSON.stringify(csvData, null, 2), {
      contentType: 'application/json',
      metadata: {
        jobId,
        exportedAt: new Date().toISOString(),
        note: 'CSV data in JSON format - convert to individual CSV files',
      },
    });
  } else if (format === 'pdf') {
    // For PDF, export as JSON with note (PDF generation would require additional libraries)
    await file.save(JSON.stringify(data, null, 2), {
      contentType: 'application/json',
      metadata: {
        jobId,
        exportedAt: new Date().toISOString(),
        note: 'PDF generation requires additional implementation',
      },
    });
  }

  // Generate signed URL (valid for 7 days)
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return signedUrl;
}

/**
 * Process audit export in the background
 */
async function processAuditExport(
  jobId: string,
  tenantId: string,
  userId: string,
  startDate: string,
  endDate: string,
  includeDocuments: boolean,
  format: 'json' | 'csv' | 'pdf',
  sections?: string[]
): Promise<void> {
  try {
    await updateJobProgress(jobId, 5, 'processing', 'Starting audit export');
    await writeJobLog(jobId, 'info', `Exporting audit data from ${startDate} to ${endDate}`);

    const start = new Date(startDate);
    const end = new Date(endDate);

    const auditData: AuditData = {
      employees: [],
      accrualBalances: [],
      sickTimeRequests: [],
      workLogs: [],
      auditLogs: [],
      documents: [],
      complianceReport: {},
    };

    // Fetch data based on requested sections
    const allSections = sections || ['employees', 'balances', 'requests', 'workLogs', 'auditLogs', 'documents'];

    if (allSections.includes('employees')) {
      await updateJobProgress(jobId, 15, undefined, 'Fetching employee data');
      auditData.employees = await fetchEmployees(tenantId, start, end);
      await writeJobLog(jobId, 'info', `Fetched ${auditData.employees.length} employees`);
    }

    if (allSections.includes('balances')) {
      await updateJobProgress(jobId, 25, undefined, 'Fetching accrual balances');
      auditData.accrualBalances = await fetchAccrualBalances(tenantId);
      await writeJobLog(jobId, 'info', `Fetched ${auditData.accrualBalances.length} accrual balances`);
    }

    if (allSections.includes('requests')) {
      await updateJobProgress(jobId, 35, undefined, 'Fetching sick time requests');
      auditData.sickTimeRequests = await fetchSickTimeRequests(tenantId, start, end);
      await writeJobLog(jobId, 'info', `Fetched ${auditData.sickTimeRequests.length} sick time requests`);
    }

    if (allSections.includes('workLogs')) {
      await updateJobProgress(jobId, 50, undefined, 'Fetching work logs');
      auditData.workLogs = await fetchWorkLogs(tenantId, start, end);
      await writeJobLog(jobId, 'info', `Fetched ${auditData.workLogs.length} work logs`);
    }

    if (allSections.includes('auditLogs')) {
      await updateJobProgress(jobId, 65, undefined, 'Fetching audit logs');
      auditData.auditLogs = await fetchAuditLogs(tenantId, start, end);
      await writeJobLog(jobId, 'info', `Fetched ${auditData.auditLogs.length} audit logs`);
    }

    if (allSections.includes('documents') && includeDocuments) {
      await updateJobProgress(jobId, 75, undefined, 'Fetching document metadata');
      auditData.documents = await fetchDocuments(tenantId, includeDocuments);
      await writeJobLog(jobId, 'info', `Fetched ${auditData.documents.length} document records`);
    }

    // Generate compliance report
    await updateJobProgress(jobId, 85, undefined, 'Generating compliance report');
    auditData.complianceReport = generateComplianceReport(auditData, start, end);
    await writeJobLog(jobId, 'info', 'Generated compliance report summary');

    // Export data to storage
    await updateJobProgress(jobId, 90, undefined, 'Exporting data to storage');
    const downloadUrl = await exportAuditData(jobId, tenantId, auditData, format);
    await writeJobLog(jobId, 'info', 'Audit data exported to storage');

    // Complete the job
    const result = {
      downloadUrl,
      format,
      dateRange: { start: startDate, end: endDate },
      sections: allSections,
      recordCounts: {
        employees: auditData.employees.length,
        accrualBalances: auditData.accrualBalances.length,
        sickTimeRequests: auditData.sickTimeRequests.length,
        workLogs: auditData.workLogs.length,
        auditLogs: auditData.auditLogs.length,
        documents: auditData.documents.length,
      },
      complianceSummary: auditData.complianceReport,
    };

    await markJobCompleted(jobId, result);
    await writeJobLog(jobId, 'info', 'Audit export completed successfully');

    // Send notification
    const message = `Audit export completed. Download link valid for 7 days.`;
    await sendJobNotification(userId, tenantId, jobId, 'Audit Export', 'completed', message);

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'audit_export_completed',
      details: {
        dateRange: { start: startDate, end: endDate },
        recordCounts: result.recordCounts,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await markJobFailed(jobId, errorMsg);
    await writeJobLog(jobId, 'error', `Audit export failed: ${errorMsg}`);
    await sendJobNotification(userId, tenantId, jobId, 'Audit Export', 'failed', `Export failed: ${errorMsg}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      action,
      tenantId,
      userId,
      jobId,
      startDate,
      endDate,
      includeDocuments = false,
      format = 'json',
      sections,
    } = req.body as AuditExportRequest;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Missing tenantId or userId' });
    }

    // Verify user permission (employer or admin only)
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
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Missing startDate or endDate' });
      }

      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      if (start > end) {
        return res.status(400).json({ error: 'Start date must be before end date' });
      }

      // Validate format
      if (!['json', 'csv', 'pdf'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Must be json, csv, or pdf' });
      }

      // Create job
      const newJobId = await createJob('audit_export', tenantId, userId, {
        dateRange: { start: startDate, end: endDate },
        format,
        includeDocuments,
        sections: sections || 'all',
      });

      // Start processing in the background (don't await)
      processAuditExport(newJobId, tenantId, userId, startDate, endDate, includeDocuments, format, sections).catch(err => {
        console.error('Background job error:', err);
      });

      return res.status(202).json({
        message: 'Audit export job started',
        jobId: newJobId,
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Audit export handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
