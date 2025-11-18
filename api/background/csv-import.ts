/**
 * CSV Import Background Function
 * Handles bulk employee import from CSV files
 * Supports progress streaming and error handling
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

interface CSVImportRequest {
  tenantId: string;
  userId: string;
  csvData: string; // Base64 encoded CSV or URL to CSV file
  action: 'initiate' | 'status';
  jobId?: string;
}

interface EmployeeRow {
  firstName: string;
  lastName: string;
  email: string;
  hireDate: string;
  department?: string;
  role?: string;
}

/**
 * Parse CSV data into employee records
 */
function parseCSV(csvData: string): EmployeeRow[] {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const employees: EmployeeRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const employee: any = {};
    
    headers.forEach((header, index) => {
      employee[header] = values[index] || '';
    });
    
    if (employee.firstname && employee.lastname && employee.email) {
      employees.push({
        firstName: employee.firstname,
        lastName: employee.lastname,
        email: employee.email,
        hireDate: employee.hiredate || new Date().toISOString().split('T')[0],
        department: employee.department,
        role: employee.role || 'employee',
      });
    }
  }
  
  return employees;
}

/**
 * Process CSV import in the background
 */
async function processCSVImport(
  jobId: string,
  tenantId: string,
  userId: string,
  csvData: string
): Promise<void> {
  try {
    await updateJobProgress(jobId, 5, 'processing', 'Starting CSV import');
    await writeJobLog(jobId, 'info', 'Parsing CSV data');

    // Decode CSV if it's base64 encoded
    let decodedCSV = csvData;
    if (csvData.startsWith('data:') || csvData.match(/^[A-Za-z0-9+/=]+$/)) {
      try {
        decodedCSV = Buffer.from(csvData.replace(/^data:.*,/, ''), 'base64').toString('utf-8');
      } catch (e) {
        // If decoding fails, assume it's already plain text
        decodedCSV = csvData;
      }
    }

    const employees = parseCSV(decodedCSV);
    await updateJobProgress(jobId, 15, undefined, `Parsed ${employees.length} employees from CSV`);
    await writeJobLog(jobId, 'info', `Found ${employees.length} valid employee records`);

    if (employees.length === 0) {
      throw new Error('No valid employee records found in CSV');
    }

    const totalEmployees = employees.length;
    let importedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each employee
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const progress = 15 + Math.floor((i / totalEmployees) * 70);

      try {
        await writeJobLog(jobId, 'info', `Processing employee ${i + 1}/${totalEmployees}: ${employee.email}`);

        // Check if employee already exists
        const existingEmployee = await db
          .collection('users')
          .where('email', '==', employee.email)
          .where('tenantId', '==', tenantId)
          .limit(1)
          .get();

        if (!existingEmployee.empty) {
          await writeJobLog(jobId, 'warn', `Employee ${employee.email} already exists, skipping`);
          errorCount++;
          errors.push(`${employee.email}: Already exists`);
          continue;
        }

        // Create employee record
        await db.collection('users').add({
          email: employee.email,
          firstName: employee.firstName,
          lastName: employee.lastName,
          displayName: `${employee.firstName} ${employee.lastName}`,
          role: employee.role || 'employee',
          tenantId,
          employerId: tenantId,
          hireDate: admin.firestore.Timestamp.fromDate(new Date(employee.hireDate)),
          department: employee.department || 'General',
          status: 'pending', // Requires email verification
          emailVerified: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: userId,
          importedViaCSV: true,
        });

        // Initialize accrual balance
        await db.collection('accrualBalances').add({
          userId: employee.email, // Temporarily use email until user is created
          tenantId,
          availablePaidHours: 0,
          yearlyAccrued: 0,
          yearlyUsed: 0,
          carryoverFromPriorYear: 0,
          lastCalculated: admin.firestore.FieldValue.serverTimestamp(),
        });

        importedCount++;
        await updateJobProgress(jobId, progress, undefined, `Imported ${importedCount}/${totalEmployees} employees`);
      } catch (error) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${employee.email}: ${errorMsg}`);
        await writeJobLog(jobId, 'error', `Failed to import ${employee.email}: ${errorMsg}`);
      }
    }

    // Complete the job
    const result = {
      totalProcessed: totalEmployees,
      successCount: importedCount,
      errorCount,
      errors: errors.slice(0, 10), // Limit to first 10 errors
    };

    await markJobCompleted(jobId, result);
    await writeJobLog(jobId, 'info', `CSV import completed: ${importedCount} successful, ${errorCount} failed`);

    // Send notification
    const message = errorCount > 0
      ? `CSV import completed with ${importedCount} successful and ${errorCount} failed imports`
      : `CSV import completed successfully. ${importedCount} employees imported`;
    
    await sendJobNotification(userId, tenantId, jobId, 'CSV Import', 'completed', message);

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'csv_import_completed',
      details: result,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await markJobFailed(jobId, errorMsg);
    await writeJobLog(jobId, 'error', `CSV import failed: ${errorMsg}`);
    await sendJobNotification(userId, tenantId, jobId, 'CSV Import', 'failed', `Import failed: ${errorMsg}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, tenantId, userId, csvData, jobId } = req.body as CSVImportRequest;

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
      if (!csvData) {
        return res.status(400).json({ error: 'Missing csvData' });
      }

      // Create job
      const newJobId = await createJob('csv_import', tenantId, userId, {
        rowCount: csvData.split('\n').length - 1, // Approximate row count
      });

      // Start processing in the background (don't await)
      processCSVImport(newJobId, tenantId, userId, csvData).catch(err => {
        console.error('Background job error:', err);
      });

      return res.status(202).json({
        message: 'CSV import job started',
        jobId: newJobId,
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('CSV import handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
