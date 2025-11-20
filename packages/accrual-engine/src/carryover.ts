/**
 * Carryover Logic
 * 
 * Handle year-end carryover calculations
 */

import type { EmployerSize } from '@esta-tracker/shared-types';
import { LARGE_EMPLOYER_RULES, SMALL_EMPLOYER_RULES } from '@esta-tracker/shared-utils';

/**
 * Calculate carryover for year-end with proper capping
 * 
 * Large employers: Up to 72 hours can carry over
 * Small employers: Up to 40 hours can carry over
 * 
 * @param currentBalance - Current unused balance
 * @param employerSize - Small or large employer
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
 * Calculate carryover cap
 * 
 * @param employerSize - Small or large employer
 * @returns Maximum carryover hours
 */
export function getCarryoverCap(employerSize: EmployerSize): number {
  return employerSize === 'small' ? 40 : 72;
}

/**
 * Check if carryover would be capped
 * 
 * @param currentBalance - Current unused balance
 * @param employerSize - Small or large employer
 * @returns True if carryover exceeds cap
 */
export function isCarryoverCapped(
  currentBalance: number,
  employerSize: EmployerSize
): boolean {
  const cap = getCarryoverCap(employerSize);
  return currentBalance > cap;
}

/**
 * Calculate forfeited hours (hours lost due to carryover cap)
 * 
 * @param currentBalance - Current unused balance
 * @param employerSize - Small or large employer
 * @returns Hours that will be forfeited
 */
export function calculateForfeitedHours(
  currentBalance: number,
  employerSize: EmployerSize
): number {
  const cap = getCarryoverCap(employerSize);
  return Math.max(0, currentBalance - cap);
}
