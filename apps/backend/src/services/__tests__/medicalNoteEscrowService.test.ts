/**
 * Medical Note Escrow Service Tests
 *
 * Tests the complete dispute-proof medical notes workflow including:
 * - Escrow creation with quantum-resistant encryption
 * - Multi-party signing with BLS signatures
 * - Secret sharing and reconstruction
 * - Audit trail verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  escrowMedicalNote,
  signEscrowedNote,
  releaseEscrowedNote,
  reconstructDocument,
  getEscrow,
  getEscrowsForTenant,
  getEscrowsForEmployee,
  verifyZKCommitment,
  _clearAllEscrows,
} from '../medicalNoteEscrowService';

describe('Medical Note Escrow Service', () => {
  beforeEach(() => {
    // Clear storage before each test
    _clearAllEscrows();
  });

  describe('escrowMedicalNote', () => {
    it('should create an escrow for a medical document', async () => {
      const request = {
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'doctors-note.pdf',
        fileData: Buffer.from('PDF document content'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      };

      const result = await escrowMedicalNote(request);

      expect(result.success).toBe(true);
      expect(result.escrowId).toBeDefined();
      expect(result.status).toBe('CREATED');
      expect(result.commitment).toBeDefined();
    });

    it('should store escrow with correct metadata', async () => {
      const request = {
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'FMLA_CERTIFICATION' as const,
        fileName: 'fmla-form.pdf',
        fileData: 'base64encodeddata',
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      };

      const result = await escrowMedicalNote(request);
      const escrow = getEscrow(result.escrowId!);

      expect(escrow).toBeDefined();
      expect(escrow!.tenantId).toBe('org-123');
      expect(escrow!.employeeId).toBe('emp-456');
      expect(escrow!.requestId).toBe('req-789');
      expect(escrow!.documentType).toBe('FMLA_CERTIFICATION');
      expect(escrow!.fileName).toBe('fmla-form.pdf');
      expect(escrow!.mimeType).toBe('application/pdf');
      expect(escrow!.dataResidency).toBe('US');
    });

    it('should create quantum-safe encrypted envelope', async () => {
      const request = {
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('secret medical information'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      };

      const result = await escrowMedicalNote(request);
      const escrow = getEscrow(result.escrowId!);

      expect(escrow!.encryptedEnvelope).toBeDefined();
      expect(escrow!.encryptedEnvelope.kyberCiphertext).toBeTruthy();
      expect(escrow!.encryptedEnvelope.encryptedData).toBeTruthy();
      expect(escrow!.encryptedEnvelope.iv).toBeTruthy();
      expect(escrow!.encryptedEnvelope.authTag).toBeTruthy();
      expect(escrow!.encryptedEnvelope.algorithmVersion).toContain('KYBER768');
    });

    it('should create 2-of-2 secret sharing', async () => {
      const request = {
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      };

      const result = await escrowMedicalNote(request);
      const escrow = getEscrow(result.escrowId!);

      expect(escrow!.secretSharing.totalShares).toBe(2);
      expect(escrow!.secretSharing.threshold).toBe(2);
      expect(escrow!.secretSharing.shares).toHaveLength(2);

      const employeeShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYEE'
      );
      const employerShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYER'
      );

      expect(employeeShare).toBeDefined();
      expect(employerShare).toBeDefined();
    });

    it('should create zero-knowledge commitment', async () => {
      const request = {
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test document'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      };

      const result = await escrowMedicalNote(request);
      const escrow = getEscrow(result.escrowId!);

      expect(escrow!.zkCommitment).toBeDefined();
      expect(escrow!.zkCommitment.commitment).toMatch(/^[0-9a-f]{64}$/);
      expect(escrow!.zkCommitment.blindingFactor).toBeDefined();
    });

    it('should create initial audit entry', async () => {
      const request = {
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      };

      const result = await escrowMedicalNote(request);
      const escrow = getEscrow(result.escrowId!);

      expect(escrow!.auditTrail).toHaveLength(1);
      expect(escrow!.auditTrail[0]!.action).toBe('ESCROW_CREATED');
      expect(escrow!.auditTrail[0]!.performedBy).toBe('emp-456');
      expect(escrow!.auditTrail[0]!.integrityHash).toBeTruthy();
    });

    it('should calculate checksum for document', async () => {
      const content = 'This is the document content';
      const request = {
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from(content),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      };

      const result = await escrowMedicalNote(request);
      const escrow = getEscrow(result.escrowId!);

      expect(escrow!.checksum).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('signEscrowedNote', () => {
    it('should allow employee to sign', async () => {
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      const signResult = await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'emp-456',
        signerType: 'EMPLOYEE',
        signature: 'employee-signature',
      });

      expect(signResult.success).toBe(true);
      expect(signResult.status).toBe('PENDING_EMPLOYER_SIGNATURE');
    });

    it('should allow employer to sign', async () => {
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      const signResult = await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'org-123',
        signerType: 'EMPLOYER',
        signature: 'employer-signature',
      });

      expect(signResult.success).toBe(true);
      expect(signResult.status).toBe('PENDING_EMPLOYEE_SIGNATURE');
    });

    it('should mark as fully signed when both parties sign', async () => {
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      // Employee signs first
      await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'emp-456',
        signerType: 'EMPLOYEE',
        signature: 'employee-signature',
      });

      // Employer signs second
      const signResult = await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'org-123',
        signerType: 'EMPLOYER',
        signature: 'employer-signature',
      });

      expect(signResult.status).toBe('FULLY_SIGNED');

      const escrow = getEscrow(createResult.escrowId!);
      expect(escrow!.aggregateSignature).toBeDefined();
      expect(escrow!.aggregateSignature!.individualSignatures).toHaveLength(2);
    });

    it('should add audit entries for each signature', async () => {
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'emp-456',
        signerType: 'EMPLOYEE',
        signature: 'sig',
      });

      await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'org-123',
        signerType: 'EMPLOYER',
        signature: 'sig',
      });

      const escrow = getEscrow(createResult.escrowId!);
      expect(escrow!.auditTrail).toHaveLength(3); // create + 2 signs
      expect(escrow!.auditTrail[1]!.action).toBe('SIGNED_BY_EMPLOYEE');
      expect(escrow!.auditTrail[2]!.action).toBe('SIGNED_BY_EMPLOYER');
    });

    it('should fail for non-existent escrow', async () => {
      const result = await signEscrowedNote({
        escrowId: 'non-existent',
        signerId: 'emp-456',
        signerType: 'EMPLOYEE',
        signature: 'sig',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No escrow with ID');
    });
  });

  describe('releaseEscrowedNote', () => {
    it('should release a fully signed escrow', async () => {
      // Create and sign
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'emp-456',
        signerType: 'EMPLOYEE',
        signature: 'sig',
      });

      await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'org-123',
        signerType: 'EMPLOYER',
        signature: 'sig',
      });

      // Release
      const releaseResult = await releaseEscrowedNote({
        escrowId: createResult.escrowId!,
        requesterId: 'admin',
        reason: 'PTO approved',
        employeeConsent: true,
        employerConsent: true,
      });

      expect(releaseResult.success).toBe(true);
      expect(releaseResult.status).toBe('RELEASED');

      const escrow = getEscrow(createResult.escrowId!);
      expect(escrow!.releasedAt).toBeDefined();
    });

    it('should fail without both consents', async () => {
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'emp-456',
        signerType: 'EMPLOYEE',
        signature: 'sig',
      });

      await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'org-123',
        signerType: 'EMPLOYER',
        signature: 'sig',
      });

      // Try to release without employee consent
      const releaseResult = await releaseEscrowedNote({
        escrowId: createResult.escrowId!,
        requesterId: 'admin',
        reason: 'PTO approved',
        employeeConsent: false,
        employerConsent: true,
      });

      expect(releaseResult.success).toBe(false);
      expect(releaseResult.error).toContain('Missing consent');
    });

    it('should fail for unsigned escrow', async () => {
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      const releaseResult = await releaseEscrowedNote({
        escrowId: createResult.escrowId!,
        requesterId: 'admin',
        reason: 'PTO approved',
        employeeConsent: true,
        employerConsent: true,
      });

      expect(releaseResult.success).toBe(false);
      expect(releaseResult.error).toContain('Current status');
    });
  });

  describe('reconstructDocument', () => {
    it('should reconstruct document with both shares', async () => {
      const originalContent = 'This is the secret medical document content';

      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from(originalContent),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      const escrow = getEscrow(createResult.escrowId!);
      const employeeShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYEE'
      )!;
      const employerShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYER'
      )!;

      const reconstructResult = await reconstructDocument({
        escrowId: createResult.escrowId!,
        requesterId: 'legal-admin',
        employeeShare,
        employerShare,
        purpose: 'DISPUTE_RESOLUTION',
      });

      expect(reconstructResult.success).toBe(true);
      expect(reconstructResult.decryptedDocument).toBeDefined();
      expect(reconstructResult.decryptedDocument!.toString()).toBe(
        originalContent
      );
      expect(reconstructResult.checksumMatch).toBe(true);
      expect(reconstructResult.verificationPassed).toBe(true);
    });

    it('should verify checksum after reconstruction', async () => {
      const content = 'Medical content for checksum verification';

      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from(content),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      const escrow = getEscrow(createResult.escrowId!);
      const employeeShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYEE'
      )!;
      const employerShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYER'
      )!;

      const result = await reconstructDocument({
        escrowId: createResult.escrowId!,
        requesterId: 'admin',
        employeeShare,
        employerShare,
        purpose: 'AUDIT',
      });

      expect(result.checksumMatch).toBe(true);
    });

    it('should add audit entry for reconstruction', async () => {
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      const escrow = getEscrow(createResult.escrowId!);
      const employeeShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYEE'
      )!;
      const employerShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYER'
      )!;

      await reconstructDocument({
        escrowId: createResult.escrowId!,
        requesterId: 'legal-admin',
        employeeShare,
        employerShare,
        purpose: 'LEGAL_REQUEST',
      });

      const updatedEscrow = getEscrow(createResult.escrowId!);
      const reconstructAudit = updatedEscrow!.auditTrail.find(
        (a) => a.action === 'DOCUMENT_RECONSTRUCTED'
      );

      expect(reconstructAudit).toBeDefined();
      expect(reconstructAudit!.details).toContain('LEGAL_REQUEST');
    });

    it('should update escrow status after reconstruction', async () => {
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('test'),
        mimeType: 'application/pdf',
        employeePublicKey: 'emp-key',
        employerPublicKey: 'org-key',
      });

      const escrow = getEscrow(createResult.escrowId!);
      const employeeShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYEE'
      )!;
      const employerShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYER'
      )!;

      await reconstructDocument({
        escrowId: createResult.escrowId!,
        requesterId: 'admin',
        employeeShare,
        employerShare,
        purpose: 'DISPUTE_RESOLUTION',
      });

      const updatedEscrow = getEscrow(createResult.escrowId!);
      expect(updatedEscrow!.status).toBe('RECONSTRUCTED');
      expect(updatedEscrow!.reconstructedAt).toBeDefined();
    });

    it('should fail for non-existent escrow', async () => {
      const result = await reconstructDocument({
        escrowId: 'non-existent',
        requesterId: 'admin',
        employeeShare: {
          index: 1,
          value: '',
          holderId: '',
          holderType: 'EMPLOYEE',
          createdAt: new Date(),
        },
        employerShare: {
          index: 2,
          value: '',
          holderId: '',
          holderType: 'EMPLOYER',
          createdAt: new Date(),
        },
        purpose: 'AUDIT',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getEscrowsForTenant', () => {
    it('should return all escrows for a tenant', async () => {
      // Create multiple escrows for same tenant
      await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-1',
        requestId: 'req-1',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note1.pdf',
        fileData: Buffer.from('test1'),
        mimeType: 'application/pdf',
        employeePublicKey: 'key1',
        employerPublicKey: 'key2',
      });

      await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-2',
        requestId: 'req-2',
        documentType: 'FMLA_CERTIFICATION' as const,
        fileName: 'note2.pdf',
        fileData: Buffer.from('test2'),
        mimeType: 'application/pdf',
        employeePublicKey: 'key1',
        employerPublicKey: 'key2',
      });

      // Create one for different tenant
      await escrowMedicalNote({
        tenantId: 'org-456',
        employeeId: 'emp-3',
        requestId: 'req-3',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note3.pdf',
        fileData: Buffer.from('test3'),
        mimeType: 'application/pdf',
        employeePublicKey: 'key1',
        employerPublicKey: 'key2',
      });

      const escrows = getEscrowsForTenant('org-123');
      expect(escrows).toHaveLength(2);
      expect(escrows.every((e) => e.tenantId === 'org-123')).toBe(true);
    });
  });

  describe('getEscrowsForEmployee', () => {
    it('should return all escrows for an employee', async () => {
      await escrowMedicalNote({
        tenantId: 'org-1',
        employeeId: 'emp-123',
        requestId: 'req-1',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note1.pdf',
        fileData: Buffer.from('test1'),
        mimeType: 'application/pdf',
        employeePublicKey: 'key1',
        employerPublicKey: 'key2',
      });

      await escrowMedicalNote({
        tenantId: 'org-2',
        employeeId: 'emp-123',
        requestId: 'req-2',
        documentType: 'FMLA_CERTIFICATION' as const,
        fileName: 'note2.pdf',
        fileData: Buffer.from('test2'),
        mimeType: 'application/pdf',
        employeePublicKey: 'key1',
        employerPublicKey: 'key2',
      });

      await escrowMedicalNote({
        tenantId: 'org-1',
        employeeId: 'emp-456',
        requestId: 'req-3',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note3.pdf',
        fileData: Buffer.from('test3'),
        mimeType: 'application/pdf',
        employeePublicKey: 'key1',
        employerPublicKey: 'key2',
      });

      const escrows = getEscrowsForEmployee('emp-123');
      expect(escrows).toHaveLength(2);
      expect(escrows.every((e) => e.employeeId === 'emp-123')).toBe(true);
    });
  });

  describe('verifyZKCommitment', () => {
    it('should verify valid commitment', async () => {
      const content = 'test document';
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from(content),
        mimeType: 'application/pdf',
        employeePublicKey: 'key1',
        employerPublicKey: 'key2',
      });

      const escrow = getEscrow(createResult.escrowId!);
      const isValid = verifyZKCommitment(
        Buffer.from(content),
        escrow!.zkCommitment
      );

      expect(isValid).toBe(true);
    });

    it('should reject commitment for wrong document', async () => {
      const createResult = await escrowMedicalNote({
        tenantId: 'org-123',
        employeeId: 'emp-456',
        requestId: 'req-789',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'note.pdf',
        fileData: Buffer.from('original'),
        mimeType: 'application/pdf',
        employeePublicKey: 'key1',
        employerPublicKey: 'key2',
      });

      const escrow = getEscrow(createResult.escrowId!);
      const isValid = verifyZKCommitment(
        Buffer.from('tampered'),
        escrow!.zkCommitment
      );

      expect(isValid).toBe(false);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full escrow lifecycle', async () => {
      const originalContent =
        'Complete medical document for John Doe, dated 2025-11-25';

      // Step 1: Create escrow
      const createResult = await escrowMedicalNote({
        tenantId: 'acme-corp',
        employeeId: 'john-doe-123',
        requestId: 'pto-request-456',
        documentType: 'DOCTORS_NOTE' as const,
        fileName: 'dr-smith-note.pdf',
        fileData: Buffer.from(originalContent),
        mimeType: 'application/pdf',
        employeePublicKey: 'john-pub-key',
        employerPublicKey: 'acme-pub-key',
      });

      expect(createResult.success).toBe(true);
      expect(createResult.status).toBe('CREATED');

      // Step 2: Employee signs
      const empSignResult = await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'john-doe-123',
        signerType: 'EMPLOYEE',
        signature: 'john-sig',
      });

      expect(empSignResult.success).toBe(true);
      expect(empSignResult.status).toBe('PENDING_EMPLOYER_SIGNATURE');

      // Step 3: Employer signs
      const orgSignResult = await signEscrowedNote({
        escrowId: createResult.escrowId!,
        signerId: 'acme-hr',
        signerType: 'EMPLOYER',
        signature: 'acme-sig',
      });

      expect(orgSignResult.success).toBe(true);
      expect(orgSignResult.status).toBe('FULLY_SIGNED');

      // Step 4: Release after PTO approval
      const releaseResult = await releaseEscrowedNote({
        escrowId: createResult.escrowId!,
        requesterId: 'acme-hr-manager',
        reason: 'PTO request approved',
        employeeConsent: true,
        employerConsent: true,
      });

      expect(releaseResult.success).toBe(true);
      expect(releaseResult.status).toBe('RELEASED');

      // Step 5: Reconstruct for audit
      const escrow = getEscrow(createResult.escrowId!);
      const employeeShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYEE'
      )!;
      const employerShare = escrow!.secretSharing.shares.find(
        (s) => s.holderType === 'EMPLOYER'
      )!;

      const reconstructResult = await reconstructDocument({
        escrowId: createResult.escrowId!,
        requesterId: 'compliance-auditor',
        employeeShare,
        employerShare,
        purpose: 'AUDIT',
      });

      expect(reconstructResult.success).toBe(true);
      expect(reconstructResult.decryptedDocument!.toString()).toBe(
        originalContent
      );
      expect(reconstructResult.checksumMatch).toBe(true);
      expect(reconstructResult.verificationPassed).toBe(true);

      // Verify complete audit trail
      const finalEscrow = getEscrow(createResult.escrowId!);
      expect(finalEscrow!.auditTrail.length).toBeGreaterThanOrEqual(5);

      const actions = finalEscrow!.auditTrail.map((a) => a.action);
      expect(actions).toContain('ESCROW_CREATED');
      expect(actions).toContain('SIGNED_BY_EMPLOYEE');
      expect(actions).toContain('SIGNED_BY_EMPLOYER');
      expect(actions).toContain('ESCROW_RELEASED');
      expect(actions).toContain('DOCUMENT_RECONSTRUCTED');
    });
  });
});
