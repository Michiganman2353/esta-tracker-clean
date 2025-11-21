/**
 * Michigan ESTA Usage Rules
 * Handles usage request validation and Michigan-specific covered reasons
 */

import { EmployerSize, UsageCategory, UsageValidation } from './types';

/**
 * Michigan ESTA covered use categories with descriptions
 * These are the legally protected reasons for sick time usage
 */
export const MICHIGAN_COVERED_USE_CATEGORIES = [
  {
    value: 'illness' as UsageCategory,
    label: 'Personal Illness or Injury',
    description: 'Employee\'s own mental or physical illness, injury, or health condition',
  },
  {
    value: 'medical_appointment' as UsageCategory,
    label: 'Medical Appointment',
    description: 'Medical diagnosis, care, or treatment of mental or physical illness, injury, or health condition',
  },
  {
    value: 'preventive_care' as UsageCategory,
    label: 'Preventive Medical Care',
    description: 'Preventive medical or health care for employee',
  },
  {
    value: 'family_care' as UsageCategory,
    label: 'Care for Family Member',
    description: 'Care for family member with mental or physical illness, injury, health condition, or need for medical care',
  },
  {
    value: 'domestic_violence' as UsageCategory,
    label: 'Domestic Violence',
    description: 'Domestic violence circumstances affecting employee or family member',
  },
  {
    value: 'sexual_assault' as UsageCategory,
    label: 'Sexual Assault',
    description: 'Sexual assault circumstances affecting employee or family member',
  },
  {
    value: 'stalking' as UsageCategory,
    label: 'Stalking',
    description: 'Stalking circumstances affecting employee or family member',
  },
] as const;

/**
 * Get covered use category by value
 * @param value Category value
 * @returns Category object or undefined
 */
export function getCoveredUseCategory(value: UsageCategory) {
  return MICHIGAN_COVERED_USE_CATEGORIES.find(cat => cat.value === value);
}

/**
 * Validate usage request
 * @param requestedHours Hours requested
 * @param isPaid Whether paid time is requested
 * @param availablePaid Available paid hours
 * @param availableUnpaid Available unpaid hours
 * @param employerSize Small or large employer
 * @param category Usage category
 * @returns Validation result with any errors or warnings
 */
export function validateUsageRequest(
  requestedHours: number,
  isPaid: boolean,
  availablePaid: number,
  availableUnpaid: number,
  employerSize: EmployerSize,
  category: UsageCategory
): UsageValidation {
  const warnings: string[] = [];

  // Basic validation
  if (requestedHours <= 0) {
    return { valid: false, error: 'Requested hours must be positive' };
  }

  // Validate category
  if (!isValidUsageCategory(category)) {
    return { valid: false, error: 'Invalid usage category' };
  }

  // Validate paid request
  if (isPaid) {
    if (requestedHours > availablePaid) {
      return {
        valid: false,
        error: `Insufficient paid hours available. You have ${availablePaid.toFixed(2)} hours.`,
      };
    }

    // Warning if using most of available balance
    if (requestedHours > availablePaid * 0.8) {
      warnings.push(
        `This request will use ${((requestedHours / availablePaid) * 100).toFixed(0)}% of your available paid sick time.`
      );
    }
  } else {
    // Validate unpaid request
    if (employerSize === 'large') {
      return {
        valid: false,
        error: 'Large employers (10+ employees) do not offer unpaid sick time under Michigan ESTA',
      };
    }

    if (requestedHours > availableUnpaid) {
      return {
        valid: false,
        error: `Insufficient unpaid hours available. You have ${availableUnpaid.toFixed(2)} hours.`,
      };
    }

    // Warning if using unpaid time with paid available
    if (availablePaid > 0) {
      warnings.push(
        'You have paid sick time available. Consider using paid time first.'
      );
    }
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate usage category is a covered Michigan ESTA reason
 * @param category Category to validate
 * @returns True if valid category
 */
export function isValidUsageCategory(category: UsageCategory): boolean {
  return MICHIGAN_COVERED_USE_CATEGORIES.some(cat => cat.value === category);
}

/**
 * Check if category requires documentation
 * Michigan ESTA allows employers to require documentation for absences > 3 consecutive days
 * @param category Usage category
 * @param consecutiveDays Number of consecutive days
 * @returns True if documentation may be required
 */
export function mayRequireDocumentation(
  _category: UsageCategory, // Unused but kept for API consistency
  consecutiveDays: number
): boolean {
  // Employers can require documentation for absences > 3 consecutive days
  return consecutiveDays > 3;
}

/**
 * Get documentation requirements message
 * @param category Usage category
 * @param consecutiveDays Number of consecutive days
 * @returns Message about documentation requirements
 */
export function getDocumentationMessage(
  category: UsageCategory,
  consecutiveDays: number
): string | undefined {
  if (mayRequireDocumentation(category, consecutiveDays)) {
    return 'Your employer may require documentation for absences exceeding 3 consecutive days. Please be prepared to provide appropriate documentation.';
  }
  return undefined;
}

/**
 * Calculate usage impact on available balance
 * @param requestedHours Hours being requested
 * @param isPaid Whether paid time
 * @param availablePaid Current paid balance
 * @param availableUnpaid Current unpaid balance
 * @returns New balances after usage
 */
export function calculateUsageImpact(
  requestedHours: number,
  isPaid: boolean,
  availablePaid: number,
  availableUnpaid: number
): { newPaidBalance: number; newUnpaidBalance: number } {
  if (isPaid) {
    return {
      newPaidBalance: Math.max(0, availablePaid - requestedHours),
      newUnpaidBalance: availableUnpaid,
    };
  } else {
    return {
      newPaidBalance: availablePaid,
      newUnpaidBalance: Math.max(0, availableUnpaid - requestedHours),
    };
  }
}
