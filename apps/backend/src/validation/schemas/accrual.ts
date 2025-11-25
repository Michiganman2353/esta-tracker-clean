/**
 * Zod validation schemas for accrual and work log operations.
 */

import { z } from 'zod';

/**
 * Schema for logging work hours.
 */
export const workLogCreateSchema = z
  .object({
    employeeId: z
      .string()
      .trim()
      .min(1, 'Employee ID is required'),
    date: z
      .string()
      .trim()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Date must be in YYYY-MM-DD format'
      )
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: 'Invalid date',
      }),
    hoursWorked: z
      .number({ coerce: true })
      .min(0, 'Hours worked must be at least 0')
      .max(24, 'Hours worked cannot exceed 24 per day'),
    overtimeHours: z
      .number({ coerce: true })
      .min(0, 'Overtime hours must be at least 0')
      .max(24, 'Overtime hours cannot exceed 24')
      .optional()
      .default(0),
    notes: z
      .string()
      .trim()
      .max(500, 'Notes must be 500 characters or less')
      .optional(),
  })
  .strict();

export type WorkLogCreateInput = z.infer<typeof workLogCreateSchema>;

/**
 * Schema for updating a work log entry.
 */
export const workLogUpdateSchema = z
  .object({
    hoursWorked: z
      .number({ coerce: true })
      .min(0)
      .max(24)
      .optional(),
    overtimeHours: z
      .number({ coerce: true })
      .min(0)
      .max(24)
      .optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type WorkLogUpdateInput = z.infer<typeof workLogUpdateSchema>;

/**
 * Schema for hours import row.
 */
export const hoursImportRowSchema = z
  .object({
    employeeEmail: z
      .string()
      .trim()
      .email('Invalid employee email')
      .max(255)
      .transform((val) => val.toLowerCase()),
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    hoursWorked: z
      .number({ coerce: true })
      .min(0, 'Hours worked must be at least 0')
      .max(24, 'Hours worked cannot exceed 24'),
    overtimeHours: z
      .number({ coerce: true })
      .min(0)
      .max(24)
      .optional()
      .default(0),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type HoursImportRowInput = z.infer<typeof hoursImportRowSchema>;

/**
 * Schema for balance query by user ID.
 */
export const balanceQuerySchema = z
  .object({
    userId: z
      .string()
      .trim()
      .min(1, 'User ID is required'),
  })
  .strict();

export type BalanceQueryInput = z.infer<typeof balanceQuerySchema>;
