/**
 * Zod validation schemas for CSV import operations.
 */

import { z } from 'zod';
import { employeeImportRowSchema } from './employee.js';
import { hoursImportRowSchema } from './accrual.js';

/**
 * Import type enum.
 */
export const importTypeSchema = z.enum(['employees', 'hours'], {
  errorMap: () => ({
    message: 'Import type must be "employees" or "hours"',
  }),
});

export type ImportType = z.infer<typeof importTypeSchema>;

/**
 * Schema for import metadata.
 */
const importMetadataSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, 'File name is required')
    .max(255, 'File name must be 255 characters or less'),
  totalRows: z
    .number({ coerce: true })
    .int('Total rows must be a whole number')
    .min(0, 'Total rows must be at least 0'),
  validRows: z
    .number({ coerce: true })
    .int('Valid rows must be a whole number')
    .min(0, 'Valid rows must be at least 0'),
  errors: z
    .number({ coerce: true })
    .int('Errors must be a whole number')
    .min(0, 'Errors must be at least 0'),
  warnings: z
    .number({ coerce: true })
    .int('Warnings must be a whole number')
    .min(0, 'Warnings must be at least 0'),
});

/**
 * Schema for validating import data.
 */
export const importValidateSchema = z
  .object({
    type: importTypeSchema,
    data: z.array(z.record(z.unknown())).min(1, 'At least one row is required'),
    metadata: importMetadataSchema,
  })
  .strict();

export type ImportValidateInput = z.infer<typeof importValidateSchema>;

/**
 * Schema for employee import.
 */
export const employeeImportSchema = z
  .object({
    data: z.array(employeeImportRowSchema).min(1, 'At least one employee is required'),
    metadata: importMetadataSchema,
  })
  .strict();

export type EmployeeImportInput = z.infer<typeof employeeImportSchema>;

/**
 * Schema for hours import.
 */
export const hoursImportSchema = z
  .object({
    data: z.array(hoursImportRowSchema).min(1, 'At least one hours entry is required'),
    metadata: importMetadataSchema,
  })
  .strict();

export type HoursImportInput = z.infer<typeof hoursImportSchema>;

/**
 * Schema for import history query.
 */
export const importHistoryQuerySchema = z
  .object({
    limit: z
      .number({ coerce: true })
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(50),
  })
  .strict();

export type ImportHistoryQueryInput = z.infer<typeof importHistoryQuerySchema>;
