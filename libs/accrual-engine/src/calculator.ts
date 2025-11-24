/**
 * Accrual Calculator
 * 
 * Pure functions for calculating sick time accrual according to Michigan ESTA law
 */

import type { EmployerSize, AccrualCalculation } from '@esta/shared-types';
import { LARGE_EMPLOYER_RULES, SMALL_EMPLOYER_RULES } from '@esta-tracker/shared-utils';

/**
 * Calculate accrual for hours worked
 * 
 * Large employers: 1 hour per 30 hours worked
 * Small employers: 40 hours per year (granted annually, not per-period)
 * 
 * @param hoursWorked - Hours worked in the period
 * @param employerSize - Size of employer ('small' or 'large')
 * @param yearlyAccrued - Hours already accrued this year (for capping)
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
    // Small employers grant 40 hours annually, not based on hours worked.
    // This function is used for per-period accrual tracking only.
    // For small employers, use calculateAnnualGrant() instead to get the
    // 40-hour annual allocation at the start of the year or on hire date.
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
 * Calculate total hours worked required to accrue target hours
 * 
 * @param targetAccrualHours - Desired sick time hours to accrue
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Number of hours that need to be worked
 */
export function calculateHoursNeededForAccrual(
  targetAccrualHours: number,
  employerSize: EmployerSize
): number {
  if (employerSize === 'large') {
    // 30 hours worked = 1 hour accrued
    return targetAccrualHours * 30;
  } else {
    // Small employers grant annually, not based on hours worked
    return 0;
  }
}

/**
 * Calculate annual grant for small employers
 * Small employers grant 40 hours at start of year or employment
 * 
 * @param employerSize - Employer size
 * @returns Hours to grant annually
 */
export function calculateAnnualGrant(employerSize: EmployerSize): number {
  if (employerSize === 'small') {
    return SMALL_EMPLOYER_RULES.maxPaidHoursPerYear;
  }
  return 0; // Large employers don't use annual grants
}

/**
 * Calculate available hours for use
 * 
 * @param yearlyAccrued - Hours accrued this year
 * @param paidHoursUsed - Paid hours used this year
 * @param unpaidHoursUsed - Unpaid hours used this year (small employers only)
 * @param carryoverHours - Hours carried over from previous year
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Available paid and unpaid hours
 */
export function calculateAvailableHours(
  yearlyAccrued: number,
  paidHoursUsed: number,
  unpaidHoursUsed: number,
  carryoverHours: number,
  employerSize: EmployerSize
): { availablePaid: number; availableUnpaid: number } {
  const rules = employerSize === 'small' ? SMALL_EMPLOYER_RULES : LARGE_EMPLOYER_RULES;
  
  const totalAccrued = yearlyAccrued + carryoverHours;
  const cappedAccrued = Math.min(totalAccrued, rules.maxPaidHoursPerYear);
  const availablePaid = Math.max(0, cappedAccrued - paidHoursUsed);
  
  if (employerSize === 'small') {
    const availableUnpaid = Math.max(0, rules.maxUnpaidHoursPerYear - unpaidHoursUsed);
    return { availablePaid, availableUnpaid };
  }
  
  return { availablePaid, availableUnpaid: 0 };
}

/**
 * Check if a usage request is within allowed limits
 * 
 * @param requestedHours - Hours requested for sick time use
 * @param availablePaid - Available paid sick time hours
 * @param availableUnpaid - Available unpaid sick time hours (small employers only)
 * @param isPaid - Whether the request is for paid sick time
 * @returns Boolean indicating if request is valid
 */
export function isWithinUsageLimit(
  requestedHours: number,
  availablePaid: number,
  availableUnpaid: number,
  isPaid: boolean
): boolean {
  if (isPaid) {
    return requestedHours <= availablePaid;
  } else {
    return requestedHours <= availableUnpaid;
  }
}
