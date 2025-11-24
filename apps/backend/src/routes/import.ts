import { Response, Router } from 'express';
import { getFirestore } from '../services/firebase';
import { authenticate, rateLimit } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const db = getFirestore();

interface CSVImportData {
  type: 'employees' | 'hours';
  data: Record<string, unknown>[];
  metadata: {
    fileName: string;
    totalRows: number;
    validRows: number;
    errors: number;
    warnings: number;
  };
}

/**
 * POST /api/v1/import/validate
 * Validate CSV data before import
 */
router.post('/validate', authenticate, rateLimit(10, 60000), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, data, metadata } = req.body as CSVImportData;
    const { tenantId } = req.user || {};

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID required' });
      return;
    }

    if (!type || !data || !Array.isArray(data)) {
      res.status(400).json({ error: 'Invalid import data' });
      return;
    }

    // Additional server-side validation
    const errors: string[] = [];
    const warnings: string[] = [];

    if (type === 'employees') {
      // Check for duplicate emails in existing data
      const emails = data.map((row) => (row as { email?: string }).email);
      const existingEmployees = await db
        .collection('users')
        .where('employerId', '==', tenantId)
        .where('email', 'in', emails.slice(0, 10)) // Firestore limit
        .get();

      existingEmployees.forEach((doc) => {
        const existingEmail = doc.data().email;
        warnings.push(`Employee ${existingEmail} already exists and will be updated`);
      });
    } else if (type === 'hours') {
      // Validate that all employees exist
      const employeeEmails = [...new Set(data.map((row) => (row as { employeeEmail?: string }).employeeEmail))];
      const existingEmployees = await db
        .collection('users')
        .where('employerId', '==', tenantId)
        .where('email', 'in', employeeEmails.slice(0, 10))
        .get();

      const existingEmails = new Set(
        existingEmployees.docs.map((doc) => doc.data().email)
      );

      employeeEmails.forEach((email) => {
        if (!existingEmails.has(email)) {
          errors.push(`Employee ${email} not found in system`);
        }
      });
    }

    res.json({
      valid: errors.length === 0,
      errors,
      warnings,
      metadata,
    });
  } catch (error) {
    console.error('Error validating import:', error);
    res.status(500).json({ error: 'Failed to validate import' });
      return;
  }
});

/**
 * POST /api/v1/import/employees
 * Import employee data
 */
router.post('/employees', authenticate, rateLimit(5, 60000), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, metadata } = req.body as CSVImportData;
    const { tenantId, uid: userId } = req.user || {};

    if (!tenantId || !userId) {
      res.status(400).json({ error: 'Authentication required' });
      return;
    }

    if (!data || !Array.isArray(data)) {
      res.status(400).json({ error: 'Invalid import data' });
      return;
    }

    const batch = db.batch();
    const imported: string[] = [];
    const updated: string[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const row of data) {
      try {
        const employeeData: Record<string, unknown> = {
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          hireDate: row.hireDate,
          department: row.department || null,
          employmentStatus: row.employmentStatus || 'active',
          hoursPerWeek: row.hoursPerWeek ? Number(row.hoursPerWeek) : 40,
          employerId: tenantId,
          role: 'employee',
          updatedAt: new Date(),
        };

        // Check if employee exists
        const existingEmployees = await db
          .collection('users')
          .where('email', '==', row.email)
          .where('employerId', '==', tenantId)
          .limit(1)
          .get();

        if (!existingEmployees.empty) {
          // Update existing employee
          const existingDoc = existingEmployees.docs[0];
          if (!existingDoc) {
            throw new Error(`Employee document not found for email: ${row.email as string}`);
          }
          batch.update(existingDoc.ref, employeeData);
          updated.push(row.email as string);
        } else {
          // Create new employee
          employeeData.createdAt = new Date();
          employeeData.status = 'pending'; // Pending email verification
          const newDocRef = db.collection('users').doc();
          batch.set(newDocRef, employeeData);
          imported.push(row.email as string);
        }
      } catch (error) {
        console.error(`Error processing employee ${row.email}:`, error);
        failed.push({
          email: row.email as string,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Commit batch
    await batch.commit();

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'csv_import_employees',
      details: {
        fileName: metadata.fileName,
        totalRows: metadata.totalRows,
        imported: imported.length,
        updated: updated.length,
        failed: failed.length,
      },
      timestamp: new Date(),
    });

    res.json({
      success: true,
      imported: imported.length,
      updated: updated.length,
      failed: failed.length,
      failedDetails: failed,
    });
  } catch (error) {
    console.error('Error importing employees:', error);
    res.status(500).json({ error: 'Failed to import employees' });
      return;
  }
});

