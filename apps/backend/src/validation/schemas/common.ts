/**
 * Common validation schemas and utilities shared across domains.
 */

import { z } from 'zod';

/**
 * Schema for pagination query parameters.
 */
export const paginationSchema = z.object({
  page: z
    .number({ coerce: true })
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .optional()
    .default(1),
  limit: z
    .number({ coerce: true })
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Schema for ID path parameter.
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'ID is required'),
});

export type IdParamInput = z.infer<typeof idParamSchema>;

/**
 * Schema for user ID path parameter.
 */
export const userIdParamSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, 'User ID is required'),
});

export type UserIdParamInput = z.infer<typeof userIdParamSchema>;

/**
 * Schema for date range query parameters.
 */
export const dateRangeSchema = z
  .object({
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional(),
    endDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['endDate'],
    }
  );

export type DateRangeInput = z.infer<typeof dateRangeSchema>;
