/**
 * ESTA 2025 Compliance API Routes
 * 
 * Provides REST endpoints for compliance management including:
 * - Retention status and metadata
 * - Audit log access
 * - Compliance reporting
 * - Annual certification
 * - Deletion request workflow
 * - Compliance alerts
 * 
 * @module compliance
 */

import { Router, Request, Response } from 'express';
import {
  createRetentionMetadata,
  canDeleteRecord,
  placeLegalHold,
  releaseLegalHold,
  createImmutableAuditEntry,
  createDeletionRequest,
  processDeletionApproval,
  createComplianceAlert,
  acknowledgeComplianceAlert,
  resolveComplianceAlert,
  createJustificationLog,
  RETENTION_PERIODS,
  validateUSDataResidency,
  verifyAES256Encryption,
} from '../services/complianceService.js';
import {
  generateRetentionAuditReport,
  createAnnualCertification,
  performComplianceGapAnalysis,
  ESTA_CERTIFICATION_REQUIREMENTS,
} from '../services/complianceReportingService.js';

export const complianceRouter = Router();

// ============================================================================
// Retention Endpoints
// ============================================================================

/**
 * Get retention periods configuration
 * GET /api/v1/compliance/retention/config
 */
complianceRouter.get('/retention/config', (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      retentionPeriods: RETENTION_PERIODS,
      message: 'ESTA 2025 retention periods configuration',
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve retention configuration',
    });
  }
});

/**
 * Create retention metadata for a record
 * POST /api/v1/compliance/retention/metadata
 */
complianceRouter.post('/retention/metadata', (req: Request, res: Response) => {
  try {
    const { recordType, recordId, tenantId, applicationStatus } = req.body;
    
    if (!recordType || !recordId || !tenantId) {
      res.status(400).json({
        success: false,
        error: 'recordType, recordId, and tenantId are required',
      });
      return;
    }
    
    const metadata = createRetentionMetadata({
      recordType,
      recordId,
      tenantId,
      applicationStatus,
    });
    
    res.status(201).json({
      success: true,
      metadata,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create retention metadata',
    });
  }
});

/**
 * Check if a record can be deleted
 * POST /api/v1/compliance/retention/check-delete
 */
complianceRouter.post('/retention/check-delete', (req: Request, res: Response) => {
  try {
    const { metadata } = req.body;
    
    if (!metadata) {
      res.status(400).json({
        success: false,
        error: 'Retention metadata is required',
      });
      return;
    }
    
    // Ensure dates are Date objects
    const metadataWithDates = {
      ...metadata,
      createdAt: new Date(metadata.createdAt),
      retentionEndDate: new Date(metadata.retentionEndDate),
    };
    
    const result = canDeleteRecord(metadataWithDates);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check deletion eligibility',
    });
  }
});

// ============================================================================
// Legal Hold Endpoints
// ============================================================================

/**
 * Place a legal hold on a record
 * POST /api/v1/compliance/legal-hold/place
 */
