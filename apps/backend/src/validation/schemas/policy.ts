/**
 * Zod validation schemas for sick-time policy operations.
 */

import { z } from 'zod';
import { employerSizeSchema } from './employer.js';

/**
 * Policy type enum.
 */
export const policyTypeSchema = z.enum(['accrual', 'frontload', 'hybrid'], {
  errorMap: () => ({
    message: 'Policy type must be "accrual", "frontload", or "hybrid"',
  }),
});

export type PolicyType = z.infer<typeof policyTypeSchema>;

/**
 * Schema for policy rules.
 */
const policyRulesSchema = z
  .object({
    accrualRate: z
      .number({ coerce: true })
      .min(0, 'Accrual rate must be at least 0')
      .max(1, 'Accrual rate cannot exceed 1')
      .optional(),
    accrualPeriod: z
      .enum(['hourly', 'weekly', 'biweekly', 'monthly'])
      .optional(),
    maxAnnualHours: z
      .number({ coerce: true })
      .min(0, 'Max annual hours must be at least 0')
      .max(8760, 'Max annual hours cannot exceed 8760')
      .optional(),
    maxCarryoverHours: z
      .number({ coerce: true })
      .min(0, 'Max carryover hours must be at least 0')
      .max(1000, 'Max carryover hours cannot exceed 1000')
      .optional(),
    waitingPeriod: z
      .number({ coerce: true })
      .int('Waiting period must be a whole number')
      .min(0, 'Waiting period must be at least 0')
      .max(365, 'Waiting period cannot exceed 365 days')
      .optional(),
    minimumIncrement: z
      .number({ coerce: true })
      .min(0.25, 'Minimum increment must be at least 0.25 hours')
      .max(8, 'Minimum increment cannot exceed 8 hours')
      .optional(),
  })
  .strict();

/**
 * Schema for creating a custom policy.
 */
export const policyCreateSchema = z
  .object({
    basePolicyId: z
      .string()
      .trim()
      .min(1, 'Base policy ID is required'),
    customizations: z
      .object({
        name: z
          .string()
          .trim()
          .min(1, 'Policy name is required')
          .max(100, 'Policy name must be 100 characters or less')
          .optional(),
        rules: policyRulesSchema.optional(),
      })
      .strict(),
  })
  .strict();

export type PolicyCreateInput = z.infer<typeof policyCreateSchema>;

/**
 * Schema for activating a policy.
 */
export const policyActivateSchema = z
  .object({
    policyId: z
      .string()
      .trim()
      .min(1, 'Policy ID is required'),
    customizations: z
      .object({
        rules: policyRulesSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type PolicyActivateInput = z.infer<typeof policyActivateSchema>;

/**
 * Schema for policy query parameters.
 */
export const policyQuerySchema = z
  .object({
    employerSize: employerSizeSchema.optional(),
  })
  .strict();

export type PolicyQueryInput = z.infer<typeof policyQuerySchema>;
