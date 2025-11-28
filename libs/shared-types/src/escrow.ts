/**
 * Quantum-Resistant Multi-Sig Escrow Types
 *
 * Type definitions for dispute-proof medical notes system implementing:
 * - Kyber768 post-quantum encryption (NIST standard)
 * - 2-of-2 threshold secret sharing (Shamir's scheme)
 * - BLS aggregate signatures for multi-party signing
 * - KMS-backed escrow until PTO approval
 *
 * @module escrow
 */

import { z } from 'zod';

// ============================================================================
// Section 1: Kyber768 Post-Quantum Encryption Types
// ============================================================================

/**
 * Kyber768 public key for post-quantum encryption
 * Kyber768 is NIST's selected standard for post-quantum key encapsulation
 */
export interface Kyber768PublicKey {
  /** Base64-encoded public key bytes (1184 bytes when decoded) */
  publicKey: string;
  /** Key identifier for tracking */
  keyId: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Key algorithm identifier */
  algorithm: 'KYBER768';
}

/**
 * Kyber768 private key (should never leave secure environment)
 */
export interface Kyber768PrivateKey {
  /** Base64-encoded private key bytes (2400 bytes when decoded) */
  privateKey: string;
  /** Key identifier for tracking */
  keyId: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Key algorithm identifier */
  algorithm: 'KYBER768';
}

/**
 * Kyber768 key pair
 */
export interface Kyber768KeyPair {
  publicKey: Kyber768PublicKey;
  privateKey: Kyber768PrivateKey;
}

/**
 * Kyber768 encapsulation result (ciphertext + shared secret)
 */
export interface Kyber768Encapsulation {
  /** Base64-encoded ciphertext (1088 bytes when decoded) */
  ciphertext: string;
  /** Base64-encoded shared secret (32 bytes when decoded) */
  sharedSecret: string;
}

/**
 * Quantum-safe encrypted data envelope
 */
export interface QuantumSafeEnvelope {
  /** Unique envelope identifier */
  id: string;
  /** Kyber768 ciphertext for key encapsulation */
  kyberCiphertext: string;
  /** AES-256-GCM encrypted data */
  encryptedData: string;
  /** Initialization vector for AES */
  iv: string;
  /** Authentication tag for AES-GCM */
  authTag: string;
  /** Key ID used for encryption */
  keyId: string;
  /** Encryption timestamp */
  encryptedAt: Date;
  /** Algorithm version for future-proofing */
  algorithmVersion: string;
}

export const QuantumSafeEnvelopeSchema = z.object({
  id: z.string(),
  kyberCiphertext: z.string(),
  encryptedData: z.string(),
  iv: z.string(),
  authTag: z.string(),
  keyId: z.string(),
  encryptedAt: z.date(),
  algorithmVersion: z.string(),
});

// ============================================================================
// Section 2: Threshold Secret Sharing Types
// ============================================================================

/**
 * Individual secret share from Shamir's Secret Sharing scheme
 */
export interface SecretShare {
  /** Share index (1-based) */
  index: number;
  /** Base64-encoded share value */
  value: string;
  /** Share holder identifier */
  holderId: string;
  /** Holder type */
  holderType: 'EMPLOYEE' | 'EMPLOYER';
  /** Creation timestamp */
  createdAt: Date;
}

export const SecretShareSchema = z.object({
  index: z.number().int().min(1),
  value: z.string(),
  holderId: z.string(),
  holderType: z.enum(['EMPLOYEE', 'EMPLOYER']),
  createdAt: z.date(),
});

/**
 * Secret sharing configuration
 */
export interface SecretSharingConfig {
  /** Total number of shares */
  totalShares: number;
  /** Threshold required to reconstruct */
  threshold: number;
  /** Share distribution */
  shares: SecretShare[];
}

export const SecretSharingConfigSchema = z.object({
  totalShares: z.number().int().min(2),
  threshold: z.number().int().min(2),
  shares: z.array(SecretShareSchema),
});

// ============================================================================
// Section 3: BLS Aggregate Signature Types
// ============================================================================

/**
 * BLS public key for aggregate signatures
 */
