/**
 * Validation utilities for API endpoints
 */

/**
 * Validates that all required fields are present in an object
 * @param data The data object to validate
 * @param requiredFields Array of required field names
 * @param context Context string for logging (e.g., 'user data', 'employer data')
 * @throws Error if any required fields are missing
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[],
  context: string
): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    const fieldStatus = requiredFields.reduce((acc, field) => {
      acc[`has${field.charAt(0).toUpperCase()}${field.slice(1)}`] = !!data[field];
      return acc;
    }, {} as Record<string, boolean>);
    
    console.error(`[DEBUG] Critical error: Missing required ${context} fields`, fieldStatus);
    throw new Error(`Failed to construct ${context}: missing required fields (${missingFields.join(', ')})`);
  }
}