complianceRouter.post('/legal-hold/place', (req: Request, res: Response) => {
  try {
    const { metadata, holdId, reason, placedBy, expiresAt } = req.body;
    
    if (!metadata || !holdId || !reason || !placedBy) {
      res.status(400).json({
        success: false,
        error: 'metadata, holdId, reason, and placedBy are required',
      });
      return;
    }
    
    // Ensure dates are Date objects
    const metadataWithDates = {
      ...metadata,
      createdAt: new Date(metadata.createdAt),
      retentionEndDate: new Date(metadata.retentionEndDate),
    };
    
    const updated = placeLegalHold(metadataWithDates, {
      holdId,
      reason,
      placedBy,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    
    // Log the legal hold placement
    createImmutableAuditEntry({
      action: 'LEGAL_HOLD_PLACED',
      severity: 'WARNING',
      actor: { userId: placedBy, role: 'admin' },
      resource: { type: metadata.recordType, id: metadata.recordId, tenantId: metadata.tenantId },
      details: { description: `Legal hold placed: ${reason}` },
    });
    
    res.status(201).json({
      success: true,
      metadata: updated,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to place legal hold',
    });
  }
});

/**
 * Release a legal hold on a record
 * POST /api/v1/compliance/legal-hold/release
 */
complianceRouter.post('/legal-hold/release', (req: Request, res: Response) => {
  try {
    const { metadata, releasedBy } = req.body;
    
    if (!metadata || !releasedBy) {
      res.status(400).json({
        success: false,
        error: 'metadata and releasedBy are required',
      });
      return;
    }
    
    // Ensure dates are Date objects
    const metadataWithDates = {
      ...metadata,
      createdAt: new Date(metadata.createdAt),
      retentionEndDate: new Date(metadata.retentionEndDate),
    };
    
    const updated = releaseLegalHold(metadataWithDates);
    
    // Log the legal hold release
    createImmutableAuditEntry({
      action: 'LEGAL_HOLD_RELEASED',
      severity: 'INFO',
      actor: { userId: releasedBy, role: 'admin' },
      resource: { type: metadata.recordType, id: metadata.recordId, tenantId: metadata.tenantId },
      details: { description: 'Legal hold released' },
    });
    
    res.json({
      success: true,
      metadata: updated,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to release legal hold',
    });
  }
});

// ============================================================================
// Deletion Request Endpoints
// ============================================================================

/**
 * Create a deletion request
 * POST /api/v1/compliance/deletion/request
 */
complianceRouter.post('/deletion/request', (req: Request, res: Response) => {
  try {
    const { tenantId, recordType, recordId, requestedBy, reason, retentionMetadata, requiredApprovers } = req.body;
    
    if (!tenantId || !recordType || !recordId || !requestedBy || !reason || !retentionMetadata || !requiredApprovers) {
      res.status(400).json({
        success: false,
        error: 'All fields are required: tenantId, recordType, recordId, requestedBy, reason, retentionMetadata, requiredApprovers',
      });
      return;
    }
    
    // Ensure dates are Date objects
    const metadataWithDates = {
      ...retentionMetadata,
      createdAt: new Date(retentionMetadata.createdAt),
      retentionEndDate: new Date(retentionMetadata.retentionEndDate),
    };
    
    const request = createDeletionRequest({
      tenantId,
      recordType,
      recordId,
      requestedBy,
      reason,
      retentionMetadata: metadataWithDates,
      requiredApprovers,
    });
    
    res.status(201).json({
      success: true,
      deletionRequest: request,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create deletion request',
    });
  }
});

/**
 * Process deletion approval
 * POST /api/v1/compliance/deletion/approve
 */
complianceRouter.post('/deletion/approve', (req: Request, res: Response) => {
  try {
    const { deletionRequest, approverId, approved, notes } = req.body;
    
    if (!deletionRequest || !approverId || typeof approved !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'deletionRequest, approverId, and approved (boolean) are required',
      });
      return;
    }
    
    const updated = processDeletionApproval(deletionRequest, {
      approverId,
      approved,
      notes,
    });
    
    res.json({
      success: true,
      deletionRequest: updated,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process deletion approval',
    });
  }
});

// ============================================================================
// Compliance Reporting Endpoints
// ============================================================================

/**
 * Get ESTA certification requirements
 * GET /api/v1/compliance/certification/requirements
 */
complianceRouter.get('/certification/requirements', (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      requirements: ESTA_CERTIFICATION_REQUIREMENTS,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve certification requirements',
    });
  }
});

/**
 * Create annual certification
 * POST /api/v1/compliance/certification/create
 */
complianceRouter.post('/certification/create', (req: Request, res: Response) => {
  try {
    const { tenantId, certificationYear, preparedBy } = req.body;
    
    if (!tenantId || !certificationYear || !preparedBy) {
      res.status(400).json({
        success: false,
        error: 'tenantId, certificationYear, and preparedBy are required',
      });
      return;
    }
    
    const certification = createAnnualCertification({
      tenantId,
      certificationYear,
      preparedBy,
    });
    
    res.status(201).json({
      success: true,
      certification,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create annual certification',
    });
  }
});

