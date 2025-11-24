/**
 * Constants
 * 
 * Shared constants used across the application
 */

/**
 * Michigan ESTA accrual rate denominator
 * Large employers accrue 1 hour per this many hours worked
 */
export const ACCRUAL_RATE_DENOMINATOR = 30;

/**
 * Michigan ESTA Rules for Large Employers (≥10 employees)
 */
export const LARGE_EMPLOYER_RULES = {
  employerSize: 'large' as const,
  accrualRate: 1 / ACCRUAL_RATE_DENOMINATOR,
  maxPaidHoursPerYear: 72,
  maxUnpaidHoursPerYear: 0,
  carryoverCap: 72,
  auditRetentionYears: 3,
};

/**
 * Michigan ESTA Rules for Small Employers (<10 employees)
 */
export const SMALL_EMPLOYER_RULES = {
  employerSize: 'small' as const,
  accrualRate: 0, // Annual grant, not per-hour accrual
  maxPaidHoursPerYear: 40,
  maxUnpaidHoursPerYear: 32,
  carryoverCap: 40,
  auditRetentionYears: 3,
};

/**
 * Employer size threshold
 */
export const EMPLOYER_SIZE_THRESHOLD = 10;

/**
 * Maximum file size for document uploads (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed file types for document uploads
 */
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * CSV column limits
 */
export const CSV_LIMITS = {
  maxRows: 10000,
  maxColumns: 50,
  maxCellSize: 10000, // characters
};

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 25,
  maxLimit: 100,
};

/**
 * Date formats
 */
export const DATE_FORMATS = {
  iso: 'yyyy-MM-dd',
  display: 'MM/dd/yyyy',
  displayWithTime: 'MM/dd/yyyy HH:mm',
  displayLong: 'MMMM d, yyyy',
};

/**
 * Regex patterns
 */
export const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+1)?[\s.-]?\(?([0-9]{3})\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  isoDate: /^\d{4}-\d{2}-\d{2}$/,
};

/**
 * API Error Codes
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
