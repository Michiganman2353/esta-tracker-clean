/**
 * Tests for ESTA 2025 Compliance Reporting Service
 */

import { describe, it, expect } from 'vitest';
import {
  generateComplianceReport,
  generateRetentionAuditReport,
  generateAccessAuditReport,
  generateSecurityAuditReport,
  createAnnualCertification,
  updateCertificationRequirement,
  submitAnnualCertification,
  approveAnnualCertification,
  rejectAnnualCertification,
  approveComplianceReport,
  submitComplianceReport,
  archiveComplianceReport,
  performComplianceGapAnalysis,
  ESTA_CERTIFICATION_REQUIREMENTS,
} from '../complianceReportingService.js';
import { createRetentionMetadata, createAccessLogEntry, createImmutableAuditEntry } from '../complianceService.js';

describe('ESTA 2025 Compliance Reporting Service', () => {
  // =========================================================================
  // Report Generation Tests
  // =========================================================================
  describe('Report Generation', () => {
    it('should generate a compliance report', () => {
      const report = generateComplianceReport({
        tenantId: 'tenant-123',
        reportType: 'RETENTION_AUDIT',
        title: 'Test Report',
        description: 'Test description',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        generatedBy: 'admin-123',
      });

      expect(report.id).toBeDefined();
      expect(report.tenantId).toBe('tenant-123');
      expect(report.reportType).toBe('RETENTION_AUDIT');
      expect(report.status).toBe('DRAFT');
      expect(report.retentionEndDate).toBeDefined();
    });

    it('should generate retention audit report with metrics', () => {
      const retentionRecords = [
        createRetentionMetadata({
          recordType: 'sick_time_request',
          recordId: 'req-1',
          tenantId: 'tenant-123',
          applicationStatus: 'approved',
        }),
        createRetentionMetadata({
          recordType: 'document',
          recordId: 'doc-1',
          tenantId: 'tenant-123',
        }),
      ];

      const report = generateRetentionAuditReport({
        tenantId: 'tenant-123',
        generatedBy: 'admin-123',
        retentionRecords,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      });

      expect(report.reportType).toBe('RETENTION_AUDIT');
      expect(report.metrics.totalRecords).toBe(2);
      expect(report.metrics.lockedRecords).toBe(2);
    });

    it('should generate access audit report with metrics', () => {
      const accessLogs = [
        createAccessLogEntry({
          userId: 'user-1',
          userRole: 'employer',
          tenantId: 'tenant-123',
          resourceType: 'sick_time_request',
          resourceId: 'req-1',
          accessType: 'READ',
          success: true,
        }),
        createAccessLogEntry({
          userId: 'user-2',
          userRole: 'employee',
          tenantId: 'tenant-123',
          resourceType: 'document',
          resourceId: 'doc-1',
          accessType: 'DOWNLOAD',
          success: false,
          failureReason: 'Access denied',
        }),
      ];

      const report = generateAccessAuditReport({
        tenantId: 'tenant-123',
        generatedBy: 'admin-123',
        accessLogs,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      });

      expect(report.reportType).toBe('ACCESS_AUDIT');
      expect(report.metrics.totalAccesses).toBe(2);
      expect(report.metrics.successfulAccesses).toBe(1);
      expect(report.metrics.failedAccesses).toBe(1);
      expect(report.metrics.uniqueUsers).toBe(2);
    });

    it('should generate security audit report with breach detection', () => {
      const auditEntries = [
        createImmutableAuditEntry({
          action: 'LOGIN',
          severity: 'INFO',
          actor: { userId: 'user-1', role: 'employer' },
          resource: { type: 'employer_profile', id: 'emp-1', tenantId: 'tenant-123' },
          details: { description: 'User logged in' },
        }),
        createImmutableAuditEntry({
          action: 'LOGIN_FAILED',
          severity: 'WARNING',
          actor: { userId: 'user-2', role: 'unknown' },
          resource: { type: 'employer_profile', id: 'emp-1', tenantId: 'tenant-123' },
          details: { description: 'Failed login attempt' },
        }),
        createImmutableAuditEntry({
          action: 'ACCESS_DENIED',
          severity: 'WARNING',
          actor: { userId: 'user-3', role: 'employee' },
          resource: { type: 'employer_profile', id: 'emp-1', tenantId: 'tenant-123' },
          details: { description: 'Access denied' },
        }),
      ];

      const report = generateSecurityAuditReport({
        tenantId: 'tenant-123',
        generatedBy: 'admin-123',
        auditEntries,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      });

      expect(report.reportType).toBe('SECURITY_AUDIT');
      expect(report.metrics.totalSecurityEvents).toBe(3);
      expect(report.metrics.loginAttempts).toBe(1);
      expect(report.metrics.failedLogins).toBe(1);
      expect(report.metrics.accessDenied).toBe(1);
      expect(report.metrics.breachEvents).toBe(0);
    });
  });

  // =========================================================================
  // Annual Certification Tests
  // =========================================================================
  describe('Annual Certification', () => {
    it('should have correct ESTA certification requirements', () => {
      expect(ESTA_CERTIFICATION_REQUIREMENTS.length).toBeGreaterThan(5);
      expect(ESTA_CERTIFICATION_REQUIREMENTS).toContainEqual(
        expect.objectContaining({ id: 'encryption_at_rest' })
      );
      expect(ESTA_CERTIFICATION_REQUIREMENTS).toContainEqual(
        expect.objectContaining({ id: 'audit_logging' })
      );
      expect(ESTA_CERTIFICATION_REQUIREMENTS).toContainEqual(
        expect.objectContaining({ id: 'data_residency' })
      );
    });

    it('should create annual certification', () => {
      const certification = createAnnualCertification({
        tenantId: 'tenant-123',
        certificationYear: 2025,
        preparedBy: 'admin-123',
      });

      expect(certification.id).toBeDefined();
      expect(certification.certificationYear).toBe(2025);
      expect(certification.status).toBe('PENDING');
      expect(certification.certifications.length).toBe(ESTA_CERTIFICATION_REQUIREMENTS.length);
      expect(certification.certifications.every(c => c.compliant === false)).toBe(true);
    });

    it('should update certification requirement', () => {
      const certification = createAnnualCertification({
        tenantId: 'tenant-123',
        certificationYear: 2025,
        preparedBy: 'admin-123',
      });

      const updated = updateCertificationRequirement(certification, 0, {
        compliant: true,
        evidence: ['doc-1', 'doc-2'],
        notes: 'Verified encryption implementation',
      });

      expect(updated.status).toBe('IN_PROGRESS');
      expect(updated.certifications[0].compliant).toBe(true);
      expect(updated.certifications[0].evidence).toHaveLength(2);
    });

    it('should prevent submission of incomplete certification', () => {
      const certification = createAnnualCertification({
        tenantId: 'tenant-123',
        certificationYear: 2025,
        preparedBy: 'admin-123',
      });

      expect(() => submitAnnualCertification(certification, 'admin-123')).toThrow();
    });

    it('should allow submission of complete certification', () => {
      let certification = createAnnualCertification({
        tenantId: 'tenant-123',
        certificationYear: 2025,
        preparedBy: 'admin-123',
      });

      // Mark all requirements as compliant
      for (let i = 0; i < certification.certifications.length; i++) {
        certification = updateCertificationRequirement(certification, i, {
          compliant: true,
        });
      }

      const submitted = submitAnnualCertification(certification, 'ciso-123');

      expect(submitted.status).toBe('SUBMITTED');
      expect(submitted.certifiedBy).toBe('ciso-123');
      expect(submitted.submittedAt).toBeDefined();
    });

    it('should approve submitted certification', () => {
      let certification = createAnnualCertification({
        tenantId: 'tenant-123',
        certificationYear: 2025,
        preparedBy: 'admin-123',
      });

      // Mark all as compliant and submit
      for (let i = 0; i < certification.certifications.length; i++) {
        certification = updateCertificationRequirement(certification, i, { compliant: true });
      }
      certification = submitAnnualCertification(certification, 'ciso-123');

      const approved = approveAnnualCertification(certification, 'regulator-123');

      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedBy).toBe('regulator-123');
    });

    it('should reject submitted certification with reason', () => {
      let certification = createAnnualCertification({
        tenantId: 'tenant-123',
        certificationYear: 2025,
        preparedBy: 'admin-123',
      });

      // Mark all as compliant and submit
      for (let i = 0; i < certification.certifications.length; i++) {
        certification = updateCertificationRequirement(certification, i, { compliant: true });
      }
      certification = submitAnnualCertification(certification, 'ciso-123');

      const rejected = rejectAnnualCertification(certification, 'Insufficient evidence provided');

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.rejectionReason).toBe('Insufficient evidence provided');
    });
  });

  // =========================================================================
  // Report Status Updates Tests
  // =========================================================================
  describe('Report Status Updates', () => {
    it('should approve compliance report', () => {
      const report = generateComplianceReport({
        tenantId: 'tenant-123',
        reportType: 'RETENTION_AUDIT',
        title: 'Test Report',
        description: 'Test',
        startDate: new Date(),
        endDate: new Date(),
        generatedBy: 'admin-123',
      });

      const approved = approveComplianceReport(report, 'manager-123');

      expect(approved.status).toBe('APPROVED');
      expect(approved.certifiedBy).toBe('manager-123');
    });

    it('should prevent submission of unapproved report', () => {
      const report = generateComplianceReport({
        tenantId: 'tenant-123',
        reportType: 'ACCESS_AUDIT',
        title: 'Test Report',
        description: 'Test',
        startDate: new Date(),
        endDate: new Date(),
        generatedBy: 'admin-123',
      });

      expect(() => submitComplianceReport(report, 'regulator')).toThrow();
    });

    it('should submit approved report', () => {
      let report = generateComplianceReport({
        tenantId: 'tenant-123',
        reportType: 'SECURITY_AUDIT',
        title: 'Test Report',
        description: 'Test',
        startDate: new Date(),
        endDate: new Date(),
        generatedBy: 'admin-123',
      });

      report = approveComplianceReport(report, 'manager-123');
      const submitted = submitComplianceReport(report, 'Michigan ESTA Authority');

      expect(submitted.status).toBe('SUBMITTED');
      expect(submitted.submittedTo).toBe('Michigan ESTA Authority');
    });

    it('should archive report', () => {
      const report = generateComplianceReport({
        tenantId: 'tenant-123',
        reportType: 'RETENTION_AUDIT',
        title: 'Test Report',
        description: 'Test',
        startDate: new Date(),
        endDate: new Date(),
        generatedBy: 'admin-123',
      });

      const archived = archiveComplianceReport(report);

      expect(archived.status).toBe('ARCHIVED');
    });
  });

  // =========================================================================
  // Gap Analysis Tests
  // =========================================================================
  describe('Gap Analysis', () => {
    it('should perform full compliance gap analysis', () => {
      const analysis = performComplianceGapAnalysis({
        tenantId: 'tenant-123',
        hasEncryption: true,
        hasAuditLogs: true,
        hasAccessControls: true,
        hasRetentionPolicy: true,
        hasBreachNotification: true,
        hasDataResidency: true,
        hasLegalHold: true,
        hasDeletionSafeguards: true,
      });

      expect(analysis.overallCompliance).toBe(100);
      expect(analysis.gaps).toHaveLength(0);
      expect(analysis.strengths).toHaveLength(8);
    });

    it('should identify gaps when features are missing', () => {
      const analysis = performComplianceGapAnalysis({
        tenantId: 'tenant-123',
        hasEncryption: false,
        hasAuditLogs: false,
        hasAccessControls: true,
        hasRetentionPolicy: true,
        hasBreachNotification: false,
        hasDataResidency: true,
        hasLegalHold: false,
        hasDeletionSafeguards: true,
      });

      expect(analysis.overallCompliance).toBe(50);
      expect(analysis.gaps.length).toBeGreaterThan(0);
      expect(analysis.strengths.length).toBe(4);
      
      // Check that critical gaps are identified
      const criticalGaps = analysis.gaps.filter(g => g.severity === 'CRITICAL');
      expect(criticalGaps.length).toBeGreaterThan(0);
    });

    it('should identify encryption as critical gap', () => {
      const analysis = performComplianceGapAnalysis({
        tenantId: 'tenant-123',
        hasEncryption: false,
        hasAuditLogs: true,
        hasAccessControls: true,
        hasRetentionPolicy: true,
        hasBreachNotification: true,
        hasDataResidency: true,
        hasLegalHold: true,
        hasDeletionSafeguards: true,
      });

      const encryptionGap = analysis.gaps.find(g => g.area === 'Encryption');
      expect(encryptionGap).toBeDefined();
      expect(encryptionGap?.severity).toBe('CRITICAL');
    });

    it('should identify data residency as critical gap', () => {
      const analysis = performComplianceGapAnalysis({
        tenantId: 'tenant-123',
        hasEncryption: true,
        hasAuditLogs: true,
        hasAccessControls: true,
        hasRetentionPolicy: true,
        hasBreachNotification: true,
        hasDataResidency: false,
        hasLegalHold: true,
        hasDeletionSafeguards: true,
      });

      const residencyGap = analysis.gaps.find(g => g.area === 'Data Residency');
      expect(residencyGap).toBeDefined();
      expect(residencyGap?.severity).toBe('CRITICAL');
    });
  });
});
