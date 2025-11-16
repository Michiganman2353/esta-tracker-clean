import { ComplianceRules } from '../types';

/**
 * Michigan ESTA Compliance Rules
 * Based on Michigan Earned Sick Time Act
 */

export const SMALL_EMPLOYER_THRESHOLD = 10;

export const SMALL_EMPLOYER_RULES: ComplianceRules = {
  employerSize: 'small',
  accrualRate: 0, // 40 hours per year, not rate-based
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

export function getComplianceRules(
  employeeCount: number
): ComplianceRules {
  return employeeCount < SMALL_EMPLOYER_THRESHOLD
    ? SMALL_EMPLOYER_RULES
    : LARGE_EMPLOYER_RULES;
}

/**
 * Calculate accrual for a work period
 * @param hoursWorked Hours worked in the period
 * @param employerSize Small or large employer
 * @param yearlyAccrued Hours already accrued this year
 * @returns Hours accrued from this work period
 */
export function calculateAccrual(
  hoursWorked: number,
  employerSize: 'small' | 'large',
  yearlyAccrued: number
): number {
  const rules = employerSize === 'small' ? SMALL_EMPLOYER_RULES : LARGE_EMPLOYER_RULES;

  if (employerSize === 'small') {
    // Small employers: 40 hours per year, evenly distributed
    // This is typically done at start of year, not per work period
    // Return 0 for ongoing accrual (handle separately in annual grant)
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
 * Calculate carryover for year-end
 * @param currentBalance Current balance
 * @param employerSize Small or large employer
 * @returns Hours to carry over to next year
 */
export function calculateCarryover(
  currentBalance: number,
  employerSize: 'small' | 'large'
): number {
  const rules = employerSize === 'small' ? SMALL_EMPLOYER_RULES : LARGE_EMPLOYER_RULES;
  return Math.min(currentBalance, rules.carryoverCap);
}

/**
 * Check if usage request is valid
 * @param requestedHours Hours requested
 * @param isPaid Whether paid time is requested
 * @param availablePaid Available paid hours
 * @param availableUnpaid Available unpaid hours
 * @param employerSize Small or large employer
 * @returns Whether request is valid and error message if not
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

/**
 * Usage categories as defined by Michigan ESTA
 */
export const USAGE_CATEGORIES = [
  { value: 'illness', label: 'Personal Illness or Injury' },
  { value: 'medical_appointment', label: 'Medical Appointment' },
  { value: 'preventive_care', label: 'Preventive Medical Care' },
  { value: 'family_care', label: 'Care for Family Member' },
  { value: 'domestic_violence', label: 'Domestic Violence' },
  { value: 'sexual_assault', label: 'Sexual Assault' },
  { value: 'stalking', label: 'Stalking' },
] as const;
