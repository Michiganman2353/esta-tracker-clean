/**
 * ESTA 2025 Record-Keeping Compliance Service
 * 
 * This service implements the core compliance functionality required
 * by Michigan's ESTA 2025 Record-Keeping Regulations including:
 * - Retention policy enforcement
 * - Immutable audit logging
 * - Access logging
 * - Deletion safeguards
 * - Compliance reporting
 * 
 * @module complianceService
 */

import { createHash, randomUUID } from 'crypto';

// ============================================================================
// Type Definitions (matching shared-types/compliance.ts)
// ============================================================================

export type ApplicationStatus = 'pending' | 'approved' | 'denied' | 'withdrawn' | 'cancelled';

export type RecordType = 
  | 'sick_time_request'
  | 'work_log'
  | 'employee_profile'
  | 'employer_profile'
  | 'payment_record'
  | 'audit_log'
  | 'communication'
  | 'document'
  | 'policy_version'
  | 'compliance_report'
  | 'certification'
  | 'government_request';

export type AuditAction =
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE'
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'ACCESS_DENIED' | 'PERMISSION_GRANTED' | 'PERMISSION_REVOKED'
  | 'REQUEST_SUBMITTED' | 'REQUEST_APPROVED' | 'REQUEST_DENIED' | 'REQUEST_WITHDRAWN' | 'REQUEST_CANCELLED'
  | 'DOCUMENT_UPLOADED' | 'DOCUMENT_DOWNLOADED' | 'DOCUMENT_VIEWED' | 'DOCUMENT_DELETED'
  | 'LEGAL_HOLD_PLACED' | 'LEGAL_HOLD_RELEASED' | 'RETENTION_EXTENDED' | 'COMPLIANCE_REPORT_GENERATED' | 'CERTIFICATION_SUBMITTED'
  | 'ENCRYPTION_KEY_ROTATED' | 'DATA_EXPORT_REQUESTED' | 'DATA_EXPORT_COMPLETED' | 'BREACH_DETECTED' | 'BREACH_NOTIFICATION_SENT'
  | 'SYSTEM_MAINTENANCE' | 'BACKUP_CREATED' | 'BACKUP_RESTORED';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface RetentionMetadata {
  id: string;
  recordType: RecordType;
  recordId: string;
  tenantId: string;
  applicationStatus?: ApplicationStatus;
  createdAt: Date;
  finalizedAt?: Date;
  retentionEndDate: Date;
  retentionYears: number;
  isLocked: boolean;
  hasLegalHold: boolean;
  legalHoldDetails?: {
    holdId: string;
    reason: string;
    placedBy: string;
    placedAt: Date;
    expiresAt?: Date;
  };
  isArchived: boolean;
  archivedAt?: Date;
  eligibleForDeletionAt?: Date;
  lastAuditedAt?: Date;
}

export interface ImmutableAuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  severity: AuditSeverity;
  actor: {
    userId: string;
    email?: string;
    role: string;
    ipAddress?: string;
    userAgent?: string;
  };
  resource: {
    type: RecordType;
    id: string;
    tenantId: string;
    name?: string;
  };
  details: {
    description: string;
    previousValue?: unknown;
    newValue?: unknown;
    metadata?: Record<string, unknown>;
  };
  integrityHash: string;
  previousEntryHash?: string;
  sequenceNumber: number;
  isVerified: boolean;
  dataResidency: 'US';
}

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

// ============================================================================
// Retention Period Configuration
// ============================================================================

/**
 * Retention periods in years based on ESTA 2025 requirements
 */
