/**
 * ESTA 2025 Record-Keeping Compliance Types and Schemas
 * 
 * This module defines all types required for Michigan ESTA 2025
 * Record-Keeping Regulations compliance including:
 * - Retention metadata and policies
 * - Audit logging
 * - Data security compliance
 * - Documentation requirements
 * - Compliance reporting
 * - Penalty mitigation controls
 * 
 * @module compliance
 */

import { z } from 'zod';

// ============================================================================
// Section 1: Retention System Types
// ============================================================================

/**
 * Application status for ESTA requests - determines retention period
 */
export const ApplicationStatusSchema = z.enum([
  'pending',
  'approved',
  'denied',
  'withdrawn',
  'cancelled',
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

/**
 * Record type for categorization
 */
export const RecordTypeSchema = z.enum([
  'sick_time_request',
  'work_log',
  'employee_profile',
  'employer_profile',
  'payment_record',
  'audit_log',
  'communication',
  'document',
  'policy_version',
  'compliance_report',
  'certification',
  'government_request',
]);
export type RecordType = z.infer<typeof RecordTypeSchema>;

/**
 * Retention periods based on ESTA 2025 requirements:
 * - Approved applications: 7 years
 * - Denied applications: 5 years
 * - Withdrawn/Cancelled applications: 3 years
 * - Payment records: 7 years
 * - Audit logs: 7 years (immutable)
 * - Communications: 5 years
 */
export const RetentionPeriodYears = {
  APPROVED: 7,
  DENIED: 5,
  WITHDRAWN: 3,
  CANCELLED: 3,
  PAYMENT: 7,
  AUDIT_LOG: 7,
  COMMUNICATION: 5,
  EMPLOYEE_RECORD: 7,
  EMPLOYER_RECORD: 7,
  POLICY_VERSION: 10,
  COMPLIANCE_REPORT: 7,
  GOVERNMENT_REQUEST: 10,
} as const;

/**
 * Retention metadata for tracking record lifecycle
 */
export interface RetentionMetadata {
  /** Unique identifier */
  id: string;
  
  /** Type of record */
  recordType: RecordType;
  
  /** Reference to the actual record */
  recordId: string;
  
  /** Associated tenant/employer ID */
  tenantId: string;
  
  /** Application status (for request records) */
  applicationStatus?: ApplicationStatus;
  
  /** Date the record was created */
  createdAt: Date;
  
  /** Date the status was finalized (for retention calculation) */
  finalizedAt?: Date;
  
  /** Calculated retention end date */
  retentionEndDate: Date;
  
  /** Retention period in years */
  retentionYears: number;
  
  /** Whether record is locked from deletion */
  isLocked: boolean;
  
  /** Whether record has a legal hold */
  hasLegalHold: boolean;
  
  /** Legal hold details if applicable */
  legalHoldDetails?: {
    holdId: string;
    reason: string;
    placedBy: string;
    placedAt: Date;
    expiresAt?: Date;
  };
  
  /** Whether record has been archived */
  isArchived: boolean;
  
  /** Archive date if archived */
  archivedAt?: Date;
  
  /** Deletion eligibility date */
  eligibleForDeletionAt?: Date;
  
  /** Last audit date for this retention record */
  lastAuditedAt?: Date;
}

export const RetentionMetadataSchema = z.object({
  id: z.string(),
  recordType: RecordTypeSchema,
  recordId: z.string(),
  tenantId: z.string(),
  applicationStatus: ApplicationStatusSchema.optional(),
  createdAt: z.date(),
  finalizedAt: z.date().optional(),
  retentionEndDate: z.date(),
  retentionYears: z.number().min(1).max(15),
  isLocked: z.boolean(),
  hasLegalHold: z.boolean(),
  legalHoldDetails: z.object({
    holdId: z.string(),
    reason: z.string(),
    placedBy: z.string(),
    placedAt: z.date(),
    expiresAt: z.date().optional(),
  }).optional(),
  isArchived: z.boolean(),
  archivedAt: z.date().optional(),
  eligibleForDeletionAt: z.date().optional(),
  lastAuditedAt: z.date().optional(),
});

// ============================================================================
// Section 2: Immutable Audit Log Types
// ============================================================================

/**
 * Audit action types for immutable logging
 */
export const AuditActionSchema = z.enum([
  // Data operations
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'ARCHIVE',
  'RESTORE',
  
  // Authentication/Authorization
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'ACCESS_DENIED',
  'PERMISSION_GRANTED',
  'PERMISSION_REVOKED',
  
  // Request workflow
  'REQUEST_SUBMITTED',
  'REQUEST_APPROVED',
  'REQUEST_DENIED',
  'REQUEST_WITHDRAWN',
  'REQUEST_CANCELLED',
  
  // Document operations
  'DOCUMENT_UPLOADED',
  'DOCUMENT_DOWNLOADED',
  'DOCUMENT_VIEWED',
  'DOCUMENT_DELETED',
  
  // Compliance operations
  'LEGAL_HOLD_PLACED',
  'LEGAL_HOLD_RELEASED',
  'RETENTION_EXTENDED',
  'COMPLIANCE_REPORT_GENERATED',
  'CERTIFICATION_SUBMITTED',
  
  // Security events
  'ENCRYPTION_KEY_ROTATED',
  'DATA_EXPORT_REQUESTED',
  'DATA_EXPORT_COMPLETED',
  'BREACH_DETECTED',
  'BREACH_NOTIFICATION_SENT',
  
  // System operations
  'SYSTEM_MAINTENANCE',
  'BACKUP_CREATED',
  'BACKUP_RESTORED',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

/**
 * Severity level for audit entries
 */
export const AuditSeveritySchema = z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']);
export type AuditSeverity = z.infer<typeof AuditSeveritySchema>;

/**
 * Immutable audit log entry - cannot be modified after creation
 */
export interface ImmutableAuditEntry {
  /** Unique audit entry ID (UUID v4) */
  id: string;
  
  /** Timestamp of the action (immutable) */
  timestamp: Date;
  
  /** Action performed */
  action: AuditAction;
  
  /** Severity level */
  severity: AuditSeverity;
  
  /** Actor who performed the action */
  actor: {
    userId: string;
    email?: string;
    role: string;
    ipAddress?: string;
    userAgent?: string;
  };
  
  /** Resource affected */
  resource: {
    type: RecordType;
    id: string;
    tenantId: string;
    name?: string;
  };
  
  /** Details of the action */
  details: {
    description: string;
    previousValue?: unknown;
    newValue?: unknown;
    metadata?: Record<string, unknown>;
  };
  
  /** Cryptographic hash for integrity verification */
  integrityHash: string;
  
  /** Hash of the previous entry (blockchain-like chain) */
  previousEntryHash?: string;
  
  /** Sequence number for ordering */
  sequenceNumber: number;
  
  /** Whether entry has been verified */
  isVerified: boolean;
  
  /** US-only data residency confirmation */
  dataResidency: 'US';
}

export const ImmutableAuditEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.date(),
  action: AuditActionSchema,
  severity: AuditSeveritySchema,
  actor: z.object({
    userId: z.string(),
    email: z.string().email().optional(),
    role: z.string(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
  }),
  resource: z.object({
    type: RecordTypeSchema,
    id: z.string(),
    tenantId: z.string(),
    name: z.string().optional(),
  }),
  details: z.object({
    description: z.string(),
    previousValue: z.unknown().optional(),
    newValue: z.unknown().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  integrityHash: z.string(),
  previousEntryHash: z.string().optional(),
  sequenceNumber: z.number().int().min(0),
  isVerified: z.boolean(),
  dataResidency: z.literal('US'),
});

// ============================================================================
// Section 3: Access Logging Types
// ============================================================================

/**
 * Access log entry for tracking data access
 */
export interface AccessLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail?: string;
  userRole: string;
  tenantId: string;
  resourceType: RecordType;
  resourceId: string;
  accessType: 'READ' | 'WRITE' | 'DELETE' | 'DOWNLOAD' | 'EXPORT';
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: {
    country: string;
    region?: string;
    city?: string;
  };
  success: boolean;
  failureReason?: string;
  dataResidency: 'US';
}

export const AccessLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  userId: z.string(),
  userEmail: z.string().email().optional(),
  userRole: z.string(),
  tenantId: z.string(),
  resourceType: RecordTypeSchema,
  resourceId: z.string(),
  accessType: z.enum(['READ', 'WRITE', 'DELETE', 'DOWNLOAD', 'EXPORT']),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  geoLocation: z.object({
    country: z.string(),
    region: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  success: z.boolean(),
  failureReason: z.string().optional(),
  dataResidency: z.literal('US'),
});

// ============================================================================
// Section 4: Breach Notification Types
// ============================================================================

/**
 * Breach severity levels
 */
export const BreachSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type BreachSeverity = z.infer<typeof BreachSeveritySchema>;

/**
 * Breach status tracking
 */
export const BreachStatusSchema = z.enum([
  'DETECTED',
  'INVESTIGATING',
  'CONTAINED',
  'NOTIFIED',
  'RESOLVED',
  'CLOSED',
]);
export type BreachStatus = z.infer<typeof BreachStatusSchema>;

/**
 * Breach notification record
 */
export interface BreachNotification {
  id: string;
  detectedAt: Date;
  severity: BreachSeverity;
  status: BreachStatus;
  description: string;
  affectedRecords: {
    recordType: RecordType;
    recordCount: number;
    tenantIds: string[];
  }[];
  affectedUserCount: number;
  detectionMethod: string;
  containmentActions: {
    action: string;
    performedBy: string;
    performedAt: Date;
    successful: boolean;
  }[];
  notifications: {
    recipientType: 'USER' | 'REGULATOR' | 'INTERNAL';
    recipientId?: string;
    notifiedAt: Date;
    method: 'EMAIL' | 'SMS' | 'MAIL' | 'PORTAL';
    template: string;
    successful: boolean;
  }[];
  resolvedAt?: Date;
  resolution?: string;
  lessonsLearned?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const BreachNotificationSchema = z.object({
  id: z.string(),
  detectedAt: z.date(),
  severity: BreachSeveritySchema,
  status: BreachStatusSchema,
  description: z.string(),
  affectedRecords: z.array(z.object({
    recordType: RecordTypeSchema,
    recordCount: z.number().int().min(0),
    tenantIds: z.array(z.string()),
  })),
  affectedUserCount: z.number().int().min(0),
  detectionMethod: z.string(),
  containmentActions: z.array(z.object({
    action: z.string(),
    performedBy: z.string(),
    performedAt: z.date(),
    successful: z.boolean(),
  })),
  notifications: z.array(z.object({
    recipientType: z.enum(['USER', 'REGULATOR', 'INTERNAL']),
    recipientId: z.string().optional(),
    notifiedAt: z.date(),
    method: z.enum(['EMAIL', 'SMS', 'MAIL', 'PORTAL']),
    template: z.string(),
    successful: z.boolean(),
  })),
  resolvedAt: z.date().optional(),
  resolution: z.string().optional(),
  lessonsLearned: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// Section 5: Document Versioning Types
// ============================================================================

/**
 * Document version entry
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  tenantId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  storageLocation: string;
  encryptionKeyId: string;
  createdAt: Date;
  createdBy: string;
  changeDescription?: string;
  previousVersionId?: string;
  isCurrentVersion: boolean;
  isImmutable: boolean;
}

export const DocumentVersionSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  versionNumber: z.number().int().min(1),
  tenantId: z.string(),
  fileName: z.string(),
  fileSize: z.number().int().min(0),
  mimeType: z.string(),
  checksum: z.string(),
  storageLocation: z.string(),
  encryptionKeyId: z.string(),
  createdAt: z.date(),
  createdBy: z.string(),
  changeDescription: z.string().optional(),
  previousVersionId: z.string().optional(),
  isCurrentVersion: z.boolean(),
  isImmutable: z.boolean(),
});

// ============================================================================
// Section 6: Justification Logging Types
// ============================================================================

/**
 * Justification log for recording decisions and their rationale
 */
export interface JustificationLog {
  id: string;
  tenantId: string;
  decisionType: 'REQUEST_APPROVAL' | 'REQUEST_DENIAL' | 'POLICY_CHANGE' | 'EXCEPTION_GRANT' | 'DATA_DELETION';
  relatedRecordType: RecordType;
  relatedRecordId: string;
  decision: string;
  justification: string;
  supportingDocuments?: string[];
  decidedBy: string;
  decidedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  isAppealed: boolean;
  appealDetails?: {
    appealedAt: Date;
    appealedBy: string;
    appealReason: string;
    appealDecision?: string;
    appealDecidedAt?: Date;
    appealDecidedBy?: string;
  };
  createdAt: Date;
}

export const JustificationLogSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  decisionType: z.enum([
    'REQUEST_APPROVAL',
    'REQUEST_DENIAL',
    'POLICY_CHANGE',
    'EXCEPTION_GRANT',
    'DATA_DELETION',
  ]),
  relatedRecordType: RecordTypeSchema,
  relatedRecordId: z.string(),
  decision: z.string(),
  justification: z.string().min(10),
  supportingDocuments: z.array(z.string()).optional(),
  decidedBy: z.string(),
  decidedAt: z.date(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
  isAppealed: z.boolean(),
  appealDetails: z.object({
    appealedAt: z.date(),
    appealedBy: z.string(),
    appealReason: z.string(),
    appealDecision: z.string().optional(),
    appealDecidedAt: z.date().optional(),
    appealDecidedBy: z.string().optional(),
  }).optional(),
  createdAt: z.date(),
});

// ============================================================================
// Section 7: Communication Archive Types
// ============================================================================

/**
 * Archived communication record
 */
export interface CommunicationArchive {
  id: string;
  tenantId: string;
  type: 'EMAIL' | 'SMS' | 'IN_APP' | 'DOCUMENT' | 'SYSTEM';
  direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
  subject?: string;
  content: string;
  contentEncrypted: boolean;
  encryptionKeyId?: string;
  sender: {
    userId?: string;
    email?: string;
    name?: string;
    system?: string;
  };
  recipients: {
    userId?: string;
    email?: string;
    name?: string;
  }[];
  relatedRecordType?: RecordType;
  relatedRecordId?: string;
  attachments?: {
    documentId: string;
    fileName: string;
    fileSize: number;
  }[];
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  archivedAt: Date;
  retentionEndDate: Date;
}

export const CommunicationArchiveSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  type: z.enum(['EMAIL', 'SMS', 'IN_APP', 'DOCUMENT', 'SYSTEM']),
  direction: z.enum(['INBOUND', 'OUTBOUND', 'INTERNAL']),
  subject: z.string().optional(),
  content: z.string(),
  contentEncrypted: z.boolean(),
  encryptionKeyId: z.string().optional(),
  sender: z.object({
    userId: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    system: z.string().optional(),
  }),
  recipients: z.array(z.object({
    userId: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
  })),
  relatedRecordType: RecordTypeSchema.optional(),
  relatedRecordId: z.string().optional(),
  attachments: z.array(z.object({
    documentId: z.string(),
    fileName: z.string(),
    fileSize: z.number().int().min(0),
  })).optional(),
  sentAt: z.date(),
  deliveredAt: z.date().optional(),
  readAt: z.date().optional(),
  archivedAt: z.date(),
  retentionEndDate: z.date(),
});

// ============================================================================
// Section 8: Compliance Reporting Types
// ============================================================================

/**
 * Compliance report types
 */
export const ComplianceReportTypeSchema = z.enum([
  'ANNUAL_CERTIFICATION',
  'RETENTION_AUDIT',
  'ACCESS_AUDIT',
  'SECURITY_AUDIT',
  'BREACH_SUMMARY',
  'POLICY_COMPLIANCE',
  'GOVERNMENT_REQUEST_LOG',
]);
export type ComplianceReportType = z.infer<typeof ComplianceReportTypeSchema>;

/**
 * Compliance report record
 */
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

export const ComplianceReportSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  reportType: ComplianceReportTypeSchema,
  title: z.string(),
  description: z.string(),
  reportPeriod: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
  generatedAt: z.date(),
  generatedBy: z.string(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUBMITTED', 'ARCHIVED']),
  findings: z.array(z.object({
    category: z.string(),
    description: z.string(),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
    recommendation: z.string().optional(),
  })),
  metrics: z.record(z.union([z.number(), z.string()])),
  certifiedBy: z.string().optional(),
  certifiedAt: z.date().optional(),
  submittedTo: z.string().optional(),
  submittedAt: z.date().optional(),
  documentIds: z.array(z.string()),
  retentionEndDate: z.date(),
});

// ============================================================================
// Section 9: Government Request Types
// ============================================================================

/**
 * Government request types
 */
export const GovernmentRequestTypeSchema = z.enum([
  'SUBPOENA',
  'AUDIT',
  'INVESTIGATION',
  'FOIA',
  'REGULATORY_INQUIRY',
  'COURT_ORDER',
  'OTHER',
]);
export type GovernmentRequestType = z.infer<typeof GovernmentRequestTypeSchema>;

/**
 * Government request record
 */
export interface GovernmentRequest {
  id: string;
  tenantId: string;
  requestType: GovernmentRequestType;
  requestingAgency: string;
  requestDate: Date;
  dueDate?: Date;
  description: string;
  scopeOfRequest: string;
  affectedRecords: {
    recordType: RecordType;
    recordIds?: string[];
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
  }[];
  status: 'RECEIVED' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED' | 'APPEALED';
  assignedTo: string;
  legalCounsel?: string;
  response?: {
    respondedAt: Date;
    respondedBy: string;
    documentIds: string[];
    notes: string;
  };
  createdAt: Date;
  updatedAt: Date;
  retentionEndDate: Date;
}

export const GovernmentRequestSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  requestType: GovernmentRequestTypeSchema,
  requestingAgency: z.string(),
  requestDate: z.date(),
  dueDate: z.date().optional(),
  description: z.string(),
  scopeOfRequest: z.string(),
  affectedRecords: z.array(z.object({
    recordType: RecordTypeSchema,
    recordIds: z.array(z.string()).optional(),
    dateRange: z.object({
      startDate: z.date(),
      endDate: z.date(),
    }).optional(),
  })),
  status: z.enum(['RECEIVED', 'IN_PROGRESS', 'RESPONDED', 'CLOSED', 'APPEALED']),
  assignedTo: z.string(),
  legalCounsel: z.string().optional(),
  response: z.object({
    respondedAt: z.date(),
    respondedBy: z.string(),
    documentIds: z.array(z.string()),
    notes: z.string(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  retentionEndDate: z.date(),
});

// ============================================================================
// Section 10: Policy Version Types
// ============================================================================

/**
 * Policy version for tracking changes to compliance rules
 */
export interface PolicyVersion {
  id: string;
  policyType: 'ACCRUAL' | 'RETENTION' | 'ACCESS' | 'SECURITY' | 'NOTIFICATION';
  versionNumber: string;
  effectiveDate: Date;
  expirationDate?: Date;
  isActive: boolean;
  rules: Record<string, unknown>;
  changes: {
    field: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string;
  }[];
  approvedBy: string;
  approvedAt: Date;
  createdAt: Date;
}

export const PolicyVersionSchema = z.object({
  id: z.string(),
  policyType: z.enum(['ACCRUAL', 'RETENTION', 'ACCESS', 'SECURITY', 'NOTIFICATION']),
  versionNumber: z.string(),
  effectiveDate: z.date(),
  expirationDate: z.date().optional(),
  isActive: z.boolean(),
  rules: z.record(z.unknown()),
  changes: z.array(z.object({
    field: z.string(),
    previousValue: z.unknown(),
    newValue: z.unknown(),
    reason: z.string(),
  })),
  approvedBy: z.string(),
  approvedAt: z.date(),
  createdAt: z.date(),
});

// ============================================================================
// Section 11: Deletion Safeguard Types
// ============================================================================

/**
 * Deletion request with approval workflow
 */
export interface DeletionRequest {
  id: string;
  tenantId: string;
  recordType: RecordType;
  recordId: string;
  requestedBy: string;
  requestedAt: Date;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXECUTED' | 'CANCELLED';
  retentionCheck: {
    isWithinRetention: boolean;
    retentionEndDate?: Date;
    hasLegalHold: boolean;
    canBeDeleted: boolean;
    blockedReason?: string;
  };
  approvalWorkflow: {
    requiredApprovers: string[];
    approvals: {
      approverId: string;
      approvedAt: Date;
      approved: boolean;
      notes?: string;
    }[];
    allApproved: boolean;
  };
  executedAt?: Date;
  executedBy?: string;
  auditTrail: {
    action: string;
    performedBy: string;
    performedAt: Date;
    details: string;
  }[];
}

export const DeletionRequestSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  recordType: RecordTypeSchema,
  recordId: z.string(),
  requestedBy: z.string(),
  requestedAt: z.date(),
  reason: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'DENIED', 'EXECUTED', 'CANCELLED']),
  retentionCheck: z.object({
    isWithinRetention: z.boolean(),
    retentionEndDate: z.date().optional(),
    hasLegalHold: z.boolean(),
    canBeDeleted: z.boolean(),
    blockedReason: z.string().optional(),
  }),
  approvalWorkflow: z.object({
    requiredApprovers: z.array(z.string()),
    approvals: z.array(z.object({
      approverId: z.string(),
      approvedAt: z.date(),
      approved: z.boolean(),
      notes: z.string().optional(),
    })),
    allApproved: z.boolean(),
  }),
  executedAt: z.date().optional(),
  executedBy: z.string().optional(),
  auditTrail: z.array(z.object({
    action: z.string(),
    performedBy: z.string(),
    performedAt: z.date(),
    details: z.string(),
  })),
});

