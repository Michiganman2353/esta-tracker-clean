/**
 * ESTA Core - Pure business logic for Michigan ESTA compliance calculations
 *
 * This package contains core accrual and computation logic that is
 * independent of any storage or framework dependencies.
 */

// Accrual rate: 1 hour per 30 hours worked (Michigan ESTA)
export const HOURS_TO_ACCRUE_PER_HOUR = 1 / 30; // ~0.0333333333

// Maximum accrual caps based on employer size
export const MAX_ACCRUAL_SMALL_EMPLOYER = 40; // Employers with 10 or fewer employees
export const MAX_ACCRUAL_LARGE_EMPLOYER = 72; // Employers with more than 10 employees

/**
 * Calculate accrued sick time hours based on hours worked.
 *
 * Michigan ESTA mandates 1 hour of earned sick time per 30 hours worked.
 *
 * @param hoursWorked - Total hours worked in the accrual period
 * @returns Accrued sick time hours (to 6 decimal places)
 * @throws Error if hoursWorked is not a non-negative finite number
 */
export function calculateAccruedHours(hoursWorked: number): number {
  if (!Number.isFinite(hoursWorked) || hoursWorked < 0) {
    throw new Error('hoursWorked must be a non-negative finite number');
  }
  return +(hoursWorked * HOURS_TO_ACCRUE_PER_HOUR).toFixed(6);
}

/**
 * Calculate accrued sick time with employer size caps applied.
 *
 * @param hoursWorked - Total hours worked in the accrual period
 * @param employeeCount - Number of employees in the organization
 * @returns Accrued sick time hours, capped based on employer size
 * @throws Error if inputs are invalid
 */
export function calculateCappedAccrual(
  hoursWorked: number,
  employeeCount: number
): number {
  if (!Number.isFinite(employeeCount) || employeeCount < 1) {
    throw new Error('employeeCount must be a positive integer');
  }

  const accrued = calculateAccruedHours(hoursWorked);
  const cap =
    employeeCount <= 10
      ? MAX_ACCRUAL_SMALL_EMPLOYER
      : MAX_ACCRUAL_LARGE_EMPLOYER;

  return Math.min(accrued, cap);
}

/**
 * Calculate remaining sick time balance.
 *
 * @param accrued - Total accrued sick time hours
 * @param used - Total used sick time hours
 * @returns Remaining sick time balance
 * @throws Error if inputs are invalid
 */
export function calculateBalance(accrued: number, used: number): number {
  if (!Number.isFinite(accrued) || accrued < 0) {
    throw new Error('accrued must be a non-negative finite number');
  }
  if (!Number.isFinite(used) || used < 0) {
    throw new Error('used must be a non-negative finite number');
  }
  return Math.max(0, accrued - used);
}