/**
 * POST /api/v1/import/hours
 * Import hours data
 */
router.post('/hours', authenticate, rateLimit(10, 60000), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, metadata } = req.body as CSVImportData;
    const { tenantId, uid: userId } = req.user || {};

    if (!tenantId || !userId) {
      res.status(400).json({ error: 'Authentication required' });
      return;
    }

    if (!data || !Array.isArray(data)) {
      res.status(400).json({ error: 'Invalid import data' });
      return;
    }

    // Get employee mapping
    const employeeEmails = [...new Set(data.map((row) => (row as { employeeEmail?: string }).employeeEmail))];
    const employeeDocs = await db
      .collection('users')
      .where('employerId', '==', tenantId)
      .where('email', 'in', employeeEmails.slice(0, 10))
      .get();

    const employeeMap = new Map(
      employeeDocs.docs.map((doc) => [doc.data().email, doc.id])
    );

    const batch = db.batch();
    const imported: string[] = [];
    const failed: Array<{ email: string; date: string; error: string }> = [];

    for (const row of data) {
      try {
        const employeeId = employeeMap.get(row.employeeEmail as string);

        if (!employeeId) {
          failed.push({
            email: row.employeeEmail as string,
            date: row.date as string,
            error: 'Employee not found',
          });
          continue;
        }

        const hoursData = {
          employeeId,
          employerId: tenantId,
          date: row.date,
          hoursWorked: Number(row.hoursWorked),
          overtimeHours: row.overtimeHours ? Number(row.overtimeHours) : 0,
          notes: row.notes || null,
          createdAt: new Date(),
          createdBy: userId,
        };

        const newDocRef = db.collection('hoursLog').doc();
        batch.set(newDocRef, hoursData);
        imported.push(`${row.employeeEmail}-${row.date}`);
      } catch (error) {
        console.error(`Error processing hours for ${row.employeeEmail}:`, error);
        failed.push({
          email: row.employeeEmail as string,
          date: row.date as string,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Commit batch
    await batch.commit();

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'csv_import_hours',
      details: {
        fileName: metadata.fileName,
        totalRows: metadata.totalRows,
        imported: imported.length,
        failed: failed.length,
      },
      timestamp: new Date(),
    });

    res.json({
      success: true,
      imported: imported.length,
      failed: failed.length,
      failedDetails: failed,
    });
  } catch (error) {
    console.error('Error importing hours:', error);
    res.status(500).json({ error: 'Failed to import hours' });
      return;
  }
});

/**
 * GET /api/v1/import/history
 * Get import history for tenant
 */
router.get('/history', authenticate, rateLimit(50, 60000), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.user || {};
    const { limit = 50 } = req.query;

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID required' });
      return;
    }

    const importsSnapshot = await db
      .collection('auditLogs')
      .where('employerId', '==', tenantId)
      .where('action', 'in', ['csv_import_employees', 'csv_import_hours'])
      .orderBy('timestamp', 'desc')
      .limit(Number(limit))
      .get();

    const imports = importsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ imports });
      return;
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: 'Failed to fetch import history' });
      return;
  }
});

export default router;
