/**
 * BLS Aggregate Signature Service Tests
 *
 * Tests the BLS signature generation, verification, and aggregation.
 */

import { describe, it, expect } from 'vitest';
import {
  generateBLSKeyPair,
  signBLS,
  verifyBLSSignature,
  aggregateBLSSignatures,
  verifyAggregatedBLSSignature,
  createMultiSignatureSetup,
  coSignDocument,
  verifyCoSignedDocument,
  BLS_KEY_SIZES,
} from '../blsSignatureService';

describe('BLS Aggregate Signature Service', () => {
  describe('generateBLSKeyPair', () => {
    it('should generate a key pair', () => {
      const keyPair = generateBLSKeyPair('user-123', 'EMPLOYEE');

      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
    });

    it('should set correct owner information', () => {
      const keyPair = generateBLSKeyPair('user-456', 'EMPLOYER');

      expect(keyPair.publicKey.ownerId).toBe('user-456');
      expect(keyPair.publicKey.ownerType).toBe('EMPLOYER');
      expect(keyPair.privateKey.ownerId).toBe('user-456');
    });

    it('should generate keys with correct sizes', () => {
      const keyPair = generateBLSKeyPair('user', 'EMPLOYEE');

      const publicKeyBytes = Buffer.from(keyPair.publicKey.publicKey, 'base64');
      const privateKeyBytes = Buffer.from(
        keyPair.privateKey.privateKey,
        'base64'
      );

      expect(publicKeyBytes.length).toBe(BLS_KEY_SIZES.PUBLIC_KEY);
      expect(privateKeyBytes.length).toBe(BLS_KEY_SIZES.PRIVATE_KEY);
    });

    it('should generate unique key pairs', () => {
      const keyPair1 = generateBLSKeyPair('user1', 'EMPLOYEE');
      const keyPair2 = generateBLSKeyPair('user2', 'EMPLOYEE');

      expect(keyPair1.publicKey.keyId).not.toBe(keyPair2.publicKey.keyId);
    });

    it('should include creation timestamps', () => {
      const before = new Date();
      const keyPair = generateBLSKeyPair('user', 'EMPLOYEE');
      const after = new Date();

      expect(keyPair.publicKey.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(keyPair.publicKey.createdAt.getTime()).toBeLessThanOrEqual(
        after.getTime()
      );
    });
  });

  describe('signBLS', () => {
    it('should sign a string message', () => {
      const keyPair = generateBLSKeyPair('signer', 'EMPLOYEE');
      const message = 'Hello, BLS!';

      const signature = signBLS(message, keyPair.privateKey, 'EMPLOYEE');

      expect(signature).toHaveProperty('signature');
      expect(signature).toHaveProperty('signerId');
      expect(signature).toHaveProperty('messageHash');
      expect(signature.signerType).toBe('EMPLOYEE');
    });

    it('should sign a Buffer message', () => {
      const keyPair = generateBLSKeyPair('signer', 'EMPLOYER');
      const message = Buffer.from([0x01, 0x02, 0x03, 0x04]);

      const signature = signBLS(message, keyPair.privateKey, 'EMPLOYER');

      expect(signature.signature).toBeTruthy();
    });

    it('should produce signature with correct size', () => {
      const keyPair = generateBLSKeyPair('signer', 'EMPLOYEE');
      const signature = signBLS('test', keyPair.privateKey, 'EMPLOYEE');

      const signatureBytes = Buffer.from(signature.signature, 'base64');
      expect(signatureBytes.length).toBe(BLS_KEY_SIZES.SIGNATURE);
    });

    it('should produce deterministic signatures', () => {
      const keyPair = generateBLSKeyPair('signer', 'EMPLOYEE');
      const message = 'consistent message';

      const sig1 = signBLS(message, keyPair.privateKey, 'EMPLOYEE');
      const sig2 = signBLS(message, keyPair.privateKey, 'EMPLOYEE');

      expect(sig1.signature).toBe(sig2.signature);
      expect(sig1.messageHash).toBe(sig2.messageHash);
    });

    it('should produce different signatures for different messages', () => {
      const keyPair = generateBLSKeyPair('signer', 'EMPLOYEE');

      const sig1 = signBLS('message1', keyPair.privateKey, 'EMPLOYEE');
      const sig2 = signBLS('message2', keyPair.privateKey, 'EMPLOYEE');

      expect(sig1.signature).not.toBe(sig2.signature);
      expect(sig1.messageHash).not.toBe(sig2.messageHash);
    });

    it('should include signing timestamp', () => {
      const keyPair = generateBLSKeyPair('signer', 'EMPLOYEE');
      const before = new Date();
      const signature = signBLS('test', keyPair.privateKey, 'EMPLOYEE');
      const after = new Date();

      expect(signature.signedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(signature.signedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('verifyBLSSignature', () => {
    it('should verify a valid signature', () => {
      const keyPair = generateBLSKeyPair('signer', 'EMPLOYEE');
      const message = 'verify me';

      const signature = signBLS(message, keyPair.privateKey, 'EMPLOYEE');
      const isValid = verifyBLSSignature(signature, message, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should reject signature with wrong message', () => {
      const keyPair = generateBLSKeyPair('signer', 'EMPLOYEE');

      const signature = signBLS('original', keyPair.privateKey, 'EMPLOYEE');
      const isValid = verifyBLSSignature(
        signature,
        'tampered',
        keyPair.publicKey
      );

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong public key', () => {
      const keyPair1 = generateBLSKeyPair('signer1', 'EMPLOYEE');
      const keyPair2 = generateBLSKeyPair('signer2', 'EMPLOYEE');
      const message = 'test';

      const signature = signBLS(message, keyPair1.privateKey, 'EMPLOYEE');
      const isValid = verifyBLSSignature(
        signature,
        message,
        keyPair2.publicKey
      );

      expect(isValid).toBe(false);
    });
  });

  describe('aggregateBLSSignatures', () => {
    it('should aggregate multiple signatures', () => {
      const keyPair1 = generateBLSKeyPair('signer1', 'EMPLOYEE');
      const keyPair2 = generateBLSKeyPair('signer2', 'EMPLOYER');
      const message = 'shared document';

      const sig1 = signBLS(message, keyPair1.privateKey, 'EMPLOYEE');
      const sig2 = signBLS(message, keyPair2.privateKey, 'EMPLOYER');

      const aggregate = aggregateBLSSignatures([sig1, sig2]);

      expect(aggregate).toHaveProperty('aggregateSignature');
      expect(aggregate.individualSignatures).toHaveLength(2);
      expect(aggregate.messageHash).toBe(sig1.messageHash);
    });

    it('should fail with empty signature list', () => {
      expect(() => {
        aggregateBLSSignatures([]);
      }).toThrow('Cannot aggregate empty signature list');
    });

    it('should fail with signatures for different messages', () => {
      const keyPair1 = generateBLSKeyPair('signer1', 'EMPLOYEE');
      const keyPair2 = generateBLSKeyPair('signer2', 'EMPLOYER');

      const sig1 = signBLS('message1', keyPair1.privateKey, 'EMPLOYEE');
      const sig2 = signBLS('message2', keyPair2.privateKey, 'EMPLOYER');

      expect(() => {
        aggregateBLSSignatures([sig1, sig2]);
      }).toThrow('All signatures must be for the same message');
    });

    it('should produce consistent aggregate for same signatures', () => {
      const keyPair1 = generateBLSKeyPair('signer1', 'EMPLOYEE');
      const keyPair2 = generateBLSKeyPair('signer2', 'EMPLOYER');
      const message = 'test';

      const sig1 = signBLS(message, keyPair1.privateKey, 'EMPLOYEE');
      const sig2 = signBLS(message, keyPair2.privateKey, 'EMPLOYER');

      const agg1 = aggregateBLSSignatures([sig1, sig2]);
      const agg2 = aggregateBLSSignatures([sig1, sig2]);

      expect(agg1.aggregateSignature).toBe(agg2.aggregateSignature);
    });
  });

  describe('verifyAggregatedBLSSignature', () => {
    it('should verify a valid aggregate signature', () => {
      const keyPair1 = generateBLSKeyPair('signer1', 'EMPLOYEE');
      const keyPair2 = generateBLSKeyPair('signer2', 'EMPLOYER');
      const message = 'shared document';

      const sig1 = signBLS(message, keyPair1.privateKey, 'EMPLOYEE');
      const sig2 = signBLS(message, keyPair2.privateKey, 'EMPLOYER');
      const aggregate = aggregateBLSSignatures([sig1, sig2]);

      const verified = verifyAggregatedBLSSignature(aggregate, message, [
        keyPair1.publicKey,
        keyPair2.publicKey,
      ]);

      expect(verified.isVerified).toBe(true);
    });

    it('should reject aggregate with wrong message', () => {
      const keyPair1 = generateBLSKeyPair('signer1', 'EMPLOYEE');
      const keyPair2 = generateBLSKeyPair('signer2', 'EMPLOYER');

      const sig1 = signBLS('original', keyPair1.privateKey, 'EMPLOYEE');
      const sig2 = signBLS('original', keyPair2.privateKey, 'EMPLOYER');
      const aggregate = aggregateBLSSignatures([sig1, sig2]);

      const verified = verifyAggregatedBLSSignature(aggregate, 'tampered', [
        keyPair1.publicKey,
        keyPair2.publicKey,
      ]);

      expect(verified.isVerified).toBe(false);
    });

    it('should reject aggregate with missing public key', () => {
      const keyPair1 = generateBLSKeyPair('signer1', 'EMPLOYEE');
      const keyPair2 = generateBLSKeyPair('signer2', 'EMPLOYER');
      const message = 'test';

      const sig1 = signBLS(message, keyPair1.privateKey, 'EMPLOYEE');
      const sig2 = signBLS(message, keyPair2.privateKey, 'EMPLOYER');
      const aggregate = aggregateBLSSignatures([sig1, sig2]);

      // Only provide one public key
      const verified = verifyAggregatedBLSSignature(aggregate, message, [
        keyPair1.publicKey,
      ]);

      expect(verified.isVerified).toBe(false);
    });
  });

  describe('createMultiSignatureSetup', () => {
    it('should create key pairs for both parties', () => {
      const setup = createMultiSignatureSetup('emp-123', 'org-456');

      expect(setup.employee.publicKey.ownerType).toBe('EMPLOYEE');
      expect(setup.employee.publicKey.ownerId).toBe('emp-123');
      expect(setup.employer.publicKey.ownerType).toBe('EMPLOYER');
      expect(setup.employer.publicKey.ownerId).toBe('org-456');
    });
  });

  describe('coSignDocument', () => {
    it('should create aggregate signature from both parties', () => {
      const setup = createMultiSignatureSetup('emp', 'org');
      const document = 'Medical document content';

      const aggregate = coSignDocument(
        document,
        setup.employee.privateKey,
        setup.employer.privateKey
      );

      expect(aggregate.individualSignatures).toHaveLength(2);
      expect(
        aggregate.individualSignatures.some((s) => s.signerType === 'EMPLOYEE')
      ).toBe(true);
      expect(
        aggregate.individualSignatures.some((s) => s.signerType === 'EMPLOYER')
      ).toBe(true);
    });

    it('should work with Buffer documents', () => {
      const setup = createMultiSignatureSetup('emp', 'org');
      const document = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header

      const aggregate = coSignDocument(
        document,
        setup.employee.privateKey,
        setup.employer.privateKey
      );

      expect(aggregate.aggregateSignature).toBeTruthy();
    });
  });

  describe('verifyCoSignedDocument', () => {
    it('should verify a valid co-signed document', () => {
      const setup = createMultiSignatureSetup('emp', 'org');
      const document = 'Important medical document';

      const aggregate = coSignDocument(
        document,
        setup.employee.privateKey,
        setup.employer.privateKey
      );

      const isValid = verifyCoSignedDocument(
        document,
        aggregate,
        setup.employee.publicKey,
        setup.employer.publicKey
      );

      expect(isValid).toBe(true);
    });

    it('should reject if employee signature missing', () => {
      const setup = createMultiSignatureSetup('emp', 'org');
      const document = 'test';

      // Only employer signs
      const sig = signBLS(document, setup.employer.privateKey, 'EMPLOYER');
      const aggregate = aggregateBLSSignatures([sig]);

      const isValid = verifyCoSignedDocument(
        document,
        aggregate,
        setup.employee.publicKey,
        setup.employer.publicKey
      );

      expect(isValid).toBe(false);
    });

    it('should reject if employer signature missing', () => {
      const setup = createMultiSignatureSetup('emp', 'org');
      const document = 'test';

      // Only employee signs
      const sig = signBLS(document, setup.employee.privateKey, 'EMPLOYEE');
      const aggregate = aggregateBLSSignatures([sig]);

      const isValid = verifyCoSignedDocument(
        document,
        aggregate,
        setup.employee.publicKey,
        setup.employer.publicKey
      );

      expect(isValid).toBe(false);
    });

    it('should reject tampered document', () => {
      const setup = createMultiSignatureSetup('emp', 'org');
      const document = 'original';

      const aggregate = coSignDocument(
        document,
        setup.employee.privateKey,
        setup.employer.privateKey
      );

      const isValid = verifyCoSignedDocument(
        'tampered',
        aggregate,
        setup.employee.publicKey,
        setup.employer.publicKey
      );

      expect(isValid).toBe(false);
    });
  });

  describe('End-to-End Multi-Signature Flow', () => {
    it('should complete full multi-sig workflow for medical document', () => {
      // Setup: Create key pairs for both parties
      const setup = createMultiSignatureSetup('employee-123', 'employer-456');

      // Document: Medical note content
      const medicalNote = JSON.stringify({
        type: 'DOCTORS_NOTE',
        patient: 'John Doe',
        diagnosis: 'Flu',
        date: '2025-11-25',
      });

      // Co-sign the document
      const aggregate = coSignDocument(
        medicalNote,
        setup.employee.privateKey,
        setup.employer.privateKey
      );

      // Verify the aggregate signature
      const isValid = verifyCoSignedDocument(
        medicalNote,
        aggregate,
        setup.employee.publicKey,
        setup.employer.publicKey
      );

      expect(isValid).toBe(true);
      expect(aggregate.individualSignatures).toHaveLength(2);

      // Verify individual signatures
      for (const sig of aggregate.individualSignatures) {
        const pk =
          sig.signerType === 'EMPLOYEE'
            ? setup.employee.publicKey
            : setup.employer.publicKey;
        expect(verifyBLSSignature(sig, medicalNote, pk)).toBe(true);
      }
    });
  });
});