/**
 * Generate retention audit report
 * POST /api/v1/compliance/reports/retention
 */
complianceRouter.post('/reports/retention', (req: Request, res: Response) => {
  try {
    const { tenantId, generatedBy, retentionRecords, startDate, endDate } = req.body;
    
    if (!tenantId || !generatedBy || !retentionRecords || !startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'All fields are required: tenantId, generatedBy, retentionRecords, startDate, endDate',
      });
      return;
    }
    
    // Convert date strings to Date objects and ensure retention record dates are correct
    const recordsWithDates = retentionRecords.map((r: Record<string, unknown>) => ({
      ...r,
      createdAt: new Date(r.createdAt as string),
      retentionEndDate: new Date(r.retentionEndDate as string),
      finalizedAt: r.finalizedAt ? new Date(r.finalizedAt as string) : undefined,
    }));
    
    const report = generateRetentionAuditReport({
      tenantId,
      generatedBy,
      retentionRecords: recordsWithDates,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
    
    res.status(201).json({
      success: true,
      report,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate retention audit report',
    });
  }
});

/**
 * Perform compliance gap analysis
 * POST /api/v1/compliance/gap-analysis
 */
complianceRouter.post('/gap-analysis', (req: Request, res: Response) => {
  try {
    const {
      tenantId,
      hasEncryption,
      hasAuditLogs,
      hasAccessControls,
      hasRetentionPolicy,
      hasBreachNotification,
      hasDataResidency,
      hasLegalHold,
      hasDeletionSafeguards,
    } = req.body;
    
    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: 'tenantId is required',
      });
      return;
    }
    
    const analysis = performComplianceGapAnalysis({
      tenantId,
      hasEncryption: hasEncryption ?? false,
      hasAuditLogs: hasAuditLogs ?? false,
      hasAccessControls: hasAccessControls ?? false,
      hasRetentionPolicy: hasRetentionPolicy ?? false,
      hasBreachNotification: hasBreachNotification ?? false,
      hasDataResidency: hasDataResidency ?? false,
      hasLegalHold: hasLegalHold ?? false,
      hasDeletionSafeguards: hasDeletionSafeguards ?? false,
    });
    
    res.json({
      success: true,
      analysis,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to perform gap analysis',
    });
  }
});

// ============================================================================
// Compliance Alert Endpoints
// ============================================================================

/**
 * Create a compliance alert
 * POST /api/v1/compliance/alerts/create
 */
complianceRouter.post('/alerts/create', (req: Request, res: Response) => {
  try {
    const { tenantId, alertType, severity, title, message, relatedRecordType, relatedRecordId } = req.body;
    
    if (!tenantId || !alertType || !severity || !title || !message) {
      res.status(400).json({
        success: false,
        error: 'tenantId, alertType, severity, title, and message are required',
      });
      return;
    }
    
    const alert = createComplianceAlert({
      tenantId,
      alertType,
      severity,
      title,
      message,
      relatedRecordType,
      relatedRecordId,
    });
    
    res.status(201).json({
      success: true,
      alert,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create compliance alert',
    });
  }
});

/**
 * Acknowledge a compliance alert
 * POST /api/v1/compliance/alerts/acknowledge
 */
complianceRouter.post('/alerts/acknowledge', (req: Request, res: Response) => {
  try {
    const { alert, acknowledgedBy } = req.body;
    
    if (!alert || !acknowledgedBy) {
      res.status(400).json({
        success: false,
        error: 'alert and acknowledgedBy are required',
      });
      return;
    }
    
    // Ensure date is correct
    const alertWithDates = {
      ...alert,
      createdAt: new Date(alert.createdAt),
    };
    
    const updated = acknowledgeComplianceAlert(alertWithDates, acknowledgedBy);
    
    res.json({
      success: true,
      alert: updated,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
    });
  }
});

/**
 * Resolve a compliance alert
 * POST /api/v1/compliance/alerts/resolve
 */
