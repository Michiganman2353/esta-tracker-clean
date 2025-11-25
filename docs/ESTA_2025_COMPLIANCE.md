# ESTA 2025 Record-Keeping Compliance Documentation

## Overview

This document provides comprehensive documentation for the ESTA 2025 Record-Keeping Compliance system implemented in the ESTA Tracker application. The system ensures full compliance with Michigan's Employee Earned Sick Time Act (ESTA) 2025 regulations for record-keeping, data retention, security, and reporting.

## Table of Contents

1. [Compliance Summary](#compliance-summary)
2. [Retention System](#section-1-retention-system)
3. [Data Security](#section-2-data-security-compliance)
4. [Documentation Requirements](#section-3-documentation-requirements)
5. [Compliance Reporting](#section-4-compliance-reporting-infrastructure)
6. [Penalty Mitigation](#section-5-penalty-mitigation-controls)
7. [API Reference](#api-reference)
8. [Gap Analysis](#gap-analysis)

---

## Compliance Summary

The ESTA Tracker application implements the following compliance features:

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Data Retention Policy | ✅ Implemented | 7/5/3-year retention based on status |
| AES-256 Encryption | ✅ Implemented | KMS-backed hybrid encryption |
| Immutable Audit Logs | ✅ Implemented | Blockchain-style hash chain |
| Access Logging | ✅ Implemented | Full access trail with US residency |
| US Data Residency | ✅ Implemented | US-only GCP regions |
| Breach Notification | ✅ Implemented | Automated workflow |
| Deletion Safeguards | ✅ Implemented | Multi-approval workflow |
| Legal Hold Capability | ✅ Implemented | Full hold management |
| Annual Certification | ✅ Implemented | Complete workflow |

---

## Section 1: Retention System

### Retention Periods (Years)

| Record Type | Retention Period | Basis |
|-------------|-----------------|-------|
| Approved Applications | 7 years | ESTA 2025 §7(a) |
| Denied Applications | 5 years | ESTA 2025 §7(b) |
| Withdrawn Applications | 3 years | ESTA 2025 §7(c) |
| Cancelled Applications | 3 years | ESTA 2025 §7(c) |
| Payment Records | 7 years | Financial compliance |
| Audit Logs | 7 years | Immutable |
| Communications | 5 years | Documentation |
| Policy Versions | 10 years | Legal preservation |
| Government Requests | 10 years | Legal compliance |

### Retention Metadata

Each record is tagged with comprehensive retention metadata:

```typescript
interface RetentionMetadata {
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
  isArchived: boolean;
}
```

### Automated Retention Enforcement

The system automatically:
- Calculates retention end dates based on record type and status
- Locks records during retention period
- Prevents deletion of locked or held records
- Generates alerts for expiring records
- Supports legal hold placement/release

---

## Section 2: Data Security Compliance

### Encryption at Rest (AES-256)

All sensitive data is encrypted using AES-256-GCM with Google Cloud KMS:

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Management**: Google Cloud KMS with automatic rotation
- **Key Size**: 256-bit AES keys wrapped with 4096-bit RSA
- **Integrity**: Authentication tags verify data integrity

```typescript
// Encryption verification
function verifyAES256Encryption(algorithm: string): boolean {
  const aes256Algorithms = [
    'aes-256-gcm',
    'aes-256-cbc',
    'RSA_DECRYPT_OAEP_4096_SHA256',
  ];
  return aes256Algorithms.includes(algorithm);
}
```

### Access Logging

Every data access is logged with:
- User identification
- Timestamp
- Resource accessed
- Access type (READ/WRITE/DELETE/DOWNLOAD/EXPORT)
- Success/failure status
- IP address and user agent
- Geographic location
- Data residency confirmation

### US-Only Data Residency

All data is stored exclusively in US data centers:

```typescript
const US_REGIONS = [
  'us-central1',
  'us-east1',
  'us-east4',
  'us-west1',
  'us-west2',
  'us-west3',
  'us-west4',
  'us-south1',
];
```

### Breach Notification Workflow

Automated breach detection and notification system:

1. **Detection**: System monitors for security anomalies
2. **Assessment**: Severity classification (LOW/MEDIUM/HIGH/CRITICAL)
3. **Containment**: Automated and manual containment actions
4. **Notification**: Multi-channel notifications (EMAIL/SMS/MAIL/PORTAL)
5. **Resolution**: Documented resolution and lessons learned

---

## Section 3: Documentation Requirements

### Document Versioning

All documents maintain version history:

```typescript
interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  checksum: string;
  createdAt: Date;
  createdBy: string;
  changeDescription?: string;
  isCurrentVersion: boolean;
  isImmutable: boolean;
}
```

### Justification Logging

All decisions require documented justification:

```typescript
interface JustificationLog {
  decisionType: 'REQUEST_APPROVAL' | 'REQUEST_DENIAL' | 
                'POLICY_CHANGE' | 'EXCEPTION_GRANT' | 'DATA_DELETION';
  decision: string;
  justification: string;  // Minimum 10 characters
  supportingDocuments?: string[];
  decidedBy: string;
  decidedAt: Date;
  isAppealed: boolean;
}
```

### Communications Archiving

All communications are archived with:
- Type (EMAIL/SMS/IN_APP/DOCUMENT/SYSTEM)
- Direction (INBOUND/OUTBOUND/INTERNAL)
- Encrypted content
- Sender and recipient information
- Related record references
- Attachments
- 5-year retention

---

## Section 4: Compliance Reporting Infrastructure

### Report Types

| Report | Purpose | Frequency |
|--------|---------|-----------|
| Retention Audit | Review retention compliance | Quarterly |
| Access Audit | Review data access patterns | Monthly |
| Security Audit | Security event analysis | Monthly |
| Breach Summary | Breach incident report | As needed |
| Policy Compliance | Policy adherence review | Annually |
| Annual Certification | ESTA compliance certification | Annually |

### Annual Certification Requirements

The system enforces these certification requirements:

1. **Data Retention Policy** - Records maintained for required periods
2. **Encryption at Rest** - AES-256 encryption verified
3. **Access Controls** - RBAC implemented and enforced
4. **Audit Logging** - Immutable audit trail maintained
5. **US Data Residency** - All data in US data centers
6. **Breach Notification** - Automated workflow active
7. **Employee Access** - Employees can view their records
8. **Request Documentation** - All requests documented
9. **Legal Hold Capability** - Hold management available
10. **Deletion Safeguards** - Multi-approval workflow active

### Government Request Logging

All government requests are tracked:

```typescript
interface GovernmentRequest {
  requestType: 'SUBPOENA' | 'AUDIT' | 'INVESTIGATION' | 
               'FOIA' | 'REGULATORY_INQUIRY' | 'COURT_ORDER';
  requestingAgency: string;
  scopeOfRequest: string;
  status: 'RECEIVED' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED';
  // 10-year retention
}
```

---

## Section 5: Penalty Mitigation Controls

### Deletion Safeguards

Multi-step deletion workflow:

1. **Request Submission** - User submits deletion request with reason
2. **Retention Check** - System verifies retention period compliance
3. **Legal Hold Check** - System checks for active legal holds
4. **Approval Workflow** - Required approvers must approve
5. **Audit Trail** - All actions logged to immutable audit
6. **Execution** - Deletion only after all checks pass

```typescript
interface DeletionRequest {
  retentionCheck: {
    isWithinRetention: boolean;
    retentionEndDate?: Date;
    hasLegalHold: boolean;
    canBeDeleted: boolean;
    blockedReason?: string;
  };
  approvalWorkflow: {
    requiredApprovers: string[];
    approvals: { approverId: string; approved: boolean; }[];
    allApproved: boolean;
  };
}
```

### Compliance Alerts

The system generates alerts for:
- `RETENTION_EXPIRING` - Records approaching retention end
- `DELETION_BLOCKED` - Attempted deletion prevented
- `LEGAL_HOLD` - Legal hold placed or released
- `BREACH_DETECTED` - Security breach detected
- `COMPLIANCE_DUE` - Certification deadlines
- `AUDIT_REQUIRED` - Scheduled audit due
- `POLICY_CHANGE` - Policy modifications
- `SYSTEM_FAILURE` - System errors

### Immutable Audit Chain

Audit entries use blockchain-style integrity:

```typescript
interface ImmutableAuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  integrityHash: string;      // SHA-256 hash of entry
  previousEntryHash?: string;  // Links to previous entry
  sequenceNumber: number;      // Ordering
  isVerified: boolean;
  dataResidency: 'US';
}
```

---

## API Reference

### Base URL

```
/api/v1/compliance
```

### Endpoints

#### Retention Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/retention/config` | Get retention period configuration |
| POST | `/retention/metadata` | Create retention metadata |
| POST | `/retention/check-delete` | Check deletion eligibility |

#### Legal Hold

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/legal-hold/place` | Place legal hold on record |
| POST | `/legal-hold/release` | Release legal hold |

#### Deletion Workflow

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/deletion/request` | Create deletion request |
| POST | `/deletion/approve` | Process approval |

#### Compliance Reporting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/certification/requirements` | Get certification requirements |
| POST | `/certification/create` | Create annual certification |
| POST | `/reports/retention` | Generate retention audit report |
| POST | `/gap-analysis` | Perform compliance gap analysis |

#### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/alerts/create` | Create compliance alert |
| POST | `/alerts/acknowledge` | Acknowledge alert |
| POST | `/alerts/resolve` | Resolve alert |

#### Validation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/validate/data-residency` | Validate US residency |
| POST | `/validate/encryption` | Verify AES-256 encryption |
| GET | `/status` | Get compliance status summary |

---

## Gap Analysis

The system includes automated gap analysis:

```typescript
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

// Returns:
{
  overallCompliance: 100,  // 0-100 percentage
  gaps: [],                 // Array of identified gaps
  strengths: []             // Array of compliant areas
}
```

### Gap Severity Levels

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| CRITICAL | Security or legal violation | Immediate remediation |
| HIGH | Significant compliance risk | Remediation within 30 days |
| MEDIUM | Moderate compliance concern | Remediation within 90 days |
| LOW | Minor improvement opportunity | Address as resources allow |

---

## Files Reference

### Types

- `libs/shared-types/src/compliance.ts` - All compliance type definitions

### Services

- `apps/backend/src/services/complianceService.ts` - Core compliance logic
- `apps/backend/src/services/complianceReportingService.ts` - Reporting infrastructure

### Routes

- `apps/backend/src/routes/compliance.ts` - REST API endpoints

### Tests

- `apps/backend/src/services/__tests__/complianceService.test.ts`
- `apps/backend/src/services/__tests__/complianceReportingService.test.ts`

---

## Conclusion

The ESTA Tracker application implements comprehensive compliance with Michigan's ESTA 2025 Record-Keeping Regulations. All required features are implemented, tested, and documented. The system provides:

- ✅ Full retention policy enforcement (7/5/3-year periods)
- ✅ AES-256 encryption with KMS key management
- ✅ Immutable blockchain-style audit logging
- ✅ Complete access logging with US residency
- ✅ Automated breach notification workflow
- ✅ Multi-step deletion safeguards
- ✅ Legal hold management
- ✅ Annual certification workflow
- ✅ Comprehensive compliance reporting
- ✅ Automated gap analysis

For questions or compliance concerns, contact the ESTA Tracker compliance team.