// ============================================================================
// Section 12: Compliance Alert Types
// ============================================================================

/**
 * Compliance alert for system notifications
 */
export interface ComplianceAlert {
  id: string;
  tenantId: string;
  alertType: 'RETENTION_EXPIRING' | 'DELETION_BLOCKED' | 'LEGAL_HOLD' | 'BREACH_DETECTED' | 
             'COMPLIANCE_DUE' | 'AUDIT_REQUIRED' | 'POLICY_CHANGE' | 'SYSTEM_FAILURE';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  relatedRecordType?: RecordType;
  relatedRecordId?: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  isActive: boolean;
}

export const ComplianceAlertSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  alertType: z.enum([
    'RETENTION_EXPIRING',
    'DELETION_BLOCKED',
    'LEGAL_HOLD',
    'BREACH_DETECTED',
    'COMPLIANCE_DUE',
    'AUDIT_REQUIRED',
    'POLICY_CHANGE',
    'SYSTEM_FAILURE',
  ]),
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']),
  title: z.string(),
  message: z.string(),
  relatedRecordType: RecordTypeSchema.optional(),
  relatedRecordId: z.string().optional(),
  createdAt: z.date(),
  acknowledgedAt: z.date().optional(),
  acknowledgedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().optional(),
  resolution: z.string().optional(),
  isActive: z.boolean(),
});

