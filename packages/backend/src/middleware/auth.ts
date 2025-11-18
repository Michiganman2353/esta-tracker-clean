import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../services/firebase.js';

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

    // Verify the ID token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    // Attach user data to request
    req.user = {
      ...decodedToken,
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role,
      tenantId: decodedToken.tenantId,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired token',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block if missing
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      
      if (idToken) {
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(idToken);
        
        req.user = {
          ...decodedToken,
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.role,
          tenantId: decodedToken.tenantId,
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
