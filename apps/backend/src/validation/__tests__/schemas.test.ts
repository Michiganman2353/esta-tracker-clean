/**
 * Unit tests for validation schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  employeeRegistrationSchema,
  managerRegistrationSchema,
  loginSchema,
  passwordChangeSchema,
  employerProfileCreateSchema,
  employeeProfileCreateSchema,
  employeeImportRowSchema,
  workLogCreateSchema,
  sickTimeRequestCreateSchema,
  sickTimeRequestStatusUpdateSchema,
  documentUploadUrlSchema,
  policyCreateSchema,
  policyActivateSchema,
  policyQuerySchema,
  importValidateSchema,
  paginationSchema,
  idParamSchema,
  dateRangeSchema,
} from '../schemas/index.js';

describe('Auth Schemas', () => {
  describe('employeeRegistrationSchema', () => {
    it('should validate valid employee registration data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      const result = employeeRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should fail on missing required fields', () => {
      const data = { name: 'John Doe' };
      const result = employeeRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail on invalid email', () => {
      const data = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      };
      const result = employeeRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail on password too short', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'short',
      };
      const result = employeeRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject unknown fields', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        unknownField: 'value',
      };
      const result = employeeRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should normalize email to lowercase', () => {
      const data = {
        name: 'John Doe',
        email: 'JOHN@EXAMPLE.COM',
        password: 'password123',
      };
      const result = employeeRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should trim name whitespace', () => {
      const data = {
        name: '  John Doe  ',
        email: 'john@example.com',
        password: 'password123',
      };
      const result = employeeRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });
  });

  describe('managerRegistrationSchema', () => {
    it('should validate valid manager registration data', () => {
      const data = {
        name: 'Jane Manager',
        email: 'jane@company.com',
        password: 'password123',
        companyName: 'ACME Corp',
        employeeCount: 50,
      };
      const result = managerRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on employeeCount less than 1', () => {
      const data = {
        name: 'Jane Manager',
        email: 'jane@company.com',
        password: 'password123',
        companyName: 'ACME Corp',
        employeeCount: 0,
      };
      const result = managerRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should coerce employeeCount from string', () => {
      const data = {
        name: 'Jane Manager',
        email: 'jane@company.com',
        password: 'password123',
        companyName: 'ACME Corp',
        employeeCount: '50',
      };
      const result = managerRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.employeeCount).toBe(50);
      }
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const data = {
        email: 'user@example.com',
        password: 'password123',
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on empty password', () => {
      const data = {
        email: 'user@example.com',
        password: '',
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('passwordChangeSchema', () => {
    it('should validate matching passwords', () => {
      const data = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };
      const result = passwordChangeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on non-matching passwords', () => {
      const data = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword',
      };
      const result = passwordChangeSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Employer Schemas', () => {
  describe('employerProfileCreateSchema', () => {
    it('should validate valid employer profile', () => {
      const data = {
        name: 'ACME Corporation',
        employeeCount: 100,
      };
      const result = employerProfileCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with optional address', () => {
      const data = {
        name: 'ACME Corporation',
        employeeCount: 100,
        address: {
          street: '123 Main St',
          city: 'Detroit',
          state: 'MI',
          zipCode: '48201',
        },
      };
      const result = employerProfileCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid ZIP code', () => {
      const data = {
        name: 'ACME Corporation',
        employeeCount: 100,
        address: {
          zipCode: 'invalid',
        },
      };
      const result = employerProfileCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Employee Schemas', () => {
  describe('employeeProfileCreateSchema', () => {
    it('should validate valid employee profile', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        hireDate: '2024-01-15',
      };
      const result = employeeProfileCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid hire date format', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        hireDate: '01-15-2024',
      };
      const result = employeeProfileCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should set default values', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        hireDate: '2024-01-15',
      };
      const result = employeeProfileCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.employmentStatus).toBe('active');
        expect(result.data.hoursPerWeek).toBe(40);
      }
    });
  });

  describe('employeeImportRowSchema', () => {
    it('should validate import row', () => {
      const data = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      };
      const result = employeeImportRowSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe('Work Log Schemas', () => {
  describe('workLogCreateSchema', () => {
    it('should validate valid work log', () => {
      const data = {
        employeeId: 'emp-123',
        date: '2024-01-15',
        hoursWorked: 8,
      };
      const result = workLogCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on hours exceeding 24', () => {
      const data = {
        employeeId: 'emp-123',
        date: '2024-01-15',
        hoursWorked: 25,
      };
      const result = workLogCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should set default overtime hours', () => {
      const data = {
        employeeId: 'emp-123',
        date: '2024-01-15',
        hoursWorked: 8,
      };
      const result = workLogCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.overtimeHours).toBe(0);
      }
    });
  });
});

describe('Request Schemas', () => {
  describe('sickTimeRequestCreateSchema', () => {
    it('should validate valid sick time request', () => {
      const data = {
        startDate: '2024-01-15',
        endDate: '2024-01-16',
        hoursRequested: 8,
        reason: 'personal_illness',
      };
      const result = sickTimeRequestCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail when end date before start date', () => {
      const data = {
        startDate: '2024-01-16',
        endDate: '2024-01-15',
        hoursRequested: 8,
        reason: 'personal_illness',
      };
      const result = sickTimeRequestCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail on invalid reason', () => {
      const data = {
        startDate: '2024-01-15',
        endDate: '2024-01-16',
        hoursRequested: 8,
        reason: 'invalid_reason',
      };
      const result = sickTimeRequestCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('sickTimeRequestStatusUpdateSchema', () => {
    it('should validate status update', () => {
      const data = {
        status: 'approved',
        notes: 'Approved by manager',
      };
      const result = sickTimeRequestStatusUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid status', () => {
      const data = {
        status: 'invalid_status',
      };
      const result = sickTimeRequestStatusUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Document Schemas', () => {
  describe('documentUploadUrlSchema', () => {
    it('should validate valid upload request', () => {
      const data = {
        requestId: 'req-123',
        fileName: 'document.pdf',
        contentType: 'application/pdf',
      };
      const result = documentUploadUrlSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid content type', () => {
      const data = {
        requestId: 'req-123',
        fileName: 'document.exe',
        contentType: 'application/exe',
      };
      const result = documentUploadUrlSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail on invalid file name characters', () => {
      const data = {
        requestId: 'req-123',
        fileName: 'document<script>.pdf',
        contentType: 'application/pdf',
      };
      const result = documentUploadUrlSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Policy Schemas', () => {
  describe('policyCreateSchema', () => {
    it('should validate valid policy creation', () => {
      const data = {
        basePolicyId: 'policy-base-123',
        customizations: {
          name: 'Custom Policy',
        },
      };
      const result = policyCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('policyActivateSchema', () => {
    it('should validate policy activation', () => {
      const data = {
        policyId: 'policy-123',
      };
      const result = policyActivateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('policyQuerySchema', () => {
    it('should validate employer size query', () => {
      const data = {
        employerSize: 'small',
      };
      const result = policyQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid employer size', () => {
      const data = {
        employerSize: 'medium',
      };
      const result = policyQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Import Schemas', () => {
  describe('importValidateSchema', () => {
    it('should validate import validation request', () => {
      const data = {
        type: 'employees',
        data: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
        metadata: {
          fileName: 'employees.csv',
          totalRows: 1,
          validRows: 1,
          errors: 0,
          warnings: 0,
        },
      };
      const result = importValidateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on empty data array', () => {
      const data = {
        type: 'employees',
        data: [],
        metadata: {
          fileName: 'employees.csv',
          totalRows: 0,
          validRows: 0,
          errors: 0,
          warnings: 0,
        },
      };
      const result = importValidateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Common Schemas', () => {
  describe('paginationSchema', () => {
    it('should set defaults', () => {
      const data = {};
      const result = paginationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should fail on limit exceeding 100', () => {
      const data = {
        page: 1,
        limit: 101,
      };
      const result = paginationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('idParamSchema', () => {
    it('should validate ID', () => {
      const data = { id: 'some-id-123' };
      const result = idParamSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail on empty ID', () => {
      const data = { id: '' };
      const result = idParamSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('dateRangeSchema', () => {
    it('should validate valid date range', () => {
      const data = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const result = dateRangeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail when start date after end date', () => {
      const data = {
        startDate: '2024-01-31',
        endDate: '2024-01-01',
      };
      const result = dateRangeSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
