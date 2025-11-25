/**
 * ESTA 2025 Compliance Reporting Service
 * 
 * Generates compliance reports required by Michigan's ESTA 2025 regulations:
 * - Annual certification reports
 * - Retention audit reports
 * - Access audit reports
 * - Security audit reports
 * - Policy compliance reports
 * 
 * @module complianceReportingService
 */

import { randomUUID } from 'crypto';
import type {
  RetentionMetadata,
  ImmutableAuditEntry,
  AccessLogEntry,
} from './complianceService.js';

// ============================================================================
// Type Definitions for Reporting
// ============================================================================

export type ComplianceReportType = 
  | 'ANNUAL_CERTIFICATION'
  | 'RETENTION_AUDIT'
  | 'ACCESS_AUDIT'
  | 'SECURITY_AUDIT'
  | 'BREACH_SUMMARY'
  | 'POLICY_COMPLIANCE'
  | 'GOVERNMENT_REQUEST_LOG';

export interface ComplianceReport {
  id: string;
  tenantId: string;
  reportType: ComplianceReportType;
  title: string;
  description: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'SUBMITTED' | 'ARCHIVED';
  findings: {
    category: string;
    description: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    recommendation?: string;
  }[];
  metrics: Record<string, number | string>;
  certifiedBy?: string;
  certifiedAt?: Date;
  submittedTo?: string;
  submittedAt?: Date;
  documentIds: string[];
  retentionEndDate: Date;
}

