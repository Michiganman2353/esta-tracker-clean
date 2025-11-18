/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication and authorization.
 * Automatically redirects users based on auth state and permissions.
 */

import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';
import { checkAuth, isPublicRoute, isStatusRoute } from '../lib/authGuards';

interface ProtectedRouteProps {
  children: ReactNode;
  user: User | null;
  requireRole?: 'employee' | 'employer' | 'admin';
  requireApproved?: boolean;
  requireEmailVerified?: boolean;
  tenantId?: string;
}

export function ProtectedRoute({
  children,
  user,
  requireRole,
  requireApproved = true,
  requireEmailVerified = true,
  tenantId,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    // Skip checks for public and status routes
    if (isPublicRoute(pathname) || isStatusRoute(pathname)) {
      return;
    }

    // Run comprehensive auth check
    const authResult = checkAuth(pathname, user, {
      tenantId,
      skipEmailVerification: !requireEmailVerified,
      skipApprovalCheck: !requireApproved,
    });

    // If not allowed, redirect
    if (!authResult.allowed && authResult.redirectTo) {
      navigate(authResult.redirectTo, { replace: true });
      return;
    }

    // Additional role check if specified
    if (requireRole && user && user.role !== requireRole && user.role !== 'admin') {
      // Redirect to appropriate dashboard
      const dashboardPath = user.role === 'employer' ? '/employer' : '/employee';
      navigate(dashboardPath, { replace: true });
    }
  }, [user, location.pathname, navigate, requireRole, requireApproved, requireEmailVerified, tenantId]);

  // Show loading state while checking
  if (!user && !isPublicRoute(location.pathname) && !isStatusRoute(location.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
