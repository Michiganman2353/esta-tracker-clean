/**
 * Error Handling Utilities
 *
 * Centralized error handling patterns for consistent error management
 * across the ESTA Tracker application.
 */

/**
 * Application error codes for categorizing errors
 */
export enum ErrorCode {
  // Validation errors (400-level)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Authentication errors (401-level)
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Authorization errors (403-level)
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404-level)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND',
  EMPLOYER_NOT_FOUND = 'EMPLOYER_NOT_FOUND',

  // Business logic errors (422-level)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_SICK_TIME = 'INSUFFICIENT_SICK_TIME',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',

  // Server errors (500-level)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Custom application error with structured error information
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown (Node.js only)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to a safe JSON representation for API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Result type for operations that can fail
 * Use this instead of throwing exceptions for expected failure cases
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard to check if a value is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if a value is a standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Wrap an async function to catch errors and return a Result
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T, AppError>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    if (isAppError(error)) {
      return err(error);
    }
    return err(
      new AppError(getErrorMessage(error), ErrorCode.INTERNAL_ERROR, 500, {
        originalError: String(error),
      })
    );
  }
}

/**
 * Wrap a synchronous function to catch errors and return a Result
 */
export function tryCatchSync<T>(fn: () => T): Result<T, AppError> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    if (isAppError(error)) {
      return err(error);
    }
    return err(
      new AppError(getErrorMessage(error), ErrorCode.INTERNAL_ERROR, 500, {
        originalError: String(error),
      })
    );
  }
}

/**
 * Create a validation error with field-specific details
 */
export function validationError(
  message: string,
  fieldErrors?: Record<string, string>
): AppError {
  return new AppError(message, ErrorCode.VALIDATION_ERROR, 400, {
    fieldErrors,
  });
}

/**
 * Create a not found error
 */
export function notFoundError(resource: string, id?: string): AppError {
  const message = id
    ? `${resource} with ID '${id}' not found`
    : `${resource} not found`;
  return new AppError(message, ErrorCode.RESOURCE_NOT_FOUND, 404);
}

/**
 * Create a permission denied error
 */
export function permissionDeniedError(action?: string): AppError {
  const message = action ? `Permission denied: ${action}` : 'Permission denied';
  return new AppError(message, ErrorCode.PERMISSION_DENIED, 403);
}

/**
 * Create an authentication required error
 */
export function authenticationRequiredError(): AppError {
  return new AppError(
    'Authentication required',
    ErrorCode.AUTHENTICATION_REQUIRED,
    401
  );
}
