/**
 * Michigan ESTA Employer Size Rules
 * Determines compliance rules based on number of employees
 */

import { ComplianceRules, EmployerSize, AccrualMethod } from './types';

/**
 * Threshold for small vs large employer classification
 * < 10 employees = small, >= 10 = large (Michigan ESTA)
 */
export const SMALL_EMPLOYER_THRESHOLD = 10;

/**
 * Small employer rules (< 10 employees)
 * - 40 hours paid sick time per year
 * - 32 hours unpaid sick time available
 * - Annual grant (no accrual per hour worked)
 * - Can choose frontload or accrual method
 */
export const SMALL_EMPLOYER_RULES: ComplianceRules = {
  employerSize: 'small',
  accrualMethod: 'accrual', // Default, can be changed to frontload
  accrualRate: 0, // No per-hour accrual, annual grant instead
  maxPaidHoursPerYear: 40,
  maxUnpaidHoursPerYear: 32,
  carryoverCap: 40,
  auditRetentionYears: 3,
};

/**
 * Large employer rules (>= 10 employees)
 * - 72 hours paid sick time per year
 * - No unpaid sick time
 * - 1 hour per 30 hours worked accrual
 * - Can choose frontload or accrual method
 */
export const LARGE_EMPLOYER_RULES: ComplianceRules = {
  employerSize: 'large',
  accrualMethod: 'accrual', // Default, can be changed to frontload
  accrualRate: 1 / 30, // 1 hour per 30 hours worked
  maxPaidHoursPerYear: 72,
  maxUnpaidHoursPerYear: 0,
  carryoverCap: 72,
  auditRetentionYears: 3,
};

/**
 * Determine employer size classification
 * @param employeeCount Number of employees
 * @returns Employer size classification
 */
export function determineEmployerSize(employeeCount: number): EmployerSize {
  return employeeCount < SMALL_EMPLOYER_THRESHOLD ? 'small' : 'large';
}

/**
 * Get compliance rules for employer based on employee count
 * @param employeeCount Number of employees
 * @param accrualMethod Optional accrual method override
 * @returns Compliance rules for the employer
 */
export function getComplianceRules(
  employeeCount: number,
  accrualMethod?: AccrualMethod
): ComplianceRules {
  const size = determineEmployerSize(employeeCount);
  const baseRules = size === 'small' ? SMALL_EMPLOYER_RULES : LARGE_EMPLOYER_RULES;
  
  if (accrualMethod) {
    return {
      ...baseRules,
      accrualMethod,
      frontloadAmount: accrualMethod === 'frontload' ? baseRules.maxPaidHoursPerYear : undefined,
    };
  }
  
  return baseRules;
}

/**
 * Check if employer qualifies as small under Michigan ESTA
 * @param employeeCount Number of employees
 * @returns True if employer is classified as small
 */
export function isSmallEmployer(employeeCount: number): boolean {
  return employeeCount < SMALL_EMPLOYER_THRESHOLD;
}

/**
 * Check if employer qualifies as large under Michigan ESTA
 * @param employeeCount Number of employees
 * @returns True if employer is classified as large
 */
export function isLargeEmployer(employeeCount: number): boolean {
  return employeeCount >= SMALL_EMPLOYER_THRESHOLD;
}

/**
 * Get maximum paid hours per year for employer
 * @param employeeCount Number of employees
 * @returns Maximum paid hours per year
 */
export function getMaxPaidHoursPerYear(employeeCount: number): number {
  return isSmallEmployer(employeeCount) ? 40 : 72;
}

/**
 * Get maximum unpaid hours per year for employer
 * @param employeeCount Number of employees
 * @returns Maximum unpaid hours per year
 */
export function getMaxUnpaidHoursPerYear(employeeCount: number): number {
  return isSmallEmployer(employeeCount) ? 32 : 0;
}

/**
 * Get carryover cap for employer
 * @param employeeCount Number of employees
 * @returns Carryover cap in hours
 */
export function getCarryoverCap(employeeCount: number): number {
  return isSmallEmployer(employeeCount) ? 40 : 72;
}
