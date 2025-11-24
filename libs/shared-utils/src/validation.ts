/**
 * Validation Utilities
 * 
 * Common validation functions for data integrity
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (US format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+1)?[\s.-]?\(?([0-9]{3})\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

/**
 * Validate ZIP code (US format)
 */
export function isValidZipCode(zip: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}

/**
 * Validate that a value is within a range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate that a string is not empty or just whitespace
 */
export function isNonEmptyString(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate hours worked (0-24)
 */
export function isValidHoursWorked(hours: number): boolean {
  return isInRange(hours, 0, 24);
}

/**
 * Validate hours per week (0-168)
 */
export function isValidHoursPerWeek(hours: number): boolean {
  return isInRange(hours, 0, 168);
}

/**
 * Sanitize string input for safe display
 * 
 * NOTE: This is a basic sanitizer for display purposes only.
 * For HTML context, use a proper HTML sanitizer like DOMPurify.
 * For SQL context, use parameterized queries.
 * For shell context, use proper escaping.
 * 
 * This function only removes obviously dangerous characters.
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, ''); // Remove HTML tag markers only
}

/**
 * Validate that a date is not in the future
 */
export function isNotFutureDate(date: Date): boolean {
  return date <= new Date();
}

/**
 * Validate that a date is not more than N years in the past
 */
export function isRecentDate(date: Date, maxYearsAgo: number): boolean {
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - maxYearsAgo);
  return date >= minDate;
}
