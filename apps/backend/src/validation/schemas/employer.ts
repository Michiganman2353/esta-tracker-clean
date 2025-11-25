/**
 * Zod validation schemas for employer-related operations.
 */

import { z } from 'zod';

/**
 * Employer size enum based on Michigan ESTA law.
 */
export const employerSizeSchema = z.enum(['small', 'large'], {
  errorMap: () => ({ message: 'Employer size must be "small" or "large"' }),
});

export type EmployerSize = z.infer<typeof employerSizeSchema>;

/**
 * Schema for creating an employer profile.
 */
export const employerProfileCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Company name is required')
      .max(200, 'Company name must be 200 characters or less'),
    employeeCount: z
      .number({ coerce: true })
      .int('Employee count must be a whole number')
      .min(1, 'Employee count must be at least 1')
      .max(1000000, 'Employee count must be 1,000,000 or less'),
    address: z
      .object({
        street: z.string().trim().max(200, 'Street address must be 200 characters or less').optional(),
        city: z.string().trim().max(100, 'City must be 100 characters or less').optional(),
        state: z.string().trim().length(2, 'State must be a 2-letter code').optional(),
        zipCode: z
          .string()
          .trim()
          .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
          .optional(),
      })
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number format')
      .max(20, 'Phone number must be 20 characters or less')
      .optional(),
    website: z
      .string()
      .trim()
      .url('Invalid website URL')
      .max(255, 'Website URL must be 255 characters or less')
      .optional(),
    industry: z
      .string()
      .trim()
      .max(100, 'Industry must be 100 characters or less')
      .optional(),
  })
  .strict();

export type EmployerProfileCreateInput = z.infer<typeof employerProfileCreateSchema>;

/**
 * Schema for updating employer settings.
 */
export const employerSettingsUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Company name is required')
      .max(200, 'Company name must be 200 characters or less')
      .optional(),
    employeeCount: z
      .number({ coerce: true })
      .int('Employee count must be a whole number')
      .min(1, 'Employee count must be at least 1')
      .max(1000000, 'Employee count must be 1,000,000 or less')
      .optional(),
    address: z
      .object({
        street: z.string().trim().max(200).optional(),
        city: z.string().trim().max(100).optional(),
        state: z.string().trim().length(2).optional(),
        zipCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/).optional(),
      })
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
      .max(20)
      .optional(),
    website: z.string().trim().url().max(255).optional(),
    industry: z.string().trim().max(100).optional(),
  })
  .strict();

export type EmployerSettingsUpdateInput = z.infer<typeof employerSettingsUpdateSchema>;