export interface BLSPublicKey {
  /** Base64-encoded BLS public key */
  publicKey: string;
  /** Key identifier */
  keyId: string;
  /** Owner identifier */
  ownerId: string;
  /** Owner type */
  ownerType: 'EMPLOYEE' | 'EMPLOYER';
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * BLS private key (should never leave secure environment)
 */
export interface BLSPrivateKey {
  /** Base64-encoded BLS private key */
  privateKey: string;
  /** Key identifier */
  keyId: string;
  /** Owner identifier */
  ownerId: string;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Individual BLS signature
 */
export interface BLSSignature {
  /** Base64-encoded signature */
  signature: string;
  /** Signer identifier */
  signerId: string;
  /** Signer type */
  signerType: 'EMPLOYEE' | 'EMPLOYER';
  /** Message hash that was signed */
  messageHash: string;
  /** Signing timestamp */
  signedAt: Date;
}

export const BLSSignatureSchema = z.object({
  signature: z.string(),
  signerId: z.string(),
  signerType: z.enum(['EMPLOYEE', 'EMPLOYER']),
  messageHash: z.string(),
  signedAt: z.date(),
});

/**
 * Aggregated BLS signature from multiple signers
 */
export interface AggregatedBLSSignature {
  /** Base64-encoded aggregated signature */
  aggregateSignature: string;
  /** Individual signatures included */
  individualSignatures: BLSSignature[];
  /** Message hash that was signed */
  messageHash: string;
  /** Aggregation timestamp */
  aggregatedAt: Date;
  /** Verification status */
  isVerified: boolean;
}

export const AggregatedBLSSignatureSchema = z.object({
  aggregateSignature: z.string(),
  individualSignatures: z.array(BLSSignatureSchema),
  messageHash: z.string(),
  aggregatedAt: z.date(),
  isVerified: z.boolean(),
});

// ============================================================================
// Section 4: Medical Note Escrow Types
// ============================================================================

/**
 * Document type for escrowed medical notes
 */
export const MedicalDocumentTypeSchema = z.enum([
  'FMLA_CERTIFICATION',
  'DOCTORS_NOTE',
  'ACCOMMODATION_REQUEST',
  'DISABILITY_DOCUMENTATION',
  'MEDICAL_LEAVE_REQUEST',
  'RETURN_TO_WORK_CLEARANCE',
  'OTHER_MEDICAL',
]);
export type MedicalDocumentType = z.infer<typeof MedicalDocumentTypeSchema>;

/**
 * Escrow status tracking
 */
export const EscrowStatusSchema = z.enum([
  'CREATED',
  'PENDING_EMPLOYEE_SIGNATURE',
  'PENDING_EMPLOYER_SIGNATURE',
  'FULLY_SIGNED',
  'ESCROWED',
  'RELEASED',
  'RECONSTRUCTED',
  'DISPUTED',
  'EXPIRED',
]);
export type EscrowStatus = z.infer<typeof EscrowStatusSchema>;

/**
 * Zero-knowledge commitment for document verification
 */
export interface ZeroKnowledgeCommitment {
  /** Commitment hash */
  commitment: string;
  /** Timestamp of commitment */
  committedAt: Date;
  /** Blinding factor (for verification, stored securely) */
  blindingFactor?: string;
}

export const ZeroKnowledgeCommitmentSchema = z.object({
  commitment: z.string(),
  committedAt: z.date(),
  blindingFactor: z.string().optional(),
});

/**
 * Medical Note Escrow - the core type for dispute-proof documents
 */
export interface MedicalNoteEscrow {
  /** Unique escrow identifier */
  id: string;
  /** Tenant/employer ID */
  tenantId: string;
  /** Employee ID */
  employeeId: string;
  /** Related PTO request ID */
  requestId: string;
  /** Document type */
  documentType: MedicalDocumentType;
  /** Original file name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  mimeType: string;
  /** File checksum (SHA-256) */
  checksum: string;
  /** Quantum-safe encrypted envelope */
  encryptedEnvelope: QuantumSafeEnvelope;
  /** Secret sharing configuration */
  secretSharing: SecretSharingConfig;
  /** BLS aggregate signature */
  aggregateSignature?: AggregatedBLSSignature;
  /** Zero-knowledge commitment */
  zkCommitment: ZeroKnowledgeCommitment;
  /** Current status */
  status: EscrowStatus;
  /** KMS escrow key path */
  kmsKeyPath?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Release timestamp (when PTO approved) */
  releasedAt?: Date;
  /** Reconstruction timestamp */
  reconstructedAt?: Date;
  /** Expiration date */
  expiresAt: Date;
  /** Data residency confirmation */
  dataResidency: 'US';
  /** Audit trail */
  auditTrail: EscrowAuditEntry[];
}

export const MedicalNoteEscrowSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  requestId: z.string(),
  documentType: MedicalDocumentTypeSchema,
  fileName: z.string(),
  fileSize: z.number().int().min(0),
  mimeType: z.string(),
  checksum: z.string(),
  encryptedEnvelope: QuantumSafeEnvelopeSchema,
  secretSharing: SecretSharingConfigSchema,
  aggregateSignature: AggregatedBLSSignatureSchema.optional(),
  zkCommitment: ZeroKnowledgeCommitmentSchema,
  status: EscrowStatusSchema,
  kmsKeyPath: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  releasedAt: z.date().optional(),
  reconstructedAt: z.date().optional(),
  expiresAt: z.date(),
  dataResidency: z.literal('US'),
  auditTrail: z.array(
    z.object({
      id: z.string(),
      action: z.string(),
      performedBy: z.string(),
      performedAt: z.date(),
      details: z.string(),
      integrityHash: z.string(),
    })
  ),
});

