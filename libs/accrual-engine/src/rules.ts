/**
 * Accrual Rules
 *
 * Michigan ESTA compliance rules and caps
 * Includes regional-day rules engine with probation logic
 */

import type { EmployerSize, ComplianceRules } from '@esta/shared-types';
import {
  LARGE_EMPLOYER_RULES,
  SMALL_EMPLOYER_RULES,
} from '@esta-tracker/shared-utils';

// =====================================================
// CONSTANTS
// =====================================================

/**
 * Michigan ESTA 120-Day Probationary Period
 *
 * Under Michigan ESTA law, employers MAY require employees to wait
 * up to 120 calendar days before using accrued sick time.
 * This is a waiting period for USE, not for accrual.
 * Employees still accrue sick time from day one.
 */
export const PROBATION_PERIOD_DAYS = 120;

/**
 * Regional flag types for different jurisdictions
 * Currently only Michigan is supported, but architecture allows expansion
 */
export type RegionalFlag = 'MI' | 'MI_URBAN' | 'MI_RURAL';

/**
 * Probation policy options
 */
export interface ProbationPolicy {
  /** Whether employer enforces the 120-day waiting period */
  enforced: boolean;
  /** Number of days in the waiting period (max 120 for Michigan) */
  waitingPeriodDays: number;
  /** Date employee becomes eligible for sick time use */
  eligibilityDate?: Date;
}

// =====================================================
// BASIC ACCRUAL RULES
// =====================================================

/**
 * Get maximum accrual limits for employer size
 *
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns ComplianceRules object with limits
 */
export function getMaxAccrualForEmployerSize(
  employerSize: EmployerSize
): ComplianceRules {
  return employerSize === 'small' ? SMALL_EMPLOYER_RULES : LARGE_EMPLOYER_RULES;
}

/**
 * Get accrual cap for employer
 *
 * @param employerSize - Small or large employer
 * @returns Maximum hours that can be accrued per year
 */
export function getAccrualCap(employerSize: EmployerSize): number {
  return employerSize === 'small' ? 40 : 72;
}

/**
 * Check if employee has reached accrual cap
 *
 * @param yearlyAccrued - Hours accrued this year
 * @param employerSize - Small or large employer
 * @returns True if employee has reached cap
 */
export function hasReachedAccrualCap(
  yearlyAccrued: number,
  employerSize: EmployerSize
): boolean {
  const cap = getAccrualCap(employerSize);
  return yearlyAccrued >= cap;
}

/**
 * Calculate remaining accrual capacity for year
 *
 * @param yearlyAccrued - Hours accrued this year
 * @param employerSize - Small or large employer
 * @returns Remaining hours that can be accrued
 */
export function getRemainingAccrualCapacity(
  yearlyAccrued: number,
  employerSize: EmployerSize
): number {
  const cap = getAccrualCap(employerSize);
  return Math.max(0, cap - yearlyAccrued);
}

/**
 * Get maximum usage limit per year
 *
 * @param employerSize - Small or large employer
 * @param isPaid - Whether checking paid or unpaid limit
 * @returns Maximum hours that can be used per year
 */
export function getMaxUsageLimit(
  employerSize: EmployerSize,
  isPaid: boolean
): number {
  const rules = getMaxAccrualForEmployerSize(employerSize);
  return isPaid ? rules.maxPaidHoursPerYear : rules.maxUnpaidHoursPerYear;
}

// =====================================================
// 120-DAY PROBATIONARY PERIOD RULES
// =====================================================

/**
 * Calculate the eligibility date for sick time usage
 * based on the 120-day probationary period.
 *
 * Michigan ESTA allows employers to require up to 120 calendar days
 * of employment before an employee can USE accrued sick time.
 * Note: Accrual begins from day one regardless of this waiting period.
 *
 * @param hireDate - Employee's hire date
 * @param policy - Employer's probation policy
 * @returns Date when employee becomes eligible to use sick time
 */
export function calculateProbationEndDate(
  hireDate: Date,
  policy: Pick<ProbationPolicy, 'enforced' | 'waitingPeriodDays'>
): Date {
  if (!policy.enforced) {
    // If no probation enforced, eligible from day one
    return hireDate;
  }

  // Cap at 120 days per Michigan law
  const waitingDays = Math.min(policy.waitingPeriodDays, PROBATION_PERIOD_DAYS);

  const eligibilityDate = new Date(hireDate);
  eligibilityDate.setDate(eligibilityDate.getDate() + waitingDays);

  return eligibilityDate;
}

/**
 * Check if employee is still in probationary period
 *
 * @param hireDate - Employee's hire date
 * @param currentDate - Current date to check against
 * @param policy - Employer's probation policy
 * @returns true if employee is still in probation
 */
export function isInProbationPeriod(
  hireDate: Date,
  currentDate: Date,
  policy: Pick<ProbationPolicy, 'enforced' | 'waitingPeriodDays'>
): boolean {
  if (!policy.enforced) {
    return false;
  }

  const eligibilityDate = calculateProbationEndDate(hireDate, policy);
  return currentDate < eligibilityDate;
}

