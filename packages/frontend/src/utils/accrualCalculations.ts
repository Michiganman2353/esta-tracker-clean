/**
 * Accrual Calculation Utilities
 * 
 * Provides utility functions for calculating sick time accrual
 * according to Michigan ESTA (Earned Sick Time Act) law requirements.
 * 
 * Michigan ESTA Rules:
 * - Large employers (≥10 employees): 1 hour per 30 hours worked, up to 72 hours/year
 * - Small employers (<10 employees): 40 hours annually (paid) + 32 hours (unpaid)
 * - Accrual begins at start of employment
 * - Unused hours carry over to next year (subject to caps)
 * 
 * Functions:
 * - calculateAccrualForHours: Calculate accrual for hours worked
 * - getMaxAccrualForEmployerSize: Get maximum accrual limits
 * - calculateCarryover: Calculate carryover to next year
 * - calculateAvailableHours: Calculate available sick time balance
 * - isWithinUsageLimit: Check if usage request is within limits
 * 
 * Uses:
 * - ComplianceRules type from types
 * - Pure functions for testability
 */

import { ComplianceRules } from '../types';

/**
 * Calculate sick time accrual based on hours worked
 * @param hoursWorked - Number of hours worked in the period
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Number of sick time hours accrued
 */
export function calculateAccrualForHours(
  hoursWorked: number,
  employerSize: 'small' | 'large'
): number {
  if (employerSize === 'large') {
    // Large employers: 1 hour per 30 hours worked
    return hoursWorked / 30;
  } else {
    // Small employers accrue annually, not per-period
    // This would typically be granted at year start
    return 0;
  }
}

/**
 * Get maximum accrual limits for employer size
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns ComplianceRules object with limits
 */
export function getMaxAccrualForEmployerSize(employerSize: 'small' | 'large'): ComplianceRules {
  if (employerSize === 'large') {
    return {
      employerSize: 'large',
      accrualRate: 1 / 30,
      maxPaidHoursPerYear: 72,
      maxUnpaidHoursPerYear: 0,
      carryoverCap: 72,
      auditRetentionYears: 3,
    };
  } else {
    return {
      employerSize: 'small',
      accrualRate: 0, // Annual grant, not per-hour accrual
      maxPaidHoursPerYear: 40,
      maxUnpaidHoursPerYear: 32,
      carryoverCap: 40,
      auditRetentionYears: 3,
    };
  }
}

/**
 * Calculate carryover hours to next year
 * @param currentBalance - Current unused sick time balance
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Hours that will carry over to next year
 */
export function calculateCarryover(
  currentBalance: number,
  employerSize: 'small' | 'large'
): number {
  const rules = getMaxAccrualForEmployerSize(employerSize);
  return Math.min(currentBalance, rules.carryoverCap);
}

/**
 * Calculate available sick time hours
 * @param yearlyAccrued - Hours accrued this year
 * @param paidHoursUsed - Paid hours used this year
 * @param unpaidHoursUsed - Unpaid hours used this year (small employers only)
 * @param carryoverHours - Hours carried over from previous year
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Object with available paid and unpaid hours
 */
export function calculateAvailableHours(
  yearlyAccrued: number,
  paidHoursUsed: number,
  unpaidHoursUsed: number,
  carryoverHours: number,
  employerSize: 'small' | 'large'
): { availablePaid: number; availableUnpaid: number } {
  const rules = getMaxAccrualForEmployerSize(employerSize);
  
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

/**
 * Calculate total hours worked required to accrue target hours
 * @param targetAccrualHours - Desired sick time hours to accrue
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Number of hours that need to be worked
 */
export function calculateHoursNeededForAccrual(
  targetAccrualHours: number,
  employerSize: 'small' | 'large'
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
 * Format hours as human-readable string
 * @param hours - Number of hours
 * @param showDecimals - Whether to show decimal places
 * @returns Formatted string (e.g., "8 hours", "8.5 hours")
 */
export function formatHours(hours: number, showDecimals: boolean = true): string {
  const formatted = showDecimals ? hours.toFixed(1) : Math.round(hours).toString();
  return `${formatted} ${hours === 1 ? 'hour' : 'hours'}`;
}
