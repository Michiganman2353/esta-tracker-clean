/**
 * Accrual Validator
 * 
 * Validation functions for accrual-related data
 */

import type { EmployerSize } from '@esta/shared-types';
import { isValidHoursWorked } from '@esta-tracker/shared-utils';

/**
 * Validate hours worked for accrual calculation
 * 
 * @param hoursWorked - Hours to validate
 * @returns Validation result with error message if invalid
 */
export function validateHoursWorked(hoursWorked: number): { valid: boolean; error?: string } {
  if (hoursWorked < 0) {
    return { valid: false, error: 'Hours worked cannot be negative' };
  }
  
  if (hoursWorked > 24) {
    return { valid: false, error: 'Hours worked cannot exceed 24 hours in a day' };
  }
  
  if (!isValidHoursWorked(hoursWorked)) {
    return { valid: false, error: 'Invalid hours worked value' };
  }
  
  return { valid: true };
}

/**
 * Validate accrual request
 * 
 * @param hoursWorked - Hours worked
 * @param yearlyAccrued - Current yearly accrued hours
 * @param employerSize - Employer size
 * @returns Validation result
 */
export function validateAccrualRequest(
  hoursWorked: number,
  yearlyAccrued: number,
  employerSize: EmployerSize
): { valid: boolean; error?: string } {
  const hoursValidation = validateHoursWorked(hoursWorked);
  if (!hoursValidation.valid) {
    return hoursValidation;
  }
  
  if (yearlyAccrued < 0) {
    return { valid: false, error: 'Yearly accrued hours cannot be negative' };
  }
  
  const maxCap = employerSize === 'small' ? 40 : 72;
  if (yearlyAccrued > maxCap) {
    return { valid: false, error: `Yearly accrued hours exceed maximum cap of ${maxCap}` };
  }
  
  return { valid: true };
}

/**
 * Validate usage request
 * 
 * @param requestedHours - Hours requested
 * @param availableHours - Hours available
 * @returns Validation result
 */
export function validateUsageRequest(
  requestedHours: number,
  availableHours: number
): { valid: boolean; error?: string } {
  if (requestedHours <= 0) {
    return { valid: false, error: 'Requested hours must be greater than 0' };
  }
  
  if (requestedHours > availableHours) {
    return {
      valid: false,
      error: `Insufficient balance. Requested: ${requestedHours}, Available: ${availableHours}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate employer size
 * 
 * @param employeeCount - Number of employees
 * @returns Employer size classification
 */
export function validateEmployerSize(employeeCount: number): EmployerSize {
  return employeeCount >= 10 ? 'large' : 'small';
}
