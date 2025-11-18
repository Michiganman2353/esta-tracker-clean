/**
 * Tests for Authentication Guards
 */

import { describe, it, expect } from 'vitest';
import {
  isPublicRoute,
  isStatusRoute,
  checkEmailVerification,
  checkAccountStatus,
  checkTenantMatch,
  checkRoleAccess,
  checkAuth,
  getDashboardRoute,
  canAccessUserData,
  checkPermission,
} from './authGuards';
import { User } from '../types';

// Mock user data
const mockEmployeeUser: User = {
  id: 'emp-123',
  email: 'employee@test.com',
  name: 'Test Employee',
  role: 'employee',
  employerId: 'tenant-1',
  employerSize: 'large',
  status: 'approved',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockEmployerUser: User = {
  id: 'emp-456',
  email: 'employer@test.com',
  name: 'Test Employer',
  role: 'employer',
  employerId: 'tenant-1',
  employerSize: 'large',
  status: 'approved',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockAdminUser: User = {
  id: 'admin-789',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'admin',
  employerId: 'tenant-1',
  employerSize: 'large',
  status: 'approved',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockPendingUser: User = {
  id: 'pending-123',
  email: 'pending@test.com',
  name: 'Pending User',
  role: 'employer',
  employerId: 'tenant-1',
  employerSize: 'small',
  status: 'pending',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockRejectedUser: User = {
  id: 'rejected-123',
  email: 'rejected@test.com',
  name: 'Rejected User',
  role: 'employer',
  employerId: 'tenant-1',
  employerSize: 'small',
  status: 'rejected',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('Route Type Checks', () => {
  it('should identify public routes', () => {
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/register')).toBe(true);
    expect(isPublicRoute('/register/employee')).toBe(true);
    expect(isPublicRoute('/register/manager')).toBe(true);
    expect(isPublicRoute('/forgot-password')).toBe(true);
    expect(isPublicRoute('/employee')).toBe(false);
    expect(isPublicRoute('/employer')).toBe(false);
  });

  it('should identify status routes', () => {
    expect(isStatusRoute('/verify-email')).toBe(true);
    expect(isStatusRoute('/pending-approval')).toBe(true);
    expect(isStatusRoute('/account-rejected')).toBe(true);
    expect(isStatusRoute('/employee')).toBe(false);
  });
});

describe('Email Verification Check', () => {
  it('should allow approved users', () => {
    const result = checkEmailVerification(mockEmployeeUser);
    expect(result.allowed).toBe(true);
  });

  it('should allow pending users (email verification is separate from approval)', () => {
    const result = checkEmailVerification(mockPendingUser);
    expect(result.allowed).toBe(true);
  });

  it('should block unauthenticated users', () => {
    const result = checkEmailVerification(null);
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/login');
  });
});

describe('Account Status Check', () => {
  it('should allow approved users', () => {
    const result = checkAccountStatus(mockEmployeeUser);
    expect(result.allowed).toBe(true);
  });

  it('should block pending users', () => {
    const result = checkAccountStatus(mockPendingUser);
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/pending-approval');
    expect(result.requiresApproval).toBe(true);
  });

  it('should block rejected users', () => {
    const result = checkAccountStatus(mockRejectedUser);
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/account-rejected');
  });
});

describe('Tenant Matching', () => {
  it('should allow access to own tenant', () => {
    const result = checkTenantMatch(mockEmployeeUser, 'tenant-1');
    expect(result.allowed).toBe(true);
  });

  it('should block access to different tenant', () => {
    const result = checkTenantMatch(mockEmployeeUser, 'tenant-2');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Unauthorized');
  });

  it('should allow admin to access any tenant', () => {
    const result = checkTenantMatch(mockAdminUser, 'tenant-2');
    expect(result.allowed).toBe(true);
  });

  it('should allow when no tenant specified', () => {
    const result = checkTenantMatch(mockEmployeeUser, undefined);
    expect(result.allowed).toBe(true);
  });
});

describe('Role-Based Access', () => {
  it('should allow employee to access employee routes', () => {
    const result = checkRoleAccess('/employee', mockEmployeeUser);
    expect(result.allowed).toBe(true);
  });

  it('should block employee from employer routes', () => {
    const result = checkRoleAccess('/employer', mockEmployeeUser);
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/employee');
  });

  it('should allow employer to access employer routes', () => {
    const result = checkRoleAccess('/employer', mockEmployerUser);
    expect(result.allowed).toBe(true);
  });

  it('should allow employer to access audit logs', () => {
    const result = checkRoleAccess('/audit', mockEmployerUser);
    expect(result.allowed).toBe(true);
  });

  it('should block employee from admin routes', () => {
    const result = checkRoleAccess('/admin', mockEmployeeUser);
    expect(result.allowed).toBe(false);
  });

  it('should allow admin to access all routes', () => {
    expect(checkRoleAccess('/employee', mockAdminUser).allowed).toBe(true);
    expect(checkRoleAccess('/employer', mockAdminUser).allowed).toBe(true);
    expect(checkRoleAccess('/audit', mockAdminUser).allowed).toBe(true);
    expect(checkRoleAccess('/admin', mockAdminUser).allowed).toBe(true);
  });
});

describe('Comprehensive Auth Check', () => {
  it('should allow public routes without authentication', () => {
    const result = checkAuth('/login', null);
    expect(result.allowed).toBe(true);
  });

  it('should block protected routes without authentication', () => {
    const result = checkAuth('/employee', null);
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toContain('/login');
  });

  it('should allow authenticated approved user to access their routes', () => {
    const result = checkAuth('/employee', mockEmployeeUser);
    expect(result.allowed).toBe(true);
  });

  it('should block pending user from protected routes', () => {
    const result = checkAuth('/employee', mockPendingUser);
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/pending-approval');
  });

  it('should block rejected user from protected routes', () => {
    const result = checkAuth('/employee', mockRejectedUser);
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/account-rejected');
  });

  it('should enforce tenant matching', () => {
    const result = checkAuth('/employee', mockEmployeeUser, { tenantId: 'tenant-2' });
    expect(result.allowed).toBe(false);
  });

  it('should enforce role-based access', () => {
    const result = checkAuth('/employer', mockEmployeeUser);
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/employee');
  });
});

describe('Dashboard Routes', () => {
  it('should return employee dashboard for employee', () => {
    expect(getDashboardRoute(mockEmployeeUser)).toBe('/employee');
  });

  it('should return employer dashboard for employer', () => {
    expect(getDashboardRoute(mockEmployerUser)).toBe('/employer');
  });

  it('should return admin dashboard for admin', () => {
    expect(getDashboardRoute(mockAdminUser)).toBe('/admin');
  });

  it('should return login for unauthenticated', () => {
    expect(getDashboardRoute(null)).toBe('/login');
  });
});

describe('User Data Access', () => {
  it('should allow user to access their own data', () => {
    expect(canAccessUserData(mockEmployeeUser, 'emp-123')).toBe(true);
  });

  it('should block user from accessing other user data', () => {
    expect(canAccessUserData(mockEmployeeUser, 'other-123')).toBe(false);
  });

  it('should allow admin to access all user data', () => {
    expect(canAccessUserData(mockAdminUser, 'other-123')).toBe(true);
  });
});

describe('Permission Checks', () => {
  describe('Admin Permissions', () => {
    it('should grant all permissions to admin', () => {
      expect(checkPermission(mockAdminUser, 'view', 'employee')).toBe(true);
      expect(checkPermission(mockAdminUser, 'edit', 'employee')).toBe(true);
      expect(checkPermission(mockAdminUser, 'delete', 'employee')).toBe(true);
      expect(checkPermission(mockAdminUser, 'approve', 'request')).toBe(true);
      expect(checkPermission(mockAdminUser, 'manage', 'tenant')).toBe(true);
    });
  });

  describe('Employer Permissions', () => {
    it('should allow viewing employees', () => {
      expect(checkPermission(mockEmployerUser, 'view', 'employee')).toBe(true);
    });

    it('should allow managing employees', () => {
      expect(checkPermission(mockEmployerUser, 'manage', 'employee')).toBe(true);
    });

    it('should allow approving requests', () => {
      expect(checkPermission(mockEmployerUser, 'approve', 'request')).toBe(true);
    });

    it('should allow viewing audit logs', () => {
      expect(checkPermission(mockEmployerUser, 'view', 'audit')).toBe(true);
    });

    it('should not allow deleting employees', () => {
      expect(checkPermission(mockEmployerUser, 'delete', 'employee')).toBe(false);
    });
  });

  describe('Employee Permissions', () => {
    it('should allow viewing own requests', () => {
      expect(checkPermission(mockEmployeeUser, 'view', 'request')).toBe(true);
    });

    it('should allow viewing own profile', () => {
      expect(checkPermission(mockEmployeeUser, 'view', 'employee')).toBe(true);
    });

    it('should not allow approving requests', () => {
      expect(checkPermission(mockEmployeeUser, 'approve', 'request')).toBe(false);
    });

    it('should not allow viewing settings', () => {
      expect(checkPermission(mockEmployeeUser, 'view', 'settings')).toBe(false);
    });
  });
});
