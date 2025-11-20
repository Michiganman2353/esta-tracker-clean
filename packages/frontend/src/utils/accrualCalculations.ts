/**
 * Accrual calculation helpers for Michigan ESTA compliance
 */

export interface EmployerSize {
  employeeCount: number;
  isSmallEmployer: boolean;
}

export interface AccrualRates {
  hoursWorkedPerHourAccrued: number;
  maxAccrualHours: number;
  maxUsageHours: number;
  carryoverLimit: number;
}

/**
 * Determine if employer is "small" (< 10 employees) or "large" (>= 10)
 */
export function getEmployerSize(employeeCount: number): EmployerSize {
  return {
    employeeCount,
    isSmallEmployer: employeeCount < 10,
  };
}

/**
 * Get accrual rates based on employer size
 * Small employers (<10): 40 hours/year frontloaded
 * Large employers (>=10): 1 hour per 30 hours worked
 */
export function getAccrualRates(employeeCount: number): AccrualRates {
  const { isSmallEmployer } = getEmployerSize(employeeCount);

  if (isSmallEmployer) {
    return {
      hoursWorkedPerHourAccrued: 0, // Frontloaded, not accrual-based
      maxAccrualHours: 40,
      maxUsageHours: 40,
      carryoverLimit: 40,
    };
  }

  return {
    hoursWorkedPerHourAccrued: 30, // 1 hour per 30 hours worked
    maxAccrualHours: 72,
    maxUsageHours: 72,
    carryoverLimit: 40,
  };
}

/**
 * Calculate sick time accrued based on hours worked
 */
export function calculateAccrual(
  hoursWorked: number,
  employeeCount: number
): number {
  const rates = getAccrualRates(employeeCount);
  const { isSmallEmployer } = getEmployerSize(employeeCount);

  if (isSmallEmployer) {
    // Frontloaded at start of year
    return rates.maxAccrualHours;
  }

  // Large employer: calculate based on hours worked
  const accrued = hoursWorked / rates.hoursWorkedPerHourAccrued;
  return Math.min(accrued, rates.maxAccrualHours);
}

/**
 * Calculate remaining balance
 */
export function calculateBalance(
  accrued: number,
  used: number,
  carryover: number = 0
): number {
  return Math.max(0, accrued + carryover - used);
}

/**
 * Calculate carryover for next year
 */
export function calculateCarryover(
  currentBalance: number,
  employeeCount: number
): number {
  const rates = getAccrualRates(employeeCount);
  return Math.min(currentBalance, rates.carryoverLimit);
}

/**
 * Validate if usage request is within limits
 */
export function validateUsage(
  requestedHours: number,
  availableBalance: number,
  employeeCount: number
): { isValid: boolean; message?: string } {
  const rates = getAccrualRates(employeeCount);

  if (requestedHours <= 0) {
    return { isValid: false, message: 'Requested hours must be positive' };
  }

  if (requestedHours > availableBalance) {
    return { isValid: false, message: 'Insufficient balance' };
  }

  if (requestedHours > rates.maxUsageHours) {
    return {
      isValid: false,
      message: `Cannot use more than ${rates.maxUsageHours} hours per year`,
    };
  }

  return { isValid: true };
}

/**
 * Format hours to a human-readable string
 */
export function formatHours(hours: number): string {
  if (hours === 0) return '0 hours';
  if (hours === 1) return '1 hour';
  
  // Round to 2 decimal places
  const rounded = Math.round(hours * 100) / 100;
  return `${rounded} hours`;
}