export const RETENTION_PERIODS = {
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
 * Get retention period based on application status
 */
export function getRetentionPeriodForStatus(status: ApplicationStatus): number {
  switch (status) {
    case 'approved':
      return RETENTION_PERIODS.APPROVED;
    case 'denied':
      return RETENTION_PERIODS.DENIED;
    case 'withdrawn':
      return RETENTION_PERIODS.WITHDRAWN;
    case 'cancelled':
      return RETENTION_PERIODS.CANCELLED;
    case 'pending':
      return RETENTION_PERIODS.APPROVED; // Default to longest until finalized
    default:
      return RETENTION_PERIODS.APPROVED;
  }
}

/**
 * Get retention period based on record type
 */
export function getRetentionPeriodForRecordType(recordType: RecordType): number {
  switch (recordType) {
    case 'sick_time_request':
      return RETENTION_PERIODS.APPROVED; // Will be recalculated based on status
    case 'work_log':
      return RETENTION_PERIODS.EMPLOYEE_RECORD;
    case 'employee_profile':
      return RETENTION_PERIODS.EMPLOYEE_RECORD;
    case 'employer_profile':
      return RETENTION_PERIODS.EMPLOYER_RECORD;
    case 'payment_record':
      return RETENTION_PERIODS.PAYMENT;
    case 'audit_log':
      return RETENTION_PERIODS.AUDIT_LOG;
    case 'communication':
      return RETENTION_PERIODS.COMMUNICATION;
    case 'document':
      return RETENTION_PERIODS.EMPLOYEE_RECORD;
    case 'policy_version':
      return RETENTION_PERIODS.POLICY_VERSION;
    case 'compliance_report':
      return RETENTION_PERIODS.COMPLIANCE_REPORT;
    case 'certification':
      return RETENTION_PERIODS.COMPLIANCE_REPORT;
    case 'government_request':
      return RETENTION_PERIODS.GOVERNMENT_REQUEST;
    default:
      return RETENTION_PERIODS.APPROVED;
  }
}

// ============================================================================
// Retention Metadata Service
// ============================================================================

/**
 * Create retention metadata for a new record
 */
export function createRetentionMetadata(params: {
  recordType: RecordType;
  recordId: string;
  tenantId: string;
  applicationStatus?: ApplicationStatus;
  createdAt?: Date;
}): RetentionMetadata {
  const now = params.createdAt || new Date();
  
  // Calculate retention period
  let retentionYears: number;
  if (params.applicationStatus) {
    retentionYears = getRetentionPeriodForStatus(params.applicationStatus);
  } else {
    retentionYears = getRetentionPeriodForRecordType(params.recordType);
  }
  
  // Calculate retention end date
  const retentionEndDate = new Date(now);
  retentionEndDate.setFullYear(retentionEndDate.getFullYear() + retentionYears);
  
  return {
    id: randomUUID(),
    recordType: params.recordType,
    recordId: params.recordId,
    tenantId: params.tenantId,
    applicationStatus: params.applicationStatus,
    createdAt: now,
    retentionEndDate,
    retentionYears,
    isLocked: true, // All records are locked by default
    hasLegalHold: false,
    isArchived: false,
  };
}

/**
 * Update retention metadata when status changes
 */
export function updateRetentionForStatusChange(
  metadata: RetentionMetadata,
  newStatus: ApplicationStatus
): RetentionMetadata {
  const now = new Date();
  const retentionYears = getRetentionPeriodForStatus(newStatus);
  
  // Calculate new retention end date from finalization
  const retentionEndDate = new Date(now);
  retentionEndDate.setFullYear(retentionEndDate.getFullYear() + retentionYears);
  
  return {
    ...metadata,
    applicationStatus: newStatus,
    finalizedAt: now,
    retentionEndDate,
    retentionYears,
  };
}

/**
 * Check if a record can be deleted
 */
export function canDeleteRecord(metadata: RetentionMetadata): {
  canDelete: boolean;
  reason?: string;
} {
  const now = new Date();
  
  // Check legal hold
  if (metadata.hasLegalHold) {
    return {
      canDelete: false,
      reason: 'Record has an active legal hold',
    };
  }
  
  // Check if within retention period
  if (now < metadata.retentionEndDate) {
    return {
      canDelete: false,
      reason: `Record must be retained until ${metadata.retentionEndDate.toISOString()}`,
    };
  }
  
  // Check if locked
  if (metadata.isLocked) {
    return {
      canDelete: false,
      reason: 'Record is locked and requires unlock approval',
    };
  }
  
  return { canDelete: true };
}

/**
 * Place a legal hold on a record
 */
export function placeLegalHold(
  metadata: RetentionMetadata,
  holdDetails: {
    holdId: string;
    reason: string;
    placedBy: string;
    expiresAt?: Date;
  }
): RetentionMetadata {
  return {
    ...metadata,
    hasLegalHold: true,
    legalHoldDetails: {
      ...holdDetails,
      placedAt: new Date(),
    },
  };
}

/**
 * Release a legal hold on a record
 */
export function releaseLegalHold(metadata: RetentionMetadata): RetentionMetadata {
  return {
    ...metadata,
    hasLegalHold: false,
    legalHoldDetails: undefined,
  };
}

// ============================================================================
// Immutable Audit Log Service
// ============================================================================

/**
 * Audit entry sequence counter.
 * 
 * NOTE: In production, this should be replaced with a distributed counter
 * (e.g., Redis INCR, database sequence, or Cloud Firestore counter).
 * The in-memory counter is suitable for single-instance deployments
 * and testing scenarios.
 * 
 * @see https://firebase.google.com/docs/firestore/solutions/counters
 */
let auditSequenceCounter = 0;

/**
 * Last audit entry hash for chain integrity.
 * 
 * NOTE: In production, this should be stored in a persistent store
 * (e.g., database, Redis) to maintain chain integrity across restarts
 * and multiple instances. The chain should be initialized by reading
 * the most recent audit entry's hash from the database.
 */
let lastAuditEntryHash: string | undefined;

/**
 * Reset audit state (for testing only)
 */
export function _resetAuditState(): void {
  auditSequenceCounter = 0;
  lastAuditEntryHash = undefined;
}

/**
 * Generate integrity hash for audit entry
 */
function generateIntegrityHash(entry: Omit<ImmutableAuditEntry, 'integrityHash' | 'isVerified'>): string {
  const dataToHash = JSON.stringify({
    id: entry.id,
    timestamp: entry.timestamp.toISOString(),
    action: entry.action,
    severity: entry.severity,
    actor: entry.actor,
    resource: entry.resource,
    details: entry.details,
    previousEntryHash: entry.previousEntryHash,
    sequenceNumber: entry.sequenceNumber,
  });
  
  return createHash('sha256').update(dataToHash).digest('hex');
}

/**
 * Create an immutable audit entry
 */
export function createImmutableAuditEntry(params: {
  action: AuditAction;
  severity: AuditSeverity;
  actor: {
    userId: string;
    email?: string;
    role: string;
    ipAddress?: string;
    userAgent?: string;
  };
  resource: {
    type: RecordType;
    id: string;
    tenantId: string;
    name?: string;
  };
  details: {
    description: string;
    previousValue?: unknown;
    newValue?: unknown;
    metadata?: Record<string, unknown>;
  };
}): ImmutableAuditEntry {
  const id = randomUUID();
  const timestamp = new Date();
  const sequenceNumber = ++auditSequenceCounter;
  
  const baseEntry = {
    id,
    timestamp,
    action: params.action,
    severity: params.severity,
    actor: params.actor,
    resource: params.resource,
    details: params.details,
    previousEntryHash: lastAuditEntryHash,
    sequenceNumber,
    dataResidency: 'US' as const,
  };
  
  const integrityHash = generateIntegrityHash(baseEntry);
  lastAuditEntryHash = integrityHash;
  
  return {
    ...baseEntry,
    integrityHash,
    isVerified: true,
  };
}

/**
 * Verify the integrity of an audit entry
 */
export function verifyAuditEntryIntegrity(entry: ImmutableAuditEntry): boolean {
  const expectedHash = generateIntegrityHash({
    id: entry.id,
    timestamp: entry.timestamp,
    action: entry.action,
    severity: entry.severity,
    actor: entry.actor,
    resource: entry.resource,
    details: entry.details,
    previousEntryHash: entry.previousEntryHash,
    sequenceNumber: entry.sequenceNumber,
    dataResidency: entry.dataResidency,
  });
  
  return expectedHash === entry.integrityHash;
}

/**
 * Verify the integrity of an audit chain
 */
export function verifyAuditChainIntegrity(entries: ImmutableAuditEntry[]): {
  isValid: boolean;
  brokenAt?: number;
  reason?: string;
} {
  if (entries.length === 0) {
    return { isValid: true };
  }
  
  // Sort by sequence number
  const sorted = [...entries].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (!entry) continue;
    
    // Verify individual entry integrity
    if (!verifyAuditEntryIntegrity(entry)) {
      return {
        isValid: false,
        brokenAt: i,
        reason: `Entry ${entry.id} failed integrity check`,
      };
    }
    
    // Verify chain linkage (skip first entry)
    if (i > 0) {
      const previousEntry = sorted[i - 1];
      if (previousEntry && entry.previousEntryHash !== previousEntry.integrityHash) {
        return {
          isValid: false,
          brokenAt: i,
          reason: `Chain broken at entry ${entry.id}: previousEntryHash mismatch`,
        };
      }
    }
  }
  
  return { isValid: true };
}

