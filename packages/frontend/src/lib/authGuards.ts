/**
 * Client-Side Authentication and Authorization Guards
 * 
 * This module provides comprehensive auth guards for the ESTA Tracker SaaS app.
 * Since this is a React SPA, these guards run client-side but provide:
 * - Authentication verification
 * - Email verification checks  
 * - Tenant/employer matching
 * - Role-based access control (employer, admin, employee)
 * - Redirect logic for unauthorized access
 * 
 * These work in conjunction with Firebase Authentication and the Edge Middleware.
 */

import { User } from '../types';

/**
 * Route access configuration
 */
const ROUTE_ACCESS = {
  // Public routes - no authentication required
  PUBLIC: [
    '/login',
    '/register',
    '/register/employee',
    '/register/manager',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/maintenance',
  ],

  // Status pages - accessible with partial auth
  STATUS: [
    '/verify-email',
    '/pending-approval',
    '/account-rejected',
  ],

  // Employer-only routes
  EMPLOYER: [
    '/employer',
    '/audit',
    '/settings',
    '/manage-employees',
    '/reports',
  ],

  // Admin-only routes
  ADMIN: [
    '/admin',
    '/users',
    '/tenants',
    '/system-settings',
  ],

  // Employee routes (accessible by employees and employers for their data)
  EMPLOYEE: [
    '/employee',
    '/requests',
    '/balance',
    '/my-profile',
  ],
};

export interface AuthGuardResult {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
  requiresEmailVerification?: boolean;
  requiresApproval?: boolean;
}

/**
 * Check if a route is public and doesn't require authentication
 */
export function isPublicRoute(pathname: string): boolean {
  return ROUTE_ACCESS.PUBLIC.some(route => pathname.startsWith(route));
}

/**
 * Check if a route is a status page
 */
export function isStatusRoute(pathname: string): boolean {
  return ROUTE_ACCESS.STATUS.some(route => pathname.startsWith(route));
}

/**
 * Check if user has email verified
 */
export function checkEmailVerification(user: User | null): AuthGuardResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'Not authenticated',
      redirectTo: '/login',
    };
  }

  // For now, we assume that if user has 'status' they have verified email
  // In production, this would check Firebase user.emailVerified
  // The email verification is handled by Firebase Auth directly
  // This is a placeholder for additional email verification checks if needed
  
  return { allowed: true };
}

/**
 * Check account approval status
 */
export function checkAccountStatus(user: User | null): AuthGuardResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'Not authenticated',
      redirectTo: '/login',
    };
  }

  // Check if account is pending approval (typically for employers/managers)
  if (user.status === 'pending') {
    return {
      allowed: false,
      reason: 'Account pending approval',
      redirectTo: '/pending-approval',
      requiresApproval: true,
    };
  }

  // Check if account is rejected
  if (user.status === 'rejected') {
    return {
      allowed: false,
      reason: 'Account rejected',
      redirectTo: '/account-rejected',
    };
  }

  return { allowed: true };
}

/**
 * Check tenant/employer matching
 * Ensures users can only access their own tenant's data
 */
export function checkTenantMatch(
  user: User | null,
  requestedTenantId?: string
): AuthGuardResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'Not authenticated',
      redirectTo: '/login',
    };
  }

  // If no specific tenant requested, allow
  if (!requestedTenantId) {
    return { allowed: true };
  }

  // Admin can access all tenants
  if (user.role === 'admin') {
    return { allowed: true };
  }

  // Check if user's tenant matches requested tenant
  const userTenantId = user.employerId;
  
  if (!userTenantId) {
    return {
      allowed: false,
      reason: 'User not assigned to any tenant',
      redirectTo: '/',
    };
  }

  if (userTenantId !== requestedTenantId) {
    return {
      allowed: false,
      reason: 'Unauthorized access to tenant data',
      redirectTo: '/',
    };
  }

  return { allowed: true };
}

/**
 * Check role-based access control for a given route
 */