/**
 * Escrow audit entry
 */
export interface EscrowAuditEntry {
  /** Unique entry ID */
  id: string;
  /** Action performed */
  action: string;
  /** Actor who performed the action */
  performedBy: string;
  /** Timestamp */
  performedAt: Date;
  /** Action details */
  details: string;
  /** Integrity hash */
  integrityHash: string;
}

export const EscrowAuditEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  performedBy: z.string(),
  performedAt: z.date(),
  details: z.string(),
  integrityHash: z.string(),
});

// ============================================================================
// Section 5: Escrow Operation Types
// ============================================================================

/**
 * Request to create a new medical note escrow
 */
export interface CreateEscrowRequest {
  tenantId: string;
  employeeId: string;
  requestId: string;
  documentType: MedicalDocumentType;
  fileName: string;
  fileData: Buffer | string;
  mimeType: string;
  employeePublicKey: string;
  employerPublicKey: string;
}

/**
 * Request to sign an escrow
 */
export interface SignEscrowRequest {
  escrowId: string;
  signerId: string;
  signerType: 'EMPLOYEE' | 'EMPLOYER';
  signature: string;
}

/**
 * Request to release an escrow (after PTO approval)
 */
export interface ReleaseEscrowRequest {
  escrowId: string;
  requesterId: string;
  reason: string;
  employeeConsent: boolean;
  employerConsent: boolean;
}

/**
 * Request to reconstruct document from escrow
 */
export interface ReconstructDocumentRequest {
  escrowId: string;
  requesterId: string;
  employeeShare: SecretShare;
  employerShare: SecretShare;
  purpose: 'DISPUTE_RESOLUTION' | 'AUDIT' | 'LEGAL_REQUEST';
}

/**
 * Escrow reconstruction result
 */
export interface ReconstructionResult {
  escrowId: string;
  success: boolean;
  decryptedDocument?: Buffer;
  fileName?: string;
  mimeType?: string;
  verificationPassed: boolean;
  checksumMatch: boolean;
  signatureValid: boolean;
  reconstructedAt: Date;
  reconstructedBy: string;
}

export const ReconstructionResultSchema = z.object({
  escrowId: z.string(),
  success: z.boolean(),
  decryptedDocument: z.any().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  verificationPassed: z.boolean(),
  checksumMatch: z.boolean(),
  signatureValid: z.boolean(),
  reconstructedAt: z.date(),
  reconstructedBy: z.string(),
});

// ============================================================================
// Section 6: Escrow Service Response Types
// ============================================================================

/**
 * Standard escrow operation response
 */
export interface EscrowOperationResponse {
  success: boolean;
  escrowId?: string;
  status?: EscrowStatus;
  message: string;
  commitment?: string;
  error?: string;
}

export const EscrowOperationResponseSchema = z.object({
  success: z.boolean(),
  escrowId: z.string().optional(),
  status: EscrowStatusSchema.optional(),
  message: z.string(),
  commitment: z.string().optional(),
  error: z.string().optional(),
});
