import { z } from 'zod';
import { EmployerSize } from './employee.js';

/**
 * Accrual Types and Schemas
 */

export interface ComplianceRules {
  employerSize: EmployerSize;
  accrualRate: number; // Hours accrued per hour worked
  maxPaidHoursPerYear: number;
  maxUnpaidHoursPerYear: number;
  carryoverCap: number;
  auditRetentionYears: number;
}

export const ComplianceRulesSchema = z.object({
  employerSize: z.enum(['small', 'large']),
  accrualRate: z.number().min(0),
  maxPaidHoursPerYear: z.number().min(0),
  maxUnpaidHoursPerYear: z.number().min(0),
  carryoverCap: z.number().min(0),
  auditRetentionYears: z.number().min(1),
});

export interface AccrualBalance {
  id: string;
  userId: string;
  tenantId: string;
  availablePaidHours: number;
  availableUnpaidHours?: number; // For small employers
  yearlyAccrued: number;
  yearlyUsed: number;
  carryoverFromPriorYear: number;
  lastCalculated: Date;
}

export const AccrualBalanceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  availablePaidHours: z.number().min(0),
  availableUnpaidHours: z.number().min(0).optional(),
  yearlyAccrued: z.number().min(0),
  yearlyUsed: z.number().min(0),
  carryoverFromPriorYear: z.number().min(0),
  lastCalculated: z.date(),
});

export interface WorkLog {
  id: string;
  userId: string;
  tenantId: string;
  date: Date;
  hoursWorked: number;
  overtimeHours?: number;
  accrualCalculated: number;
  notes?: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export const WorkLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  date: z.date(),
  hoursWorked: z.number().min(0).max(24),
  overtimeHours: z.number().min(0).max(24).optional(),
  accrualCalculated: z.number().min(0),
  notes: z.string().max(500).optional(),
  createdAt: z.date(),
  approvedBy: z.string().optional(),
  approvedAt: z.date().optional(),
});

export interface AccrualCalculation {
  accrued: number;
  cap: number;
  remaining: number;
  capped: boolean;
}

export const AccrualCalculationSchema = z.object({
  accrued: z.number().min(0),
  cap: z.number().min(0),
  remaining: z.number().min(0),
  capped: z.boolean(),
});