export function checkRoleAccess(
  pathname: string,
  user: User | null
): AuthGuardResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'Not authenticated',
      redirectTo: '/login',
    };
  }

  // Admin can access everything
  if (user.role === 'admin') {
    return { allowed: true };
  }

  // At this point, TypeScript knows role is 'employee' | 'employer'
  const role = user.role;

  // Check employer-only routes
  if (ROUTE_ACCESS.EMPLOYER.some(route => pathname.startsWith(route))) {
    if (role !== 'employer') {
      return {
        allowed: false,
        reason: 'Employer access required',
        redirectTo: '/employee', // Redirect to employee dashboard
      };
    }
  }

  // Check admin-only routes (employer and employee would have been caught above)
  if (ROUTE_ACCESS.ADMIN.some(route => pathname.startsWith(route))) {
    // Already checked admin above, so this is unreachable for admin
    return {
      allowed: false,
      reason: 'Admin access required',
      redirectTo: role === 'employer' ? '/employer' : '/employee',
    };
  }

  // Employee routes are accessible by all authenticated users
  // (they see their own data)
  
  return { allowed: true };
}

/**
 * Comprehensive auth guard that checks all conditions
 */
export function checkAuth(
  pathname: string,
  user: User | null,
  options: {
    tenantId?: string;
    skipEmailVerification?: boolean;
    skipApprovalCheck?: boolean;
  } = {}
): AuthGuardResult {
  // Allow public routes
  if (isPublicRoute(pathname)) {
    return { allowed: true };
  }

  // Allow status routes with partial auth
  if (isStatusRoute(pathname)) {
    return { allowed: true };
  }

  // Check authentication
  if (!user) {
    return {
      allowed: false,
      reason: 'Authentication required',
      redirectTo: `/login?redirect=${encodeURIComponent(pathname)}`,
    };
  }

  // Check email verification (unless skipped for status pages)
  if (!options.skipEmailVerification) {
    const emailCheck = checkEmailVerification(user);
    if (!emailCheck.allowed) {
      return emailCheck;
    }
  }

  // Check account status (unless skipped for status pages)
  if (!options.skipApprovalCheck) {
    const statusCheck = checkAccountStatus(user);
    if (!statusCheck.allowed) {
      return statusCheck;
    }
  }

  // Check tenant matching if tenant ID is provided
  if (options.tenantId) {
    const tenantCheck = checkTenantMatch(user, options.tenantId);
    if (!tenantCheck.allowed) {
      return tenantCheck;
    }
  }

  // Check role-based access
  const roleCheck = checkRoleAccess(pathname, user);
  if (!roleCheck.allowed) {
    return roleCheck;
  }

  return { allowed: true };
}

/**
 * Get the appropriate dashboard route for a user based on their role
 */
export function getDashboardRoute(user: User | null): string {
  if (!user) return '/login';

  switch (user.role) {
    case 'admin':
      return '/admin';
    case 'employer':
      return '/employer';
    case 'employee':
      return '/employee';
    default:
      return '/';
  }
}

/**
 * Check if user can access another user's data
 */
export function canAccessUserData(
  currentUser: User | null,
  targetUserId: string
): boolean {
  if (!currentUser) return false;

  // Admin can access all users
  if (currentUser.role === 'admin') return true;

  // User can access their own data
  if (currentUser.id === targetUserId) return true;

  // Employer can access their employees' data
  if (currentUser.role === 'employer') {
    // Would need to check if targetUser belongs to same employer
    // This would require fetching target user data
    // For now, return false - implement full check in API layer
    return false;
  }

  return false;
}

/**
 * Check if user can perform a specific action
 */
export function checkPermission(
  user: User | null,
  action: 'view' | 'edit' | 'delete' | 'approve' | 'manage',
  resource: 'employee' | 'request' | 'audit' | 'settings' | 'tenant'
): boolean {
  if (!user) return false;

  // Admin has all permissions
  if (user.role === 'admin') return true;

  // Employer permissions
  if (user.role === 'employer') {
    switch (resource) {
      case 'employee':
        return ['view', 'edit', 'manage'].includes(action);
      case 'request':
        return ['view', 'approve'].includes(action);
      case 'audit':
        return action === 'view';
      case 'settings':
        return ['view', 'edit'].includes(action);
      default:
        return false;
    }
  }

  // Employee permissions
  if (user.role === 'employee') {
    switch (resource) {
      case 'request':
        return action === 'view'; // Can view their own requests
      case 'employee':
        return action === 'view'; // Can view their own profile
      default:
        return false;
    }
  }

  return false;
}