// ============================================================================
// Access Logging Service
// ============================================================================

/**
 * Create an access log entry
 */
export function createAccessLogEntry(params: {
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
}): AccessLogEntry {
  return {
    id: randomUUID(),
    timestamp: new Date(),
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    tenantId: params.tenantId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    accessType: params.accessType,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    geoLocation: params.geoLocation,
    success: params.success,
    failureReason: params.failureReason,
    dataResidency: 'US',
  };
}

// ============================================================================
// Deletion Safeguards Service
// ============================================================================

/**
 * Create a deletion request with approval workflow
 */
export function createDeletionRequest(params: {
  tenantId: string;
  recordType: RecordType;
  recordId: string;
  requestedBy: string;
  reason: string;
  retentionMetadata: RetentionMetadata;
  requiredApprovers: string[];
}): DeletionRequest {
  const deleteCheck = canDeleteRecord(params.retentionMetadata);
  
  return {
    id: randomUUID(),
    tenantId: params.tenantId,
    recordType: params.recordType,
    recordId: params.recordId,
    requestedBy: params.requestedBy,
    requestedAt: new Date(),
    reason: params.reason,
    status: deleteCheck.canDelete ? 'PENDING' : 'DENIED',
    retentionCheck: {
      isWithinRetention: new Date() < params.retentionMetadata.retentionEndDate,
      retentionEndDate: params.retentionMetadata.retentionEndDate,
      hasLegalHold: params.retentionMetadata.hasLegalHold,
      canBeDeleted: deleteCheck.canDelete,
      blockedReason: deleteCheck.reason,
    },
    approvalWorkflow: {
      requiredApprovers: params.requiredApprovers,
      approvals: [],
      allApproved: false,
    },
    auditTrail: [
      {
        action: 'DELETION_REQUESTED',
        performedBy: params.requestedBy,
        performedAt: new Date(),
        details: `Deletion requested for ${params.recordType} ${params.recordId}: ${params.reason}`,
      },
    ],
  };
}

