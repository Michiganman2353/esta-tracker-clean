/**
 * Accrual Rules
 * 
 * Michigan ESTA compliance rules and caps
 */

import type { EmployerSize, ComplianceRules } from '@esta/shared-types';
import { LARGE_EMPLOYER_RULES, SMALL_EMPLOYER_RULES } from '@esta-tracker/shared-utils';

/**
 * Get maximum accrual limits for employer size
 * 
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns ComplianceRules object with limits
 */
export function getMaxAccrualForEmployerSize(employerSize: EmployerSize): ComplianceRules {
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
export function getMaxUsageLimit(employerSize: EmployerSize, isPaid: boolean): number {
  const rules = getMaxAccrualForEmployerSize(employerSize);
  return isPaid ? rules.maxPaidHoursPerYear : rules.maxUnpaidHoursPerYear;
}
