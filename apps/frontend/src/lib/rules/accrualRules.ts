/**
 * Michigan ESTA Accrual Rules
 * Handles sick time accrual calculations with proper capping
 */

import { AccrualCalculation, EmployerSize } from './types';
import { LARGE_EMPLOYER_RULES, SMALL_EMPLOYER_RULES } from './employerSizeRules';

/**
 * Calculate accrual for a work period with proper capping
 * @param hoursWorked Hours worked in the period
 * @param employerSize Small or large employer
 * @param yearlyAccrued Hours already accrued this year
 * @returns Accrual calculation with capping information
 */
export function calculateAccrual(
  hoursWorked: number,
  employerSize: EmployerSize,
  yearlyAccrued: number
): AccrualCalculation {
  const rules = employerSize === 'small' ? SMALL_EMPLOYER_RULES : LARGE_EMPLOYER_RULES;
  const cap = rules.maxPaidHoursPerYear;

  if (employerSize === 'small') {
    // Small employers: 40 hours per year, granted annually (not per work period)
    // Return 0 for ongoing accrual (handle separately in annual grant)
    return {
      accrued: 0,
      cap,
      remaining: Math.max(0, cap - yearlyAccrued),
      capped: yearlyAccrued >= cap,
    };
  }

  // Large employers: 1 hour per 30 hours worked
  const rawAccrued = hoursWorked * rules.accrualRate;
  const remaining = Math.max(0, cap - yearlyAccrued);
  const accrued = Math.min(rawAccrued, remaining);

  return {
    accrued,
    cap,
    remaining,
    capped: yearlyAccrued >= cap || (yearlyAccrued + rawAccrued) > cap,
  };
}

/**
 * Calculate annual grant for small employers
 * Small employers grant 40 hours at start of year or employment
 * @param employerSize Employer size
 * @returns Hours to grant annually
 */
export function calculateAnnualGrant(employerSize: EmployerSize): number {
  if (employerSize === 'small') {
    return SMALL_EMPLOYER_RULES.maxPaidHoursPerYear;
  }
  return 0; // Large employers don't use annual grants
}

/**
 * Calculate carryover for year-end with proper capping
 * @param currentBalance Current balance
 * @param employerSize Small or large employer
 * @returns Hours to carry over to next year (capped at 40 or 72)
 */
export function calculateCarryover(
  currentBalance: number,
  employerSize: EmployerSize
): number {
  const rules = employerSize === 'small' ? SMALL_EMPLOYER_RULES : LARGE_EMPLOYER_RULES;
  return Math.min(currentBalance, rules.carryoverCap);
}

/**
 * Calculate accrual cap for employer
 * @param employerSize Small or large employer
 * @returns Maximum hours that can be accrued per year
 */
export function getAccrualCap(employerSize: EmployerSize): number {
  return employerSize === 'small' ? 40 : 72;
}

/**
 * Check if employee has reached accrual cap
 * @param yearlyAccrued Hours accrued this year
 * @param employerSize Small or large employer
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
 * @param yearlyAccrued Hours accrued this year
 * @param employerSize Small or large employer
 * @returns Remaining hours that can be accrued
 */
export function getRemainingAccrualCapacity(
  yearlyAccrued: number,
  employerSize: EmployerSize
): number {
  const cap = getAccrualCap(employerSize);
  return Math.max(0, cap - yearlyAccrued);
}