export interface AnnualCertification {
  id: string;
  tenantId: string;
  certificationYear: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  preparedBy: string;
  preparedAt: Date;
  certifications: {
    requirement: string;
    description: string;
    compliant: boolean;
    evidence?: string[];
    notes?: string;
  }[];
  certifiedBy?: string;
  certifiedAt?: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  documentIds: string[];
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate a compliance report
 */
export function generateComplianceReport(params: {
  tenantId: string;
  reportType: ComplianceReportType;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  generatedBy: string;
  findings?: ComplianceReport['findings'];
  metrics?: Record<string, number | string>;
}): ComplianceReport {
  const now = new Date();
  const retentionEndDate = new Date(now);
  retentionEndDate.setFullYear(retentionEndDate.getFullYear() + 7); // 7-year retention
  
  return {
    id: randomUUID(),
    tenantId: params.tenantId,
    reportType: params.reportType,
    title: params.title,
    description: params.description,
    reportPeriod: {
      startDate: params.startDate,
      endDate: params.endDate,
    },
    generatedAt: now,
    generatedBy: params.generatedBy,
    status: 'DRAFT',
    findings: params.findings || [],
    metrics: params.metrics || {},
    documentIds: [],
    retentionEndDate,
  };
}

/**
 * Generate retention audit report
 */
export function generateRetentionAuditReport(params: {
  tenantId: string;
  generatedBy: string;
  retentionRecords: RetentionMetadata[];
  startDate: Date;
  endDate: Date;
}): ComplianceReport {
  const { tenantId, generatedBy, retentionRecords, startDate, endDate } = params;
  
  // Calculate metrics
  const totalRecords = retentionRecords.length;
  const lockedRecords = retentionRecords.filter(r => r.isLocked).length;
  const legalHoldRecords = retentionRecords.filter(r => r.hasLegalHold).length;
  const archivedRecords = retentionRecords.filter(r => r.isArchived).length;
  
  const now = new Date();
  const expiringIn30Days = retentionRecords.filter(r => {
    const daysUntilExpiry = Math.ceil((r.retentionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  }).length;
  
  const eligibleForDeletion = retentionRecords.filter(r => 
    r.retentionEndDate <= now && !r.hasLegalHold && !r.isLocked
  ).length;

  // Group by record type
  const recordsByType: Record<string, number> = {};
  retentionRecords.forEach(r => {
    recordsByType[r.recordType] = (recordsByType[r.recordType] || 0) + 1;
  });

  // Generate findings
  const findings: ComplianceReport['findings'] = [];
  
  if (eligibleForDeletion > 0) {
    findings.push({
      category: 'Retention',
      description: `${eligibleForDeletion} records are eligible for deletion`,
      severity: 'INFO',
      recommendation: 'Review and delete records as per retention policy',
    });
  }
  
  if (expiringIn30Days > 0) {
    findings.push({
      category: 'Retention',
      description: `${expiringIn30Days} records will expire within 30 days`,
      severity: 'WARNING',
      recommendation: 'Prepare for record archival or deletion',
    });
  }
  
  if (legalHoldRecords > 0) {
    findings.push({
      category: 'Legal Hold',
      description: `${legalHoldRecords} records are under legal hold`,
      severity: 'INFO',
      recommendation: 'Ensure legal holds are reviewed periodically',
    });
  }

  return generateComplianceReport({
    tenantId,
    reportType: 'RETENTION_AUDIT',
    title: 'Retention Audit Report',
    description: `Retention audit for period ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    startDate,
    endDate,
    generatedBy,
    findings,
    metrics: {
      totalRecords,
      lockedRecords,
      legalHoldRecords,
      archivedRecords,
      expiringIn30Days,
      eligibleForDeletion,
      ...recordsByType,
    },
  });
}

/**
 * Generate access audit report
 */
export function generateAccessAuditReport(params: {
  tenantId: string;
  generatedBy: string;
  accessLogs: AccessLogEntry[];
  startDate: Date;
  endDate: Date;
}): ComplianceReport {
  const { tenantId, generatedBy, accessLogs, startDate, endDate } = params;
  
  // Calculate metrics
  const totalAccesses = accessLogs.length;
  const successfulAccesses = accessLogs.filter(l => l.success).length;
  const failedAccesses = accessLogs.filter(l => !l.success).length;
  
  // Group by access type
  const accessByType: Record<string, number> = {};
  accessLogs.forEach(l => {
    accessByType[l.accessType] = (accessByType[l.accessType] || 0) + 1;
  });
  
  // Group by user role
  const accessByRole: Record<string, number> = {};
  accessLogs.forEach(l => {
    accessByRole[l.userRole] = (accessByRole[l.userRole] || 0) + 1;
  });
  
  // Unique users
  const uniqueUsers = new Set(accessLogs.map(l => l.userId)).size;
  
  // Generate findings
  const findings: ComplianceReport['findings'] = [];
  
  const failureRate = totalAccesses > 0 ? (failedAccesses / totalAccesses) * 100 : 0;
  if (failureRate > 5) {
    findings.push({
      category: 'Access Control',
      description: `Access failure rate is ${failureRate.toFixed(1)}%`,
      severity: failureRate > 20 ? 'CRITICAL' : 'WARNING',
      recommendation: 'Investigate high access failure rate',
    });
  }
  
  // Check for unusual access patterns (e.g., high number of DELETE operations)
  const deleteCount = accessByType['DELETE'] || 0;
  const deleteRate = totalAccesses > 0 ? (deleteCount / totalAccesses) * 100 : 0;
  if (deleteRate > 10) {
    findings.push({
      category: 'Data Integrity',
      description: `Delete operations account for ${deleteRate.toFixed(1)}% of all accesses`,
      severity: 'WARNING',
      recommendation: 'Review delete operations for potential data loss concerns',
    });
  }

  return generateComplianceReport({
    tenantId,
    reportType: 'ACCESS_AUDIT',
    title: 'Access Audit Report',
    description: `Access audit for period ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    startDate,
    endDate,
    generatedBy,
    findings,
    metrics: {
      totalAccesses,
      successfulAccesses,
      failedAccesses,
      uniqueUsers,
      ...accessByType,
      ...Object.fromEntries(Object.entries(accessByRole).map(([k, v]) => [`role_${k}`, v])),
    },
  });
}

/**
 * Generate security audit report
 */
export function generateSecurityAuditReport(params: {
  tenantId: string;
  generatedBy: string;
  auditEntries: ImmutableAuditEntry[];
  startDate: Date;
  endDate: Date;
}): ComplianceReport {
  const { tenantId, generatedBy, auditEntries, startDate, endDate } = params;
  
  // Filter security-related events
  const securityEvents = auditEntries.filter(e => 
    ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'ACCESS_DENIED', 'BREACH_DETECTED',
     'ENCRYPTION_KEY_ROTATED', 'DATA_EXPORT_REQUESTED', 'LEGAL_HOLD_PLACED'].includes(e.action)
  );
  
  // Calculate metrics
  const totalEvents = securityEvents.length;
  const loginAttempts = securityEvents.filter(e => e.action === 'LOGIN').length;
  const failedLogins = securityEvents.filter(e => e.action === 'LOGIN_FAILED').length;
  const accessDenied = securityEvents.filter(e => e.action === 'ACCESS_DENIED').length;
  const breachEvents = securityEvents.filter(e => e.action === 'BREACH_DETECTED').length;
  const keyRotations = securityEvents.filter(e => e.action === 'ENCRYPTION_KEY_ROTATED').length;
  
  // Group by severity
  const eventsBySeverity: Record<string, number> = {};
  securityEvents.forEach(e => {
    eventsBySeverity[e.severity] = (eventsBySeverity[e.severity] || 0) + 1;
  });
  
  // Generate findings
  const findings: ComplianceReport['findings'] = [];
  
  if (breachEvents > 0) {
    findings.push({
      category: 'Security',
      description: `${breachEvents} breach events detected during the period`,
      severity: 'CRITICAL',
      recommendation: 'Review all breach incidents and ensure proper remediation',
    });
  }
  
  const loginFailureRate = loginAttempts > 0 ? (failedLogins / loginAttempts) * 100 : 0;
  if (loginFailureRate > 25) {
    findings.push({
      category: 'Authentication',
      description: `Login failure rate is ${loginFailureRate.toFixed(1)}%`,
      severity: 'WARNING',
      recommendation: 'Investigate possible brute force attacks',
    });
  }
  
  if (accessDenied > 50) {
    findings.push({
      category: 'Authorization',
      description: `${accessDenied} access denied events`,
      severity: 'INFO',
      recommendation: 'Review access control policies',
    });
  }
  
  // Check data residency compliance
  const nonUSEvents = securityEvents.filter(e => e.dataResidency !== 'US');
  if (nonUSEvents.length > 0) {
    findings.push({
      category: 'Data Residency',
      description: `${nonUSEvents.length} events with non-US data residency`,
      severity: 'CRITICAL',
      recommendation: 'Immediately investigate data residency violations',
    });
  }

  return generateComplianceReport({
    tenantId,
    reportType: 'SECURITY_AUDIT',
    title: 'Security Audit Report',
    description: `Security audit for period ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    startDate,
    endDate,
    generatedBy,
    findings,
    metrics: {
      totalSecurityEvents: totalEvents,
      loginAttempts,
      failedLogins,
      accessDenied,
      breachEvents,
      keyRotations,
      criticalEvents: eventsBySeverity['CRITICAL'] || 0,
      warningEvents: eventsBySeverity['WARNING'] || 0,
    },
  });
}

// ============================================================================
// Annual Certification
// ============================================================================

/**
 * ESTA 2025 Compliance Requirements for Annual Certification
 */
export const ESTA_CERTIFICATION_REQUIREMENTS = [
  {
    id: 'retention_policy',
    requirement: 'Data Retention Policy',
    description: 'Maintain records for required retention periods (7/5/3 years based on status)',
  },
  {
    id: 'encryption_at_rest',
    requirement: 'Encryption at Rest',
    description: 'All sensitive data encrypted using AES-256 encryption',
  },
  {
    id: 'access_controls',
    requirement: 'Access Controls',
    description: 'Role-based access controls implemented and enforced',
  },
  {
    id: 'audit_logging',
    requirement: 'Audit Logging',
    description: 'Immutable audit logs maintained for all data access and modifications',
  },
  {
    id: 'data_residency',
    requirement: 'US Data Residency',
    description: 'All data stored exclusively within US data centers',
  },
  {
    id: 'breach_notification',
    requirement: 'Breach Notification',
    description: 'Automated breach detection and notification workflow in place',
  },
  {
    id: 'employee_access',
    requirement: 'Employee Data Access',
    description: 'Employees have access to view their own sick time records',
  },
  {
    id: 'request_tracking',
    requirement: 'Request Documentation',
    description: 'All sick time requests documented with approval/denial justifications',
  },
  {
    id: 'legal_hold',
    requirement: 'Legal Hold Capability',
    description: 'Ability to place and manage legal holds on records',
  },
  {
    id: 'deletion_safeguards',
    requirement: 'Deletion Safeguards',
    description: 'Multi-step approval workflow for record deletion',
  },
];

/**
 * Create annual certification
 */
export function createAnnualCertification(params: {
  tenantId: string;
  certificationYear: number;
  preparedBy: string;
}): AnnualCertification {
  const now = new Date();
  // Use April 1st and subtract one day to always get March 31st correctly
  const dueDate = new Date(params.certificationYear, 3, 0); // Last day of March
  
  return {
    id: randomUUID(),
    tenantId: params.tenantId,
    certificationYear: params.certificationYear,
    status: 'PENDING',
    preparedBy: params.preparedBy,
    preparedAt: now,
    certifications: ESTA_CERTIFICATION_REQUIREMENTS.map(req => ({
      requirement: req.requirement,
      description: req.description,
      compliant: false, // Must be explicitly verified
    })),
    documentIds: [],
    dueDate,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update certification requirement status
 */
export function updateCertificationRequirement(
  certification: AnnualCertification,
  requirementIndex: number,
  update: {
    compliant: boolean;
    evidence?: string[];
    notes?: string;
  }
): AnnualCertification {
  const updatedCertifications = [...certification.certifications];
  const existingCert = updatedCertifications[requirementIndex];
  if (existingCert) {
    updatedCertifications[requirementIndex] = {
      requirement: existingCert.requirement,
      description: existingCert.description,
      compliant: update.compliant,
      evidence: update.evidence,
      notes: update.notes,
    };
  }
  
  return {
    ...certification,
    certifications: updatedCertifications,
    status: 'IN_PROGRESS',
    updatedAt: new Date(),
  };
}

/**
 * Submit annual certification
 */
export function submitAnnualCertification(
  certification: AnnualCertification,
  certifiedBy: string
): AnnualCertification {
  const allCompliant = certification.certifications.every(c => c.compliant);
  
  if (!allCompliant) {
    throw new Error('Cannot submit certification: Not all requirements are marked as compliant');
  }
  
  const now = new Date();
  return {
    ...certification,
    status: 'SUBMITTED',
    certifiedBy,
    certifiedAt: now,
    submittedAt: now,
    updatedAt: now,
  };
}

/**
 * Approve annual certification (by regulatory body or internal compliance)
 */
export function approveAnnualCertification(
  certification: AnnualCertification,
  approvedBy: string
): AnnualCertification {
  if (certification.status !== 'SUBMITTED') {
    throw new Error('Certification must be submitted before approval');
  }
  
  const now = new Date();
  return {
    ...certification,
    status: 'APPROVED',
    approvedBy,
    approvedAt: now,
    updatedAt: now,
  };
}

/**
 * Reject annual certification
 */
export function rejectAnnualCertification(
  certification: AnnualCertification,
  rejectionReason: string
): AnnualCertification {
  if (certification.status !== 'SUBMITTED') {
    throw new Error('Certification must be submitted before rejection');
  }
  
  return {
    ...certification,
    status: 'REJECTED',
    rejectionReason,
    updatedAt: new Date(),
  };
}

// ============================================================================
// Report Status Updates
// ============================================================================

/**
 * Approve a compliance report
 */
export function approveComplianceReport(
  report: ComplianceReport,
  certifiedBy: string
): ComplianceReport {
  return {
    ...report,
    status: 'APPROVED',
    certifiedBy,
    certifiedAt: new Date(),
  };
}

/**
 * Submit a compliance report
 */
export function submitComplianceReport(
  report: ComplianceReport,
  submittedTo: string
): ComplianceReport {
  if (report.status !== 'APPROVED') {
    throw new Error('Report must be approved before submission');
  }
  
  return {
    ...report,
    status: 'SUBMITTED',
    submittedTo,
    submittedAt: new Date(),
  };
}

/**
 * Archive a compliance report
 */
export function archiveComplianceReport(report: ComplianceReport): ComplianceReport {
  return {
    ...report,
    status: 'ARCHIVED',
  };
}

// ============================================================================
// Gap Analysis
// ============================================================================

/**
 * Compliance gap analysis result
 */
export interface ComplianceGapAnalysis {
  tenantId: string;
  analyzedAt: Date;
  overallCompliance: number; // 0-100
  gaps: {
    area: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    recommendation: string;
    estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  strengths: string[];
}

/**
 * Perform compliance gap analysis
 */
export function performComplianceGapAnalysis(params: {
  tenantId: string;
  hasEncryption: boolean;
  hasAuditLogs: boolean;
  hasAccessControls: boolean;
  hasRetentionPolicy: boolean;
  hasBreachNotification: boolean;
  hasDataResidency: boolean;
  hasLegalHold: boolean;
  hasDeletionSafeguards: boolean;
}): ComplianceGapAnalysis {
  const gaps: ComplianceGapAnalysis['gaps'] = [];
  const strengths: string[] = [];
  
  // Check each compliance area
  if (params.hasEncryption) {
    strengths.push('AES-256 encryption implemented for data at rest');
  } else {
    gaps.push({
      area: 'Encryption',
      severity: 'CRITICAL',
      description: 'Data at rest is not encrypted with AES-256',
      recommendation: 'Implement AES-256-GCM encryption for all sensitive data',
      estimatedEffort: 'HIGH',
    });
  }
  
  if (params.hasAuditLogs) {
    strengths.push('Immutable audit logging in place');
  } else {
    gaps.push({
      area: 'Audit Logging',
      severity: 'HIGH',
      description: 'Immutable audit logging not implemented',
      recommendation: 'Implement blockchain-style audit log chain',
      estimatedEffort: 'MEDIUM',
    });
  }
  
  if (params.hasAccessControls) {
    strengths.push('Role-based access controls implemented');
  } else {
    gaps.push({
      area: 'Access Control',
      severity: 'HIGH',
      description: 'Role-based access controls not fully implemented',
      recommendation: 'Implement comprehensive RBAC with audit logging',
      estimatedEffort: 'MEDIUM',
    });
  }
  
  if (params.hasRetentionPolicy) {
    strengths.push('Retention policy enforcement active');
  } else {
    gaps.push({
      area: 'Data Retention',
      severity: 'HIGH',
      description: 'Retention policy not enforced automatically',
      recommendation: 'Implement automated retention tracking and enforcement',
      estimatedEffort: 'MEDIUM',
    });
  }
  
  if (params.hasBreachNotification) {
    strengths.push('Breach notification workflow configured');
  } else {
    gaps.push({
      area: 'Breach Notification',
      severity: 'MEDIUM',
      description: 'Automated breach notification not implemented',
      recommendation: 'Set up automated breach detection and notification',
      estimatedEffort: 'MEDIUM',
    });
  }
  
  if (params.hasDataResidency) {
    strengths.push('US data residency compliance verified');
  } else {
    gaps.push({
      area: 'Data Residency',
      severity: 'CRITICAL',
      description: 'US-only data residency not verified',
      recommendation: 'Ensure all data storage is in US data centers',
      estimatedEffort: 'HIGH',
    });
  }
  
  if (params.hasLegalHold) {
    strengths.push('Legal hold capability available');
  } else {
    gaps.push({
      area: 'Legal Hold',
      severity: 'MEDIUM',
      description: 'Legal hold capability not implemented',
      recommendation: 'Implement legal hold placement and tracking',
      estimatedEffort: 'LOW',
    });
  }
  
  if (params.hasDeletionSafeguards) {
    strengths.push('Deletion safeguards active');
  } else {
    gaps.push({
      area: 'Deletion Safeguards',
      severity: 'MEDIUM',
      description: 'Multi-step deletion approval not implemented',
      recommendation: 'Implement approval workflow for data deletion',
      estimatedEffort: 'LOW',
    });
  }
  
  // Calculate overall compliance percentage
  const totalAreas = 8;
  const compliantAreas = strengths.length;
  const overallCompliance = Math.round((compliantAreas / totalAreas) * 100);
  
  return {
    tenantId: params.tenantId,
    analyzedAt: new Date(),
    overallCompliance,
    gaps,
    strengths,
  };
}
