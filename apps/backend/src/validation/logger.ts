/**
 * Validation logging utilities.
 * Logs validation failures with contextual information for debugging.
 */

export interface ValidationLogEntry {
  timestamp: string;
  route: string;
  method: string;
  errors: Array<{ field: string; message: string }>;
  // Cleaned input without sensitive data
  sanitizedInput?: Record<string, unknown>;
}

/**
 * Sensitive field names that should never be logged (all lowercase for comparison).
 */
const SENSITIVE_FIELDS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'ssn',
  'socialsecuritynumber',
  'creditcard',
  'cvv',
]);

/**
 * Removes sensitive fields from an object for safe logging.
 */
export function sanitizeForLogging(
  input: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeForLogging(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Logs a validation failure to the console.
 * In production, this could be extended to log to external services.
 */
export function logValidationFailure(entry: ValidationLogEntry): void {
  console.error('[VALIDATION_FAILURE]', JSON.stringify({
    timestamp: entry.timestamp,
    route: entry.route,
    method: entry.method,
    errorCount: entry.errors.length,
    errors: entry.errors,
    input: entry.sanitizedInput,
  }, null, 2));
}

/**
 * Creates a validation log entry with automatic timestamp.
 */
export function createValidationLogEntry(
  route: string,
  method: string,
  errors: Array<{ field: string; message: string }>,
  rawInput?: Record<string, unknown>
): ValidationLogEntry {
  return {
    timestamp: new Date().toISOString(),
    route,
    method,
    errors,
    sanitizedInput: rawInput ? sanitizeForLogging(rawInput) : undefined,
  };
}