complianceRouter.post('/alerts/resolve', (req: Request, res: Response) => {
  try {
    const { alert, resolvedBy, resolution } = req.body;
    
    if (!alert || !resolvedBy || !resolution) {
      res.status(400).json({
        success: false,
        error: 'alert, resolvedBy, and resolution are required',
      });
      return;
    }
    
    // Ensure date is correct
    const alertWithDates = {
      ...alert,
      createdAt: new Date(alert.createdAt),
      acknowledgedAt: alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : undefined,
    };
    
    const updated = resolveComplianceAlert(alertWithDates, resolvedBy, resolution);
    
    res.json({
      success: true,
      alert: updated,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
    });
  }
});

// ============================================================================
// Justification Logging Endpoints
// ============================================================================

/**
 * Create a justification log
 * POST /api/v1/compliance/justification/create
 */
complianceRouter.post('/justification/create', (req: Request, res: Response) => {
  try {
    const { tenantId, decisionType, relatedRecordType, relatedRecordId, decision, justification, decidedBy, supportingDocuments } = req.body;
    
    if (!tenantId || !decisionType || !relatedRecordType || !relatedRecordId || !decision || !justification || !decidedBy) {
      res.status(400).json({
        success: false,
        error: 'All fields are required: tenantId, decisionType, relatedRecordType, relatedRecordId, decision, justification, decidedBy',
      });
      return;
    }
    
    const log = createJustificationLog({
      tenantId,
      decisionType,
      relatedRecordType,
      relatedRecordId,
      decision,
      justification,
      decidedBy,
      supportingDocuments,
    });
    
    res.status(201).json({
      success: true,
      justificationLog: log,
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create justification log',
    });
  }
});

// ============================================================================
// Data Residency & Security Validation Endpoints
// ============================================================================

/**
 * Validate US data residency for a storage location
 * POST /api/v1/compliance/validate/data-residency
 */
complianceRouter.post('/validate/data-residency', (req: Request, res: Response) => {
  try {
    const { storageLocation } = req.body;
    
    if (!storageLocation) {
      res.status(400).json({
        success: false,
        error: 'storageLocation is required',
      });
      return;
    }
    
    const isCompliant = validateUSDataResidency(storageLocation);
    
    res.json({
      success: true,
      storageLocation,
      isCompliant,
      message: isCompliant 
        ? 'Storage location is compliant with US data residency requirements'
        : 'Storage location is NOT compliant with US data residency requirements',
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate data residency',
    });
  }
});

/**
 * Verify AES-256 encryption algorithm
 * POST /api/v1/compliance/validate/encryption
 */
complianceRouter.post('/validate/encryption', (req: Request, res: Response) => {
  try {
    const { encryptionAlgorithm } = req.body;
    
    if (!encryptionAlgorithm) {
      res.status(400).json({
        success: false,
        error: 'encryptionAlgorithm is required',
      });
      return;
    }
    
    const isCompliant = verifyAES256Encryption(encryptionAlgorithm);
    
    res.json({
      success: true,
      encryptionAlgorithm,
      isCompliant,
      message: isCompliant 
        ? 'Encryption algorithm meets ESTA 2025 AES-256 requirements'
        : 'Encryption algorithm does NOT meet ESTA 2025 AES-256 requirements',
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate encryption algorithm',
    });
  }
});

/**
 * Get compliance status summary
 * GET /api/v1/compliance/status
 */
complianceRouter.get('/status', (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: {
        esta2025Version: '1.0.0',
        complianceLevel: 'FULL',
        features: {
          retentionEnforcement: true,
          aes256Encryption: true,
          immutableAuditLogs: true,
          accessLogging: true,
          usDataResidency: true,
          breachNotification: true,
          deletionSafeguards: true,
          legalHoldCapability: true,
          annualCertification: true,
          complianceReporting: true,
        },
        retentionPolicies: {
          approvedApplications: '7 years',
          deniedApplications: '5 years',
          withdrawnApplications: '3 years',
          auditLogs: '7 years (immutable)',
          paymentRecords: '7 years',
          communications: '5 years',
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve compliance status',
    });
  }
});
