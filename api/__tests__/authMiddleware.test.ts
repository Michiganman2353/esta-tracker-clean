/**
 * Tests for Authentication Middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  verifyToken, 
  requireAuth, 
  requireRole, 
  isResourceOwner, 
  hasTenantAccess,
  type AuthenticatedVercelRequest 
} from '../lib/authMiddleware';
import * as admin from 'firebase-admin';

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  const mockAuth = {
    verifyIdToken: vi.fn()
  };
  
  return {
    default: {
      apps: [],
      initializeApp: vi.fn(),
      auth: () => mockAuth,
      firestore: () => ({
        collection: vi.fn(() => ({
          add: vi.fn()
        })),
        FieldValue: {
          serverTimestamp: vi.fn()
        }
      })
    },
    apps: [],
    initializeApp: vi.fn(),
    auth: () => mockAuth,
    firestore: () => ({
      collection: vi.fn(() => ({
        add: vi.fn()
      })),
      FieldValue: {
        serverTimestamp: vi.fn()
      }
    })
  };
});

describe('Authentication Middleware', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;

  beforeEach(() => {
    mockReq = {
      headers: {},
      method: 'POST',
      url: '/api/test',
      body: {}
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    vi.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('should fail when no authorization header is provided', async () => {
      const result = await verifyToken(mockReq as VercelRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No authorization header');
      expect(result.statusCode).toBe(401);
    });

    it('should fail when authorization header has invalid format', async () => {
      mockReq.headers = { authorization: 'InvalidFormat token123' };

      const result = await verifyToken(mockReq as VercelRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid authorization header format');
      expect(result.statusCode).toBe(401);
    });

    it('should fail when token is empty', async () => {
      mockReq.headers = { authorization: 'Bearer ' };

      const result = await verifyToken(mockReq as VercelRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No token provided');
      expect(result.statusCode).toBe(401);
    });

    it('should successfully verify valid token', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'employee',
        tenantId: 'tenant123',
        employeeId: 'emp123'
      };

      mockReq.headers = { authorization: 'Bearer valid-token-123' };
      
      const mockVerifyIdToken = vi.fn().mockResolvedValue(mockDecodedToken);
      vi.spyOn(admin, 'auth').mockReturnValue({
        verifyIdToken: mockVerifyIdToken
      } as any);

      const result = await verifyToken(mockReq as VercelRequest);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockDecodedToken);
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token-123');
    });

    it('should fail when token verification throws error', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      
      const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Token expired'));
      vi.spyOn(admin, 'auth').mockReturnValue({
        verifyIdToken: mockVerifyIdToken
      } as any);

      const result = await verifyToken(mockReq as VercelRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired token');
      expect(result.statusCode).toBe(401);
    });
  });

  describe('requireAuth', () => {
    it('should attach user to request on successful authentication', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'employee',
        tenantId: 'tenant123'
      };

      mockReq.headers = { authorization: 'Bearer valid-token' };
      
      const mockVerifyIdToken = vi.fn().mockResolvedValue(mockDecodedToken);
      vi.spyOn(admin, 'auth').mockReturnValue({
        verifyIdToken: mockVerifyIdToken
      } as any);

      const authenticatedReq = mockReq as AuthenticatedVercelRequest;
      const result = await requireAuth(authenticatedReq, mockRes as VercelResponse);

      expect(result.success).toBe(true);
      expect(authenticatedReq.user).toEqual(mockDecodedToken);
    });

    it('should send 401 response on authentication failure', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      
      const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Invalid token'));
      vi.spyOn(admin, 'auth').mockReturnValue({
        verifyIdToken: mockVerifyIdToken
      } as any);

      const authenticatedReq = mockReq as AuthenticatedVercelRequest;
      const result = await requireAuth(authenticatedReq, mockRes as VercelResponse);

      expect(result.success).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Invalid or expired token')
        })
      );
    });
  });

  describe('requireRole', () => {
    it('should return true when user has required role', () => {
      const authenticatedReq: AuthenticatedVercelRequest = {
        ...mockReq,
        user: {
          uid: 'user123',
          role: 'employee'
        }
      } as AuthenticatedVercelRequest;

      const result = requireRole(authenticatedReq, mockRes as VercelResponse, ['employee']);

      expect(result).toBe(true);
    });

    it('should return true when user has one of multiple allowed roles', () => {
      const authenticatedReq: AuthenticatedVercelRequest = {
        ...mockReq,
        user: {
          uid: 'user123',
          role: 'employer'
        }
      } as AuthenticatedVercelRequest;

      const result = requireRole(authenticatedReq, mockRes as VercelResponse, ['employee', 'employer', 'admin']);

      expect(result).toBe(true);
    });

    it('should send 401 when user is not authenticated', () => {
      const authenticatedReq: AuthenticatedVercelRequest = mockReq as AuthenticatedVercelRequest;

      const result = requireRole(authenticatedReq, mockRes as VercelResponse, ['employee']);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Authentication required')
        })
      );
    });

    it('should send 403 when user does not have required role', () => {
      const authenticatedReq: AuthenticatedVercelRequest = {
        ...mockReq,
        user: {
          uid: 'user123',
          role: 'employee'
        }
      } as AuthenticatedVercelRequest;

      const result = requireRole(authenticatedReq, mockRes as VercelResponse, ['admin']);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Insufficient permissions')
        })
      );
    });
  });

  describe('isResourceOwner', () => {
    it('should return true when user uid matches resource owner', () => {
      const authenticatedReq: AuthenticatedVercelRequest = {
        ...mockReq,
        user: {
          uid: 'user123',
          role: 'employee'
        }
      } as AuthenticatedVercelRequest;

      const result = isResourceOwner(authenticatedReq, 'user123');

      expect(result).toBe(true);
    });

    it('should return true when user employeeId matches resource owner', () => {
      const authenticatedReq: AuthenticatedVercelRequest = {
        ...mockReq,
        user: {
          uid: 'user123',
          employeeId: 'emp456',
          role: 'employee'
        }
      } as AuthenticatedVercelRequest;

      const result = isResourceOwner(authenticatedReq, 'emp456');

      expect(result).toBe(true);
    });

    it('should return false when user does not match resource owner', () => {
      const authenticatedReq: AuthenticatedVercelRequest = {
        ...mockReq,
        user: {
          uid: 'user123',
          role: 'employee'
        }
      } as AuthenticatedVercelRequest;

      const result = isResourceOwner(authenticatedReq, 'user999');

      expect(result).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      const authenticatedReq: AuthenticatedVercelRequest = mockReq as AuthenticatedVercelRequest;

      const result = isResourceOwner(authenticatedReq, 'user123');

      expect(result).toBe(false);
    });
  });

  describe('hasTenantAccess', () => {
    it('should return true when user belongs to the tenant', () => {
      const authenticatedReq: AuthenticatedVercelRequest = {
        ...mockReq,
        user: {
          uid: 'user123',
          tenantId: 'tenant123',
          role: 'employee'
        }
      } as AuthenticatedVercelRequest;

      const result = hasTenantAccess(authenticatedReq, 'tenant123');

      expect(result).toBe(true);
    });

    it('should return true for admin users regardless of tenant', () => {
      const authenticatedReq: AuthenticatedVercelRequest = {
        ...mockReq,
        user: {
          uid: 'admin123',
          tenantId: 'tenant123',
          role: 'admin'
        }
      } as AuthenticatedVercelRequest;

      const result = hasTenantAccess(authenticatedReq, 'tenant999');

      expect(result).toBe(true);
    });

    it('should return false when user does not belong to tenant', () => {
      const authenticatedReq: AuthenticatedVercelRequest = {
        ...mockReq,
        user: {
          uid: 'user123',
          tenantId: 'tenant123',
          role: 'employee'
        }
      } as AuthenticatedVercelRequest;

      const result = hasTenantAccess(authenticatedReq, 'tenant999');

      expect(result).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      const authenticatedReq: AuthenticatedVercelRequest = mockReq as AuthenticatedVercelRequest;

      const result = hasTenantAccess(authenticatedReq, 'tenant123');

      expect(result).toBe(false);
    });
  });
});