// ============================================================================
// Section 13: Annual Certification Types
// ============================================================================

/**
 * Annual certification for ESTA compliance
 */
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

export const AnnualCertificationSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  certificationYear: z.number().int().min(2020).max(2100),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED']),
  preparedBy: z.string(),
  preparedAt: z.date(),
  certifications: z.array(z.object({
    requirement: z.string(),
    description: z.string(),
    compliant: z.boolean(),
    evidence: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })),
  certifiedBy: z.string().optional(),
  certifiedAt: z.date().optional(),
  submittedAt: z.date().optional(),
  approvedAt: z.date().optional(),
  approvedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
  documentIds: z.array(z.string()),
  dueDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// Section 14: Data Residency Validation
// ============================================================================

/**
 * Data residency configuration
 */
export interface DataResidencyConfig {
  requiredRegion: 'US';
  allowedStates: string[];
  storageLocations: {
    primary: string;
    backup: string;
  };
  lastValidated: Date;
  validatedBy: string;
  isCompliant: boolean;
}

export const DataResidencyConfigSchema = z.object({
  requiredRegion: z.literal('US'),
  allowedStates: z.array(z.string()),
  storageLocations: z.object({
    primary: z.string(),
    backup: z.string(),
  }),
  lastValidated: z.date(),
  validatedBy: z.string(),
  isCompliant: z.boolean(),
});
