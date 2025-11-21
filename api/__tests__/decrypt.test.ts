/**
 * Tests for Decrypt Endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelResponse } from '@vercel/node';
import handler from '../secure/decrypt';
import type { AuthenticatedVercelRequest } from '../lib/authMiddleware';
import * as authMiddleware from '../lib/authMiddleware';
import * as hybridEncryption from '../../packages/backend/src/utils/encryption/hybridEncryption';

// Mock dependencies
vi.mock('../lib/authMiddleware', async () => {
  const actual = await vi.importActual('../lib/authMiddleware');
  return {
    ...actual,
    requireAuth: vi.fn(),
    isResourceOwner: vi.fn(),
    hasTenantAccess: vi.fn(),
    logSecurityEvent: vi.fn()
  };
});

vi.mock('../../packages/backend/src/utils/encryption/hybridEncryption', async () => {
  const actual = await vi.importActual('../../packages/backend/src/utils/encryption/hybridEncryption');
  return {
    ...actual,
    decryptHybrid: vi.fn()
  };
});

describe('Decrypt Endpoint', () => {
  let mockReq: Partial<AuthenticatedVercelRequest>;
  let mockRes: Partial<VercelResponse>;

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token'
      },
      url: '/api/secure/decrypt',
      body: {
        payload: {
          encryptedData: 'encrypted-data-base64',
          encryptedAESKey: 'encrypted-key-base64',
          iv: 'iv-base64',
          authTag: 'auth-tag-base64'
        },
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----'
      }
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Default successful authentication
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      success: true,
      user: {
        uid: 'user123',
        email: 'test@example.com',
        role: 'employee',
        tenantId: 'tenant123',
        employeeId: 'emp123'
      }
    });

    vi.mocked(authMiddleware.isResourceOwner).mockReturnValue(true);
    vi.mocked(authMiddleware.hasTenantAccess).mockReturnValue(true);
    vi.mocked(authMiddleware.logSecurityEvent).mockResolvedValue(undefined);
    vi.mocked(hybridEncryption.decryptHybrid).mockReturnValue('decrypted-data');

    vi.clearAllMocks();
  });

  describe('Method validation', () => {
    it('should reject non-POST requests', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Method not allowed'
        })
      );
    });

    it('should accept POST requests', async () => {
      mockReq.method = 'POST';
      mockReq.user = {
        uid: 'user123',
        role: 'employee',
        tenantId: 'tenant123'
      };

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
        success: false,
        error: 'Unauthorized',
        statusCode: 401
      });

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(authMiddleware.requireAuth).toHaveBeenCalled();
    });

    it('should not proceed when authentication fails', async () => {
      vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
        success: false,
        error: 'Unauthorized',
        statusCode: 401
      });

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(hybridEncryption.decryptHybrid).not.toHaveBeenCalled();
    });
  });

  describe('Authorization - Resource Owner', () => {
    it('should allow resource owner to decrypt their data', async () => {
      mockReq.body.resourceOwnerId = 'user123';
      mockReq.user = {
        uid: 'user123',
        role: 'employee',
        tenantId: 'tenant123'
      };

      vi.mocked(authMiddleware.isResourceOwner).mockReturnValue(true);

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(authMiddleware.isResourceOwner).toHaveBeenCalledWith(mockReq, 'user123');
    });

    it('should deny non-owner from decrypting data', async () => {
      mockReq.body.resourceOwnerId = 'user999';
      mockReq.user = {
        uid: 'user123',
        role: 'employee',
        tenantId: 'tenant123'
      };

      vi.mocked(authMiddleware.isResourceOwner).mockReturnValue(false);
      vi.mocked(authMiddleware.hasTenantAccess).mockReturnValue(false);

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('do not have permission')
        })
      );
    });

    it('should allow employer to decrypt employee data in same tenant', async () => {
      mockReq.body.resourceOwnerId = 'emp456';
      mockReq.body.tenantId = 'tenant123';
      mockReq.user = {
        uid: 'employer123',
        role: 'employer',
        tenantId: 'tenant123'
      };

      vi.mocked(authMiddleware.isResourceOwner).mockReturnValue(false);
      vi.mocked(authMiddleware.hasTenantAccess).mockReturnValue(true);

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should allow admin to decrypt any data', async () => {
      mockReq.body.resourceOwnerId = 'user999';
      mockReq.user = {
        uid: 'admin123',
        role: 'admin',
        tenantId: 'admin-tenant'
      };

      vi.mocked(authMiddleware.isResourceOwner).mockReturnValue(false);

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Authorization - Tenant Access', () => {
    it('should allow user with tenant access to decrypt tenant data', async () => {
      mockReq.body.tenantId = 'tenant123';
      mockReq.user = {
        uid: 'user123',
        role: 'employee',
        tenantId: 'tenant123'
      };

      vi.mocked(authMiddleware.hasTenantAccess).mockReturnValue(true);

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should deny user without tenant access', async () => {
      mockReq.body.tenantId = 'tenant999';
      mockReq.user = {
        uid: 'user123',
        role: 'employee',
        tenantId: 'tenant123'
      };

      vi.mocked(authMiddleware.hasTenantAccess).mockReturnValue(false);

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('do not have access to this tenant')
        })
      );
    });
  });

  describe('Input validation', () => {
    it('should reject missing payload', async () => {
      mockReq.body.payload = null;
      mockReq.user = {
        uid: 'user123',
        role: 'employee'
      };

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid payload parameter'
        })
      );
    });

    it('should reject invalid payload type', async () => {
      mockReq.body.payload = 'not-an-object';
      mockReq.user = {
        uid: 'user123',
        role: 'employee'
      };

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid payload parameter'
        })
      );
    });

    it('should reject missing privateKey', async () => {
      mockReq.body.privateKey = null;
      mockReq.user = {
        uid: 'user123',
        role: 'employee'
      };

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Legacy mode requires privateKey parameter. Consider migrating to KMS.'
        })
      );
    });

    it('should reject missing payload fields', async () => {
      mockReq.body.payload = {
        encryptedData: 'data',
        // Missing other required fields
      };
      mockReq.user = {
        uid: 'user123',
        role: 'employee'
      };

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Missing required payload fields'
        })
      );
    });
  });

  describe('Decryption', () => {
    it('should successfully decrypt valid data', async () => {
      mockReq.user = {
        uid: 'user123',
        role: 'employee',
        tenantId: 'tenant123'
      };

      vi.mocked(hybridEncryption.decryptHybrid).mockReturnValue('decrypted-secret-data');

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(hybridEncryption.decryptHybrid).toHaveBeenCalledWith(
        expect.objectContaining({
          encryptedData: 'encrypted-data-base64',
          encryptedAESKey: 'encrypted-key-base64',
          iv: 'iv-base64',
          authTag: 'auth-tag-base64'
        }),
        mockReq.body.privateKey
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        decrypted: 'decrypted-secret-data'
      });
    });

    it('should handle decryption errors', async () => {
      mockReq.user = {
        uid: 'user123',
        role: 'employee'
      };

      vi.mocked(hybridEncryption.decryptHybrid).mockImplementation(() => {
        throw new Error('Decryption failed: Invalid key');
      });

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Decryption failed',
          message: 'Decryption failed: Invalid key'
        })
      );
    });
  });

  describe('Security logging', () => {
    it('should log successful decryption', async () => {
      mockReq.body.resourceOwnerId = 'user123';
      mockReq.body.tenantId = 'tenant123';
      mockReq.user = {
        uid: 'user123',
        role: 'employee',
        tenantId: 'tenant123'
      };

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(authMiddleware.logSecurityEvent).toHaveBeenCalledWith(
        'decrypt_success_legacy',
        mockReq,
        expect.objectContaining({
          resourceOwnerId: 'user123',
          tenantId: 'tenant123',
          dataSize: expect.any(Number),
          warning: 'using_legacy_decryption'
        })
      );
    });

    it('should log access denied events', async () => {
      mockReq.body.resourceOwnerId = 'user999';
      mockReq.user = {
        uid: 'user123',
        role: 'employee',
        tenantId: 'tenant123'
      };

      vi.mocked(authMiddleware.isResourceOwner).mockReturnValue(false);
      vi.mocked(authMiddleware.hasTenantAccess).mockReturnValue(false);

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(authMiddleware.logSecurityEvent).toHaveBeenCalledWith(
        'decrypt_access_denied',
        mockReq,
        expect.objectContaining({
          reason: 'insufficient_permissions',
          resourceOwnerId: 'user999'
        })
      );
    });

    it('should log validation errors', async () => {
      mockReq.body.payload = null;
      mockReq.user = {
        uid: 'user123',
        role: 'employee'
      };

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(authMiddleware.logSecurityEvent).toHaveBeenCalledWith(
        'decrypt_validation_error',
        mockReq,
        expect.objectContaining({
          error: 'invalid_payload'
        })
      );
    });

    it('should log decryption errors', async () => {
      mockReq.user = {
        uid: 'user123',
        role: 'employee'
      };

      vi.mocked(hybridEncryption.decryptHybrid).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await handler(mockReq as AuthenticatedVercelRequest, mockRes as VercelResponse);

      expect(authMiddleware.logSecurityEvent).toHaveBeenCalledWith(
        'decrypt_error',
        mockReq,
        expect.objectContaining({
          error: 'Decryption failed'
        })
      );
    });
  });
});