/**
 * Get the remaining days in probationary period
 *
 * @param hireDate - Employee's hire date
 * @param currentDate - Current date
 * @param policy - Employer's probation policy
 * @returns Number of days remaining (0 if probation complete)
 */
export function getRemainingProbationDays(
  hireDate: Date,
  currentDate: Date,
  policy: Pick<ProbationPolicy, 'enforced' | 'waitingPeriodDays'>
): number {
  if (!policy.enforced) {
    return 0;
  }

  const eligibilityDate = calculateProbationEndDate(hireDate, policy);
  const diffMs = eligibilityDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Get default probation policy for Michigan employers
 *
 * @param enforceProbation - Whether to enforce the waiting period
 * @returns Default probation policy
 */
export function getDefaultProbationPolicy(
  enforceProbation: boolean = false
): ProbationPolicy {
  return {
    enforced: enforceProbation,
    waitingPeriodDays: PROBATION_PERIOD_DAYS,
  };
}

// =====================================================
// REGIONAL RULES ENGINE
// =====================================================

/**
 * Regional-specific rules configuration
 * Supports future expansion to other states/jurisdictions
 */
export interface RegionalRulesConfig {
  region: RegionalFlag;
  probationMaxDays: number;
  accrualRateDenominator: number;
  smallEmployerThreshold: number;
  largeEmployerPaidHoursCap: number;
  smallEmployerPaidHoursCap: number;
  carryoverAllowed: boolean;
  frontloadingAllowed: boolean;
}

/**
 * Michigan ESTA regional rules
 */
export const MICHIGAN_ESTA_RULES: RegionalRulesConfig = {
  region: 'MI',
  probationMaxDays: 120,
  accrualRateDenominator: 30,
  smallEmployerThreshold: 10,
  largeEmployerPaidHoursCap: 72,
  smallEmployerPaidHoursCap: 40,
  carryoverAllowed: true,
  frontloadingAllowed: true,
};

/**
 * Get regional rules for a specific jurisdiction
 *
 * @param region - Regional flag identifier
 * @returns Regional rules configuration
 */
export function getRegionalRules(region: RegionalFlag): RegionalRulesConfig {
  // Currently only Michigan is supported
  // Future: Add other states as they enact similar laws
  switch (region) {
    case 'MI':
    case 'MI_URBAN':
    case 'MI_RURAL':
      return MICHIGAN_ESTA_RULES;
    default:
      // Default to Michigan rules
      return MICHIGAN_ESTA_RULES;
  }
}

/**
 * Validate employer's probation policy against regional rules
 *
 * @param policy - Employer's probation policy
 * @param region - Regional flag
 * @returns Validation result with any errors
 */
export function validateProbationPolicy(
  policy: ProbationPolicy,
  region: RegionalFlag = 'MI'
): { valid: boolean; errors: string[] } {
  const rules = getRegionalRules(region);
  const errors: string[] = [];

  if (policy.waitingPeriodDays > rules.probationMaxDays) {
    errors.push(
      `Waiting period of ${policy.waitingPeriodDays} days exceeds ` +
        `maximum of ${rules.probationMaxDays} days for ${region}`
    );
  }

  if (policy.waitingPeriodDays < 0) {
    errors.push('Waiting period cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if an employee can use sick time based on all applicable rules
 *
 * @param params - Employee usage check parameters
 * @returns Detailed result of usage eligibility check
 */
export function canUseSickTime(params: {
  hireDate: Date;
  currentDate: Date;
  probationPolicy: ProbationPolicy;
  availableBalance: number;
  hoursRequested: number;
  employerSize: EmployerSize;
}): {
  allowed: boolean;
  reason?: string;
  remainingProbationDays?: number;
} {
  const {
    hireDate,
    currentDate,
    probationPolicy,
    availableBalance,
    hoursRequested,
    employerSize,
  } = params;

  // Check probationary period
  if (isInProbationPeriod(hireDate, currentDate, probationPolicy)) {
    const remaining = getRemainingProbationDays(
      hireDate,
      currentDate,
      probationPolicy
    );
    return {
      allowed: false,
      reason: `Employee is in ${probationPolicy.waitingPeriodDays}-day probationary period`,
      remainingProbationDays: remaining,
    };
  }

  // Check available balance
  if (hoursRequested > availableBalance) {
    return {
      allowed: false,
      reason: `Requested ${hoursRequested} hours exceeds available balance of ${availableBalance} hours`,
    };
  }

  // Check against maximum usage limits
  const maxUsage = getMaxUsageLimit(employerSize, true);
  if (hoursRequested > maxUsage) {
    return {
      allowed: false,
      reason: `Requested ${hoursRequested} hours exceeds maximum usage limit of ${maxUsage} hours`,
    };
  }

  return { allowed: true };
}
