/**
 * Tests for ESTA 2025 Compliance Service
 */

import { describe, it, expect } from 'vitest';
import {
  RETENTION_PERIODS,
  getRetentionPeriodForStatus,
  getRetentionPeriodForRecordType,
  createRetentionMetadata,
  updateRetentionForStatusChange,
  canDeleteRecord,
  placeLegalHold,
  releaseLegalHold,
  createImmutableAuditEntry,
  verifyAuditEntryIntegrity,
  verifyAuditChainIntegrity,
  createAccessLogEntry,
  createDeletionRequest,
  processDeletionApproval,
  createComplianceAlert,
  acknowledgeComplianceAlert,
  resolveComplianceAlert,
  createJustificationLog,
  createPolicyVersion,
  activatePolicyVersion,
  validateUSDataResidency,
  getUSCompliantStorageLocation,
  verifyAES256Encryption,
} from '../complianceService.js';

describe('ESTA 2025 Compliance Service', () => {
  // =========================================================================
  // Retention Period Tests
  // =========================================================================
  describe('Retention Periods', () => {
    it('should return correct retention period for approved status', () => {
      expect(getRetentionPeriodForStatus('approved')).toBe(7);
    });

    it('should return correct retention period for denied status', () => {
      expect(getRetentionPeriodForStatus('denied')).toBe(5);
    });

    it('should return correct retention period for withdrawn status', () => {
      expect(getRetentionPeriodForStatus('withdrawn')).toBe(3);
    });

    it('should return correct retention period for cancelled status', () => {
      expect(getRetentionPeriodForStatus('cancelled')).toBe(3);
    });

    it('should return default retention for pending status', () => {
      expect(getRetentionPeriodForStatus('pending')).toBe(7);
    });

    it('should return correct retention period for record types', () => {
      expect(getRetentionPeriodForRecordType('audit_log')).toBe(7);
      expect(getRetentionPeriodForRecordType('communication')).toBe(5);
      expect(getRetentionPeriodForRecordType('policy_version')).toBe(10);
      expect(getRetentionPeriodForRecordType('government_request')).toBe(10);
    });

    it('should have retention period constants defined', () => {
      expect(RETENTION_PERIODS.APPROVED).toBe(7);
      expect(RETENTION_PERIODS.DENIED).toBe(5);
      expect(RETENTION_PERIODS.WITHDRAWN).toBe(3);
      expect(RETENTION_PERIODS.AUDIT_LOG).toBe(7);
      expect(RETENTION_PERIODS.POLICY_VERSION).toBe(10);
    });
  });

  // =========================================================================
  // Retention Metadata Tests
  // =========================================================================
  describe('Retention Metadata', () => {
    it('should create retention metadata with correct fields', () => {
      const metadata = createRetentionMetadata({
        recordType: 'sick_time_request',
        recordId: 'request-123',
        tenantId: 'tenant-456',
        applicationStatus: 'approved',
      });

      expect(metadata.id).toBeDefined();
      expect(metadata.recordType).toBe('sick_time_request');
      expect(metadata.recordId).toBe('request-123');
      expect(metadata.tenantId).toBe('tenant-456');
      expect(metadata.applicationStatus).toBe('approved');
      expect(metadata.retentionYears).toBe(7);
      expect(metadata.isLocked).toBe(true);
      expect(metadata.hasLegalHold).toBe(false);
    });

    it('should calculate correct retention end date', () => {
      const now = new Date();
      const metadata = createRetentionMetadata({
        recordType: 'audit_log',
        recordId: 'audit-123',
        tenantId: 'tenant-456',
        createdAt: now,
      });

      const expectedEndDate = new Date(now);
      expectedEndDate.setFullYear(expectedEndDate.getFullYear() + 7);
      
      expect(metadata.retentionEndDate.getFullYear()).toBe(expectedEndDate.getFullYear());
    });

    it('should update retention when status changes', () => {
      const metadata = createRetentionMetadata({
        recordType: 'sick_time_request',
        recordId: 'request-123',
        tenantId: 'tenant-456',
        applicationStatus: 'pending',
      });

      const updated = updateRetentionForStatusChange(metadata, 'denied');
      
      expect(updated.applicationStatus).toBe('denied');
      expect(updated.retentionYears).toBe(5);
      expect(updated.finalizedAt).toBeDefined();
    });
  });

  // =========================================================================
  // Deletion Safeguards Tests
  // =========================================================================
  describe('Deletion Safeguards', () => {
    it('should block deletion when within retention period', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);

      const metadata = createRetentionMetadata({
        recordType: 'sick_time_request',
        recordId: 'request-123',
        tenantId: 'tenant-456',
        applicationStatus: 'approved',
      });

      const result = canDeleteRecord(metadata);
      
      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain('retained until');
    });

    it('should block deletion when legal hold is active', () => {
      const metadata = createRetentionMetadata({
        recordType: 'sick_time_request',
        recordId: 'request-123',
        tenantId: 'tenant-456',
      });

      const withHold = placeLegalHold(metadata, {
        holdId: 'hold-123',
        reason: 'Pending litigation',
        placedBy: 'legal-team',
      });

      const result = canDeleteRecord(withHold);
      
      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Record has an active legal hold');
    });

    it('should allow deletion after retention period without holds', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 10);

      const metadata = createRetentionMetadata({
        recordType: 'sick_time_request',
        recordId: 'request-123',
        tenantId: 'tenant-456',
        createdAt: pastDate,
      });

      // Manually set retention end to past
      const expiredMetadata = {
        ...metadata,
        retentionEndDate: new Date('2020-01-01'),
        isLocked: false,
      };

      const result = canDeleteRecord(expiredMetadata);
      
      expect(result.canDelete).toBe(true);
    });

    it('should handle legal hold placement and release', () => {
      const metadata = createRetentionMetadata({
        recordType: 'document',
        recordId: 'doc-123',
        tenantId: 'tenant-456',
      });

      const withHold = placeLegalHold(metadata, {
        holdId: 'hold-456',
        reason: 'Court order',
        placedBy: 'admin',
      });

      expect(withHold.hasLegalHold).toBe(true);
      expect(withHold.legalHoldDetails?.holdId).toBe('hold-456');

      const released = releaseLegalHold(withHold);
      
      expect(released.hasLegalHold).toBe(false);
      expect(released.legalHoldDetails).toBeUndefined();
    });
  });

  // =========================================================================
  // Immutable Audit Log Tests
  // =========================================================================
  describe('Immutable Audit Logging', () => {
    it('should create immutable audit entry with integrity hash', () => {
      const entry = createImmutableAuditEntry({
        action: 'CREATE',
        severity: 'INFO',
        actor: {
          userId: 'user-123',
          email: 'user@example.com',
          role: 'employer',
        },
        resource: {
          type: 'sick_time_request',
          id: 'request-123',
          tenantId: 'tenant-456',
        },
        details: {
          description: 'Created sick time request',
        },
      });

      expect(entry.id).toBeDefined();
      expect(entry.integrityHash).toBeDefined();
      expect(entry.integrityHash.length).toBe(64); // SHA-256 hex
      expect(entry.isVerified).toBe(true);
      expect(entry.dataResidency).toBe('US');
    });

    it('should verify audit entry integrity', () => {
      const entry = createImmutableAuditEntry({
        action: 'UPDATE',
        severity: 'INFO',
        actor: {
          userId: 'user-123',
          role: 'admin',
        },
        resource: {
          type: 'employee_profile',
          id: 'emp-123',
          tenantId: 'tenant-456',
        },
        details: {
          description: 'Updated employee profile',
          previousValue: { name: 'Old Name' },
          newValue: { name: 'New Name' },
        },
      });

      expect(verifyAuditEntryIntegrity(entry)).toBe(true);
    });

    it('should detect tampered audit entry', () => {
      const entry = createImmutableAuditEntry({
        action: 'DELETE',
        severity: 'WARNING',
        actor: {
          userId: 'user-123',
          role: 'admin',
        },
        resource: {
          type: 'document',
          id: 'doc-123',
          tenantId: 'tenant-456',
        },
        details: {
          description: 'Deleted document',
        },
      });

      // Tamper with the entry
      const tamperedEntry = {
        ...entry,
        details: {
          ...entry.details,
          description: 'Modified description',
        },
      };

      expect(verifyAuditEntryIntegrity(tamperedEntry)).toBe(false);
    });

    it('should maintain chain integrity', () => {
      const entry1 = createImmutableAuditEntry({
        action: 'CREATE',
        severity: 'INFO',
        actor: { userId: 'user-1', role: 'admin' },
        resource: { type: 'document', id: 'doc-1', tenantId: 'tenant-1' },
        details: { description: 'First entry' },
      });

      const entry2 = createImmutableAuditEntry({
        action: 'UPDATE',
        severity: 'INFO',
        actor: { userId: 'user-1', role: 'admin' },
        resource: { type: 'document', id: 'doc-1', tenantId: 'tenant-1' },
        details: { description: 'Second entry' },
      });

      const entry3 = createImmutableAuditEntry({
        action: 'READ',
        severity: 'INFO',
        actor: { userId: 'user-2', role: 'employee' },
        resource: { type: 'document', id: 'doc-1', tenantId: 'tenant-1' },
        details: { description: 'Third entry' },
      });

      const result = verifyAuditChainIntegrity([entry1, entry2, entry3]);
      
      expect(result.isValid).toBe(true);
    });
  });

  // =========================================================================
  // Access Logging Tests
  // =========================================================================
  describe('Access Logging', () => {
    it('should create access log entry with correct fields', () => {
      const entry = createAccessLogEntry({
        userId: 'user-123',
        userEmail: 'user@example.com',
        userRole: 'employer',
        tenantId: 'tenant-456',
        resourceType: 'sick_time_request',
        resourceId: 'request-123',
        accessType: 'READ',
        ipAddress: '192.168.1.1',
        success: true,
      });

      expect(entry.id).toBeDefined();
      expect(entry.userId).toBe('user-123');
      expect(entry.accessType).toBe('READ');
      expect(entry.success).toBe(true);
      expect(entry.dataResidency).toBe('US');
    });

    it('should log failed access attempts', () => {
      const entry = createAccessLogEntry({
        userId: 'user-123',
        userRole: 'employee',
        tenantId: 'tenant-456',
        resourceType: 'employer_profile',
        resourceId: 'emp-123',
        accessType: 'WRITE',
        success: false,
        failureReason: 'Insufficient permissions',
      });

      expect(entry.success).toBe(false);
      expect(entry.failureReason).toBe('Insufficient permissions');
    });
  });

  // =========================================================================
  // Deletion Request Tests
  // =========================================================================
  describe('Deletion Request Workflow', () => {
    it('should create deletion request with approval workflow', () => {
      const metadata = createRetentionMetadata({
        recordType: 'document',
        recordId: 'doc-123',
        tenantId: 'tenant-456',
      });

      const request = createDeletionRequest({
        tenantId: 'tenant-456',
        recordType: 'document',
        recordId: 'doc-123',
        requestedBy: 'user-123',
        reason: 'Test deletion',
        retentionMetadata: metadata,
        requiredApprovers: ['admin-1', 'admin-2'],
      });

      expect(request.id).toBeDefined();
      expect(request.status).toBe('DENIED'); // Within retention
      expect(request.retentionCheck.canBeDeleted).toBe(false);
      expect(request.approvalWorkflow.requiredApprovers).toHaveLength(2);
    });

    it('should process approval workflow', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 10);

      const metadata = {
        ...createRetentionMetadata({
          recordType: 'document',
          recordId: 'doc-123',
          tenantId: 'tenant-456',
          createdAt: pastDate,
        }),
        retentionEndDate: new Date('2020-01-01'),
        isLocked: false,
        hasLegalHold: false,
      };

      const request = createDeletionRequest({
        tenantId: 'tenant-456',
        recordType: 'document',
        recordId: 'doc-123',
        requestedBy: 'user-123',
        reason: 'Cleanup old records',
        retentionMetadata: metadata,
        requiredApprovers: ['admin-1'],
      });

      const approved = processDeletionApproval(request, {
        approverId: 'admin-1',
        approved: true,
        notes: 'Approved for deletion',
      });

      expect(approved.status).toBe('APPROVED');
      expect(approved.approvalWorkflow.allApproved).toBe(true);
    });
  });

  // =========================================================================
  // Compliance Alert Tests
  // =========================================================================
  describe('Compliance Alerts', () => {
    it('should create compliance alert', () => {
      const alert = createComplianceAlert({
        tenantId: 'tenant-456',
        alertType: 'RETENTION_EXPIRING',
        severity: 'WARNING',
        title: 'Records expiring soon',
        message: '50 records will expire in 30 days',
      });

      expect(alert.id).toBeDefined();
      expect(alert.isActive).toBe(true);
      expect(alert.alertType).toBe('RETENTION_EXPIRING');
    });

    it('should acknowledge and resolve alerts', () => {
      const alert = createComplianceAlert({
        tenantId: 'tenant-456',
        alertType: 'COMPLIANCE_DUE',
        severity: 'INFO',
        title: 'Annual certification due',
        message: 'Complete certification by end of month',
      });

      const acknowledged = acknowledgeComplianceAlert(alert, 'admin-123');
      
      expect(acknowledged.acknowledgedAt).toBeDefined();
      expect(acknowledged.acknowledgedBy).toBe('admin-123');
      expect(acknowledged.isActive).toBe(true);

      const resolved = resolveComplianceAlert(acknowledged, 'admin-123', 'Certification completed');
      
      expect(resolved.resolvedAt).toBeDefined();
      expect(resolved.resolution).toBe('Certification completed');
      expect(resolved.isActive).toBe(false);
    });
  });

  // =========================================================================
  // Justification Logging Tests
  // =========================================================================
  describe('Justification Logging', () => {
    it('should create justification log', () => {
      const log = createJustificationLog({
        tenantId: 'tenant-456',
        decisionType: 'REQUEST_DENIAL',
        relatedRecordType: 'sick_time_request',
        relatedRecordId: 'request-123',
        decision: 'Denied',
        justification: 'Insufficient documentation provided. Employee did not submit required medical certification.',
        decidedBy: 'manager-123',
        supportingDocuments: ['policy-doc-1'],
      });

      expect(log.id).toBeDefined();
      expect(log.decisionType).toBe('REQUEST_DENIAL');
      expect(log.justification.length).toBeGreaterThan(10);
      expect(log.isAppealed).toBe(false);
    });
  });

  // =========================================================================
  // Policy Version Tests
  // =========================================================================
  describe('Policy Versioning', () => {
    it('should create policy version', () => {
      const version = createPolicyVersion({
        policyType: 'RETENTION',
        versionNumber: '2.0.0',
        effectiveDate: new Date('2025-02-21'),
        rules: {
          approvedRetention: 7,
          deniedRetention: 5,
        },
        changes: [
          {
            field: 'approvedRetention',
            previousValue: 5,
            newValue: 7,
            reason: 'Updated per ESTA 2025 requirements',
          },
        ],
        approvedBy: 'admin-123',
      });

      expect(version.id).toBeDefined();
      expect(version.isActive).toBe(false);
      expect(version.versionNumber).toBe('2.0.0');
    });

    it('should activate policy version', () => {
      const version = createPolicyVersion({
        policyType: 'ACCRUAL',
        versionNumber: '1.0.0',
        effectiveDate: new Date(),
        rules: { rate: 1 / 30 },
        changes: [],
        approvedBy: 'admin-123',
      });

      const activated = activatePolicyVersion(version);
      
      expect(activated.isActive).toBe(true);
    });
  });

  // =========================================================================
  // Data Residency Tests
  // =========================================================================
  describe('Data Residency Validation', () => {
    it('should validate US data residency', () => {
      expect(validateUSDataResidency('us-central1')).toBe(true);
      expect(validateUSDataResidency('us-east1')).toBe(true);
      expect(validateUSDataResidency('us-west2')).toBe(true);
      expect(validateUSDataResidency('europe-west1')).toBe(false);
      expect(validateUSDataResidency('asia-east1')).toBe(false);
    });

    it('should return US-compliant storage location', () => {
      const location = getUSCompliantStorageLocation();
      expect(validateUSDataResidency(location)).toBe(true);
    });
  });

  // =========================================================================
  // Encryption Verification Tests
  // =========================================================================
  describe('Encryption Verification', () => {
    it('should verify AES-256 encryption algorithms', () => {
      expect(verifyAES256Encryption('aes-256-gcm')).toBe(true);
      expect(verifyAES256Encryption('aes-256-cbc')).toBe(true);
      expect(verifyAES256Encryption('AES-256-GCM')).toBe(true);
      expect(verifyAES256Encryption('RSA_DECRYPT_OAEP_4096_SHA256')).toBe(true);
      expect(verifyAES256Encryption('aes-128-gcm')).toBe(false);
      expect(verifyAES256Encryption('des')).toBe(false);
    });
  });
});
