/**
 * Zod validation schemas for employee profile operations.
 */

import { z } from 'zod';

/**
 * Employment status enum.
 */
export const employmentStatusSchema = z.enum(
  ['active', 'inactive', 'terminated', 'on_leave'],
  {
    errorMap: () => ({
      message:
        'Employment status must be "active", "inactive", "terminated", or "on_leave"',
    }),
  }
);

export type EmploymentStatus = z.infer<typeof employmentStatusSchema>;

/**
 * Schema for creating an employee profile.
 */
export const employeeProfileCreateSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .max(50, 'First name must be 50 characters or less'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be 50 characters or less'),
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .max(255, 'Email must be 255 characters or less')
      .transform((val) => val.toLowerCase()),
    hireDate: z
      .string()
      .trim()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Hire date must be in YYYY-MM-DD format'
      )
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: 'Invalid hire date',
      }),
    department: z
      .string()
      .trim()
      .max(100, 'Department must be 100 characters or less')
      .optional(),
    jobTitle: z
      .string()
      .trim()
      .max(100, 'Job title must be 100 characters or less')
      .optional(),
    employmentStatus: employmentStatusSchema.default('active'),
    hoursPerWeek: z
      .number({ coerce: true })
      .min(0, 'Hours per week must be at least 0')
      .max(168, 'Hours per week cannot exceed 168')
      .default(40),
    phone: z
      .string()
      .trim()
      .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number format')
      .max(20, 'Phone number must be 20 characters or less')
      .optional(),
  })
  .strict();

export type EmployeeProfileCreateInput = z.infer<typeof employeeProfileCreateSchema>;

/**
 * Schema for updating an employee profile.
 */
export const employeeProfileUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().min(1).max(50).optional(),
    email: z
      .string()
      .trim()
      .email()
      .max(255)
      .transform((val) => val.toLowerCase())
      .optional(),
    hireDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: 'Invalid hire date',
      })
      .optional(),
    department: z.string().trim().max(100).optional(),
    jobTitle: z.string().trim().max(100).optional(),
    employmentStatus: employmentStatusSchema.optional(),
    hoursPerWeek: z.number({ coerce: true }).min(0).max(168).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
      .max(20)
      .optional(),
  })
  .strict();

export type EmployeeProfileUpdateInput = z.infer<typeof employeeProfileUpdateSchema>;

/**
 * Schema for bulk employee import from CSV.
 */
export const employeeImportRowSchema = z
  .object({
    firstName: z.string().trim().min(1).max(50),
    lastName: z.string().trim().min(1).max(50),
    email: z
      .string()
      .trim()
      .email()
      .max(255)
      .transform((val) => val.toLowerCase()),
    hireDate: z
      .string()
      .trim()
      .optional(),
    department: z.string().trim().max(100).optional(),
    employmentStatus: z
      .string()
      .trim()
      .transform((val) => val.toLowerCase())
      .pipe(employmentStatusSchema)
      .optional()
      .default('active'),
    hoursPerWeek: z.number({ coerce: true }).min(0).max(168).optional().default(40),
  })
  .strict();

export type EmployeeImportRowInput = z.infer<typeof employeeImportRowSchema>;
