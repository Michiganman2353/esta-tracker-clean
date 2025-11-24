import { Request, Response, NextFunction } from 'express';
import { getAuth, getFirestore } from '../services/firebase.js';

/**
 * Extended Express Request with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    tenantId?: string;
    [key: string]: unknown;
  };
}

/**
 * Authentication middleware that verifies Firebase ID tokens
 * Extracts user information from the token and attaches to request
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided',
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token format',
      });
      return;
    }

    // Verify the ID token with checkRevoked option for security
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken, true);

    // Get user data from Firestore for up-to-date role information
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: User not found',
      });
      return;
    }

    const userData = userDoc.data();

    // Check if user is approved
    if (userData?.status !== 'approved') {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Account not approved',
      });
      return;
    }

    // Attach user data to request
    req.user = {
      ...decodedToken,
      uid: decodedToken.uid,
      email: decodedToken.email || userData?.email,
      role: userData?.role || decodedToken.role,
      tenantId: userData?.tenantId || userData?.employerId || decodedToken.tenantId,
      status: userData?.status,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    const err = error as { code?: string };
    
    if (err.code === 'auth/id-token-expired') {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Token expired',
      });
    } else if (err.code === 'auth/id-token-revoked') {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Token revoked',
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token',
      });
    }
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block if missing
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      
      if (idToken) {
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(idToken);
        
        // Get user data from Firestore
        const db = getFirestore();
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.exists ? userDoc.data() : undefined;
        
        req.user = {
          ...decodedToken,
          uid: decodedToken.uid,
          email: decodedToken.email || userData?.email,
          role: userData?.role || decodedToken.role,
          tenantId: userData?.tenantId || userData?.employerId || decodedToken.tenantId,
        };
      }
    }

    next();
  } catch (error) {
    // Fail silently for optional auth
    console.warn('Optional authentication failed:', error);
    next();
  }
}

/**
 * Middleware to require specific role(s)
 * Must be used after authenticate middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
      return;
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require employer or admin role
 * Convenience wrapper for requireRole
 */
export function requireEmployer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireRole('employer', 'admin')(req, res, next);
}

/**
 * Middleware to validate tenant access
 * Ensures user can only access data from their own tenant
 */
export function validateTenantAccess(tenantIdParam: string = 'tenantId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
      return;
    }

    const requestedTenantId = req.params[tenantIdParam] || req.body[tenantIdParam];
    const userTenantId = req.user.tenantId;

    if (!requestedTenantId) {
      res.status(400).json({
        success: false,
        error: 'Bad Request: Tenant ID required',
      });
      return;
    }

    // Admins can access any tenant
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Regular users can only access their own tenant
    if (requestedTenantId !== userTenantId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot access other tenant data',
      });
      return;
    }

    next();
  };
}

/**
 * Rate limiting middleware using in-memory store
 * In production, use Redis or similar for distributed rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const key = req.user?.uid || req.ip || 'anonymous';
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // Reset or initialize
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    
    if (record.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too Many Requests: Rate limit exceeded',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }
    
    record.count++;
    next();
  };
}

/**
 * Input validation middleware
 */
export function validateInput(schema: Record<string, (value: unknown) => boolean | string>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    
    for (const [field, validator] of Object.entries(schema)) {
      const value = req.body[field];
      const result = validator(value);
      
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `Invalid ${field}`);
      }
    }
    
    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }
    
    next();
  };
}