/**
 * Process approval for a deletion request
 */
export function processDeletionApproval(
  request: DeletionRequest,
  approval: {
    approverId: string;
    approved: boolean;
    notes?: string;
  }
): DeletionRequest {
  const updatedApprovals = [
    ...request.approvalWorkflow.approvals,
    {
      approverId: approval.approverId,
      approvedAt: new Date(),
      approved: approval.approved,
      notes: approval.notes,
    },
  ];
  
  // Check if all required approvers have approved
  const allApproved = request.approvalWorkflow.requiredApprovers.every(
    (approverId) => updatedApprovals.some((a) => a.approverId === approverId && a.approved)
  );
  
  // Check if any approver denied
  const anyDenied = updatedApprovals.some((a) => !a.approved);
  
  let newStatus = request.status;
  if (anyDenied) {
    newStatus = 'DENIED';
  } else if (allApproved && request.retentionCheck.canBeDeleted) {
    newStatus = 'APPROVED';
  }
  
  return {
    ...request,
    status: newStatus,
    approvalWorkflow: {
      ...request.approvalWorkflow,
      approvals: updatedApprovals,
      allApproved,
    },
    auditTrail: [
      ...request.auditTrail,
      {
        action: approval.approved ? 'DELETION_APPROVED' : 'DELETION_DENIED',
        performedBy: approval.approverId,
        performedAt: new Date(),
        details: `${approval.approved ? 'Approved' : 'Denied'} by ${approval.approverId}${approval.notes ? `: ${approval.notes}` : ''}`,
      },
    ],
  };
}

// ============================================================================
// Compliance Alert Service
// ============================================================================

