/**
 * Zod validation schemas for authentication and user-related operations.
 * These schemas define the structure and constraints for all auth payloads.
 */

import { z } from 'zod';

/**
 * Common email validation pattern.
 */
const emailSchema = z
  .string()
  .trim()
  .email('Invalid email address')
  .max(255, 'Email must be 255 characters or less')
  .transform((val) => val.toLowerCase());

/**
 * Common password validation.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or less');

/**
 * Common name validation.
 */
const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or less');

/**
 * Schema for employee registration.
 */
export const employeeRegistrationSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export type EmployeeRegistrationInput = z.infer<typeof employeeRegistrationSchema>;

/**
 * Schema for manager/employer registration.
 */
export const managerRegistrationSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    companyName: z
      .string()
      .trim()
      .min(1, 'Company name is required')
      .max(200, 'Company name must be 200 characters or less'),
    employeeCount: z
      .number({ coerce: true })
      .int('Employee count must be a whole number')
      .min(1, 'Employee count must be at least 1')
      .max(1000000, 'Employee count must be 1,000,000 or less'),
  })
  .strict();

export type ManagerRegistrationInput = z.infer<typeof managerRegistrationSchema>;

/**
 * Schema for user login.
 */
export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema for updating user profile.
 */
export const userProfileUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number format')
      .max(20, 'Phone number must be 20 characters or less')
      .optional(),
    department: z
      .string()
      .trim()
      .max(100, 'Department must be 100 characters or less')
      .optional(),
  })
  .strict();

export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;

/**
 * Schema for password change.
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
