/**
 * Zod validation schemas for sick time request operations.
 */

import { z } from 'zod';

/**
 * Request status enum.
 */
export const requestStatusSchema = z.enum(
  ['pending', 'approved', 'denied', 'cancelled'],
  {
    errorMap: () => ({
      message:
        'Request status must be "pending", "approved", "denied", or "cancelled"',
    }),
  }
);

export type RequestStatus = z.infer<typeof requestStatusSchema>;

/**
 * Request reason enum.
 */
export const requestReasonSchema = z.enum(
  [
    'personal_illness',
    'family_illness',
    'medical_appointment',
    'mental_health',
    'domestic_violence',
    'public_health',
    'other',
  ],
  {
    errorMap: () => ({
      message: 'Invalid request reason',
    }),
  }
);

export type RequestReason = z.infer<typeof requestReasonSchema>;

/**
 * Schema for creating a sick time request.
 */
export const sickTimeRequestCreateSchema = z
  .object({
    startDate: z
      .string()
      .trim()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Start date must be in YYYY-MM-DD format'
      )
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: 'Invalid start date',
      }),
    endDate: z
      .string()
      .trim()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'End date must be in YYYY-MM-DD format'
      )
      .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: 'Invalid end date',
      }),
    hoursRequested: z
      .number({ coerce: true })
      .min(0.25, 'Hours requested must be at least 0.25')
      .max(168, 'Hours requested cannot exceed 168'),
    reason: requestReasonSchema,
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes must be 1000 characters or less')
      .optional(),
  })
  .strict()
  .refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    {
      message: 'Start date must be before or equal to end date',
      path: ['endDate'],
    }
  );

export type SickTimeRequestCreateInput = z.infer<typeof sickTimeRequestCreateSchema>;

/**
 * Schema for updating a sick time request status.
 */
export const sickTimeRequestStatusUpdateSchema = z
  .object({
    status: requestStatusSchema,
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes must be 1000 characters or less')
      .optional(),
  })
  .strict();

export type SickTimeRequestStatusUpdateInput = z.infer<typeof sickTimeRequestStatusUpdateSchema>;

/**
 * Schema for querying sick time requests.
 */
export const sickTimeRequestQuerySchema = z
  .object({
    status: requestStatusSchema.optional(),
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    limit: z
      .number({ coerce: true })
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(50),
  })
  .strict();

export type SickTimeRequestQueryInput = z.infer<typeof sickTimeRequestQuerySchema>;
