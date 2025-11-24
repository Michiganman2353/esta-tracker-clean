import { z } from 'zod';
import { EmployerSize } from './employee.js';

/**
 * Employer Types and Schemas
 */

export interface Employer {
  id: string;
  name: string;
  size: EmployerSize;
  employeeCount: number;
  contactEmail: string;
  contactPhone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  settings: {
    accrualStartDate?: Date;
    fiscalYearStart?: Date;
    allowNegativeBalances: boolean;
    requireDocumentation: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const EmployerSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  size: z.enum(['small', 'large']),
  employeeCount: z.number().min(0),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  }).optional(),
  settings: z.object({
    accrualStartDate: z.date().optional(),
    fiscalYearStart: z.date().optional(),
    allowNegativeBalances: z.boolean(),
    requireDocumentation: z.boolean(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});
