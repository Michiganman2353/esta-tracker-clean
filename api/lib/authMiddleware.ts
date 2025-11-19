/**
 * Authentication Middleware for Vercel Serverless Functions
 * 
 * Provides Firebase authentication and role-based authorization
 * for API endpoints deployed on Vercel.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Extended Vercel Request with authenticated user data
 */
export interface AuthenticatedVercelRequest extends VercelRequest {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    tenantId?: string;
    employeeId?: string;
    [key: string]: any;
  };
}

/**
 * User role types
 */
export type UserRole = 'employee' | 'employer' | 'admin';

/**
 * Authentication result
 */
interface AuthResult {
  success: boolean;
  user?: AuthenticatedVercelRequest['user'];
  error?: string;
  statusCode?: number;
}

/**
 * Extract and verify Firebase ID token from request
 * 
 * @param req - Vercel request object
 * @returns Authentication result
 */
export async function verifyToken(req: VercelRequest): Promise<AuthResult> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return {
        success: false,
        error: 'Unauthorized: No authorization header provided',
        statusCode: 401
      };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Unauthorized: Invalid authorization header format',
        statusCode: 401
      };
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      return {
        success: false,
        error: 'Unauthorized: No token provided',
        statusCode: 401
      };
    }

    // Verify the ID token
    const auth = admin.auth();
    const decodedToken = await auth.verifyIdToken(idToken);

    // Extract user data from token
    const user: AuthenticatedVercelRequest['user'] = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role,
      tenantId: decodedToken.tenantId,
      employeeId: decodedToken.employeeId,
    };

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Token verification error:', error);
    
    return {
      success: false,
      error: 'Unauthorized: Invalid or expired token',
      statusCode: 401
    };
  }
}

/**
 * Middleware to require authentication
 * Attaches user data to request if authentication succeeds
 * 
 * @param req - Vercel request object
 * @param res - Vercel response object
 * @returns Authentication result
 */
export async function requireAuth(
  req: AuthenticatedVercelRequest,
  res: VercelResponse
): Promise<AuthResult> {
  const authResult = await verifyToken(req);

  if (!authResult.success) {
    res.status(authResult.statusCode || 401).json({
      success: false,
      error: authResult.error
    });
    return authResult;
  }

  // Attach user to request
  req.user = authResult.user;

  return authResult;
}

/**
 * Middleware to require specific role(s)
 * 
 * @param req - Authenticated Vercel request object
 * @param res - Vercel response object
 * @param allowedRoles - Array of allowed roles
 * @returns Whether user has required role
 */
export function requireRole(
  req: AuthenticatedVercelRequest,
  res: VercelResponse,
  allowedRoles: UserRole[]
): boolean {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required'
    });
    return false;
  }

  const userRole = req.user.role;

  if (!userRole || !allowedRoles.includes(userRole as UserRole)) {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Insufficient permissions'
    });
    return false;
  }

  return true;
}

/**
 * Check if user owns a resource
 * 
 * @param req - Authenticated Vercel request object
 * @param resourceUserId - User ID that owns the resource
 * @returns Whether user owns the resource
 */
export function isResourceOwner(
  req: AuthenticatedVercelRequest,
  resourceUserId: string
): boolean {
  if (!req.user) {
    return false;
  }

  return req.user.uid === resourceUserId || req.user.employeeId === resourceUserId;
}

/**
 * Check if user has access to tenant data
 * 
 * @param req - Authenticated Vercel request object
 * @param tenantId - Tenant ID to check access for
 * @returns Whether user has access to tenant
 */
export function hasTenantAccess(
  req: AuthenticatedVercelRequest,
  tenantId: string
): boolean {
  if (!req.user) {
    return false;
  }

  // Admins have access to all tenants
  if (req.user.role === 'admin') {
    return true;
  }

  // Check if user belongs to the tenant
  return req.user.tenantId === tenantId;
}

/**
 * Log security-relevant events
 * 
 * @param event - Event type
 * @param req - Authenticated Vercel request object
 * @param details - Additional details to log
 */
export async function logSecurityEvent(
  event: string,
  req: AuthenticatedVercelRequest,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    const db = admin.firestore();
    
    await db.collection('securityLogs').add({
      event,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: req.user?.uid || 'anonymous',
      email: req.user?.email || 'unknown',
      role: req.user?.role || 'unknown',
      tenantId: req.user?.tenantId || null,
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      path: req.url,
      method: req.method,
      ...details
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log security event:', error);
  }
}
