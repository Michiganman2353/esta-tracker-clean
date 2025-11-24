/**
 * Michigan ESTA Frontload Rules
 * Handles frontload method where employers provide full year's sick time upfront
 */

import { EmployerSize } from './types';
import { LARGE_EMPLOYER_RULES, SMALL_EMPLOYER_RULES } from './employerSizeRules';

/**
 * Calculate frontload amount based on employer size
 * @param employerSize Small or large employer
 * @returns Hours to frontload at start of year/employment
 */
export function calculateFrontloadAmount(employerSize: EmployerSize): number {
  const rules = employerSize === 'small' ? SMALL_EMPLOYER_RULES : LARGE_EMPLOYER_RULES;
  return rules.maxPaidHoursPerYear;
}

/**
 * Check if employer is using frontload method
 * @param accrualMethod Accrual method from employer settings
 * @returns True if using frontload method
 */
export function isFrontloadMethod(accrualMethod: string): boolean {
  return accrualMethod === 'frontload';
}

/**
 * Calculate pro-rated frontload for partial year employment
 * Used when employee starts mid-year
 * @param employerSize Small or large employer
 * @param startDate Employee start date
 * @param yearEndDate End of benefit year
 * @returns Pro-rated hours to frontload
 */
export function calculateProRatedFrontload(
  employerSize: EmployerSize,
  startDate: Date,
  yearEndDate: Date
): number {
  const fullAmount = calculateFrontloadAmount(employerSize);
  
  // Calculate days remaining in year
  const daysRemaining = Math.max(0, 
    Math.floor((yearEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  
  // Calculate total days in year
  const yearStartDate = new Date(yearEndDate.getFullYear(), 0, 1);
  const totalDays = Math.floor(
    (yearEndDate.getTime() - yearStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Pro-rate based on remaining days
  if (totalDays === 0) return fullAmount;
  return Math.round((daysRemaining / totalDays) * fullAmount);
}

/**
 * Handle frontload for new employee
 * @param employerSize Small or large employer
 * @param hireDate Employee hire date
 * @param currentDate Current date (defaults to today)
 * @returns Frontload hours and effective date
 */
export function grantFrontloadForNewEmployee(
  employerSize: EmployerSize,
  hireDate: Date,
  currentDate: Date = new Date()
): { hours: number; effectiveDate: Date; isProRated: boolean } {
  const yearEndDate = new Date(currentDate.getFullYear(), 11, 31);
  const fullAmount = calculateFrontloadAmount(employerSize);
  
  // Check if hire date is at start of year (within first week)
  const yearStartDate = new Date(currentDate.getFullYear(), 0, 1);
  const daysFromYearStart = Math.floor(
    (hireDate.getTime() - yearStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysFromYearStart <= 7) {
    // Grant full amount if hired at start of year
    return {
      hours: fullAmount,
      effectiveDate: hireDate,
      isProRated: false,
    };
  }
  
  // Pro-rate for mid-year hires
  const proRatedHours = calculateProRatedFrontload(employerSize, hireDate, yearEndDate);
  return {
    hours: proRatedHours,
    effectiveDate: hireDate,
    isProRated: true,
  };
}

/**
 * Calculate frontload for new benefit year
 * @param employerSize Small or large employer
 * @param carryoverHours Hours carried over from previous year
 * @returns Total hours available at start of year
 */
export function grantFrontloadForNewYear(
  employerSize: EmployerSize,
  carryoverHours: number = 0
): number {
  const frontloadAmount = calculateFrontloadAmount(employerSize);
  return frontloadAmount + carryoverHours;
}

/**
 * Validate frontload grant
 * @param hours Hours to frontload
 * @param employerSize Small or large employer
 * @returns Validation result
 */
export function validateFrontloadGrant(
  hours: number,
  employerSize: EmployerSize
): { valid: boolean; error?: string } {
  const maxAmount = calculateFrontloadAmount(employerSize);
  
  if (hours < 0) {
    return { valid: false, error: 'Frontload amount cannot be negative' };
  }
  
  if (hours > maxAmount) {
    return {
      valid: false,
      error: `Frontload amount cannot exceed ${maxAmount} hours for ${employerSize} employer`,
    };
  }
  
  return { valid: true };
}
