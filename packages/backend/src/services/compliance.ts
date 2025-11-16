/**
 * Michigan ESTA (Earned Sick Time Act) Compliance Engine
 * Implements Michigan's sick time accrual and usage rules
 */

import { ComplianceRules } from '../types/index.js';

export const SMALL_EMPLOYER_THRESHOLD = 10;

export const SMALL_EMPLOYER_RULES: ComplianceRules = {
  employerSize: 'small',
  accrualRate: 0, // 40 hours granted annually, not rate-based
  maxPaidHoursPerYear: 40,
  maxUnpaidHoursPerYear: 32,
  carryoverCap: 40,
  auditRetentionYears: 3,
};

export const LARGE_EMPLOYER_RULES: ComplianceRules = {
  employerSize: 'large',
  accrualRate: 1 / 30, // 1 hour per 30 hours worked
  maxPaidHoursPerYear: 72,
  maxUnpaidHoursPerYear: 0,
  carryoverCap: 72,
  auditRetentionYears: 3,
};

export function getComplianceRules(employeeCount: number): ComplianceRules {
  return employeeCount < SMALL_EMPLOYER_THRESHOLD
    ? SMALL_EMPLOYER_RULES
    : LARGE_EMPLOYER_RULES;
}

/**
 * Calculate accrual for a work period (large employers only)
 */
export function calculateAccrual(
  hoursWorked: number,
  employerSize: 'small' | 'large',
  yearlyAccrued: number
): number {
  const rules = employerSize === 'small' ? SMALL_EMPLOYER_RULES : LARGE_EMPLOYER_RULES;

  if (employerSize === 'small') {
    // Small employers grant 40 hours at start of year
    return 0;
  } else {
    // Large employers: 1 hour per 30 hours worked
    const accrued = hoursWorked * rules.accrualRate;
    const maxAccrual = rules.maxPaidHoursPerYear;
    const remaining = Math.max(0, maxAccrual - yearlyAccrued);
    return Math.min(accrued, remaining);
  }
}

/**
 * Calculate year-end carryover
 */
export function calculateCarryover(
  currentBalance: number,
  employerSize: 'small' | 'large'
): number {
  const rules = employerSize === 'small' ? SMALL_EMPLOYER_RULES : LARGE_EMPLOYER_RULES;
  return Math.min(currentBalance, rules.carryoverCap);
}

/**
 * Validate usage request
 */
export function validateUsageRequest(
  requestedHours: number,
  isPaid: boolean,
  availablePaid: number,
  availableUnpaid: number,
  employerSize: 'small' | 'large'
): { valid: boolean; error?: string } {
  if (requestedHours <= 0) {
    return { valid: false, error: 'Requested hours must be positive' };
  }

  if (isPaid) {
    if (requestedHours > availablePaid) {
      return {
        valid: false,
        error: `Insufficient paid hours available. You have ${availablePaid} hours.`,
      };
    }
  } else {
    if (employerSize === 'large') {
      return {
        valid: false,
        error: 'Large employers do not offer unpaid sick time under Michigan ESTA',
      };
    }
    if (requestedHours > availableUnpaid) {
      return {
        valid: false,
        error: `Insufficient unpaid hours available. You have ${availableUnpaid} hours.`,
      };
    }
  }

  return { valid: true };
}