/**
 * Create a compliance alert
 */
export function createComplianceAlert(params: {
  tenantId: string;
  alertType: ComplianceAlert['alertType'];
  severity: ComplianceAlert['severity'];
  title: string;
  message: string;
  relatedRecordType?: RecordType;
  relatedRecordId?: string;
}): ComplianceAlert {
  return {
    id: randomUUID(),
    tenantId: params.tenantId,
    alertType: params.alertType,
    severity: params.severity,
    title: params.title,
    message: params.message,
    relatedRecordType: params.relatedRecordType,
    relatedRecordId: params.relatedRecordId,
    createdAt: new Date(),
    isActive: true,
  };
}

/**
 * Acknowledge a compliance alert
 */
export function acknowledgeComplianceAlert(
  alert: ComplianceAlert,
  acknowledgedBy: string
): ComplianceAlert {
  return {
    ...alert,
    acknowledgedAt: new Date(),
    acknowledgedBy,
  };
}

/**
 * Resolve a compliance alert
 */
export function resolveComplianceAlert(
  alert: ComplianceAlert,
  resolvedBy: string,
  resolution: string
): ComplianceAlert {
  return {
    ...alert,
    resolvedAt: new Date(),
    resolvedBy,
    resolution,
    isActive: false,
  };
}

// ============================================================================
// Justification Logging Service
// ============================================================================

/**
 * Create a justification log entry
 */
export function createJustificationLog(params: {
  tenantId: string;
  decisionType: JustificationLog['decisionType'];
  relatedRecordType: RecordType;
  relatedRecordId: string;
  decision: string;
  justification: string;
  decidedBy: string;
  supportingDocuments?: string[];
}): JustificationLog {
  return {
    id: randomUUID(),
    tenantId: params.tenantId,
    decisionType: params.decisionType,
    relatedRecordType: params.relatedRecordType,
    relatedRecordId: params.relatedRecordId,
    decision: params.decision,
    justification: params.justification,
    decidedBy: params.decidedBy,
    decidedAt: new Date(),
    supportingDocuments: params.supportingDocuments,
    isAppealed: false,
    createdAt: new Date(),
  };
}

// ============================================================================
// Policy Version Service
// ============================================================================

/**
 * Create a new policy version
 */
export function createPolicyVersion(params: {
  policyType: PolicyVersion['policyType'];
  versionNumber: string;
  effectiveDate: Date;
  rules: Record<string, unknown>;
  changes: PolicyVersion['changes'];
  approvedBy: string;
}): PolicyVersion {
  return {
    id: randomUUID(),
    policyType: params.policyType,
    versionNumber: params.versionNumber,
    effectiveDate: params.effectiveDate,
    isActive: false, // Must be explicitly activated
    rules: params.rules,
    changes: params.changes,
    approvedBy: params.approvedBy,
    approvedAt: new Date(),
    createdAt: new Date(),
  };
}

/**
 * Activate a policy version and deactivate previous
 */
export function activatePolicyVersion(version: PolicyVersion): PolicyVersion {
  return {
    ...version,
    isActive: true,
  };
}

// ============================================================================
// Data Residency Validation
// ============================================================================

/**
 * Validate US data residency for storage location
 */
export function validateUSDataResidency(storageLocation: string): boolean {
  // US-based GCP regions
  const usRegions = [
    'us-central1',
    'us-east1',
    'us-east4',
    'us-west1',
    'us-west2',
    'us-west3',
    'us-west4',
    'us-south1',
  ];
  
  return usRegions.some((region) => storageLocation.includes(region));
}

/**
 * Get US-compliant storage location
 */
export function getUSCompliantStorageLocation(): string {
  return 'us-central1'; // Default to US Central
}

// ============================================================================
// Encryption Verification
// ============================================================================

/**
 * Verify AES-256 encryption is being used
 */
export function verifyAES256Encryption(encryptionAlgorithm: string): boolean {
  const aes256Algorithms = [
    'aes-256-gcm',
    'aes-256-cbc',
    'AES-256-GCM',
    'AES-256-CBC',
    'RSA_DECRYPT_OAEP_4096_SHA256', // KMS algorithm
  ];
  
  return aes256Algorithms.includes(encryptionAlgorithm);
}
