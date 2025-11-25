/**
 * Centralized Backend Validation Layer
 * 
 * This module provides a complete validation system using Zod schemas
 * for all form-submitted data within the ESTA-Logic monorepo.
 * 
 * Features:
 * - Schema-based validation for all domain operations
 * - Validation middleware for Express routes
 * - Sanitization utilities for input cleaning
 * - Validation logging for debugging
 * 
 * Usage:
 * ```typescript
 * import { validate, validateBody, employeeRegistrationSchema } from '../validation/index.js';
 * 
 * // Use in route
 * router.post('/register', validateBody(employeeRegistrationSchema), (req, res) => {
 *   const validatedData = req.validated.body;
 *   // ...
 * });
 * ```
 */

// Export middleware
export {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  type ValidatedRequest,
  type ValidationErrorResponse,
  type InferBody,
} from './middleware.js';

// Export sanitization utilities
export {
  sanitizeString,
  escapeHtml,
  normalizeNumber,
  normalizeDate,
  normalizeEmail,
  sanitizeObject,
} from './sanitize.js';

// Export logging utilities
export {
  logValidationFailure,
  createValidationLogEntry,
  sanitizeForLogging,
  type ValidationLogEntry,
} from './logger.js';

// Re-export all schemas
export * from './schemas/index.js';
