/**
 * Validation middleware for Express routes.
 * Validates request body, params, and query against Zod schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { createValidationLogEntry, logValidationFailure } from './logger.js';

/**
 * Extended Request interface with validated data.
 * Note: `validated` is optional since it's only set after validation middleware runs.
 */
export interface ValidatedRequest<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown
> extends Request {
  validated?: {
    body: TBody;
    params: TParams;
    query: TQuery;
  };
}

/**
 * Validation error response format.
 */
export interface ValidationErrorResponse {
  success: false;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Converts Zod errors to a structured error response.
 */
function formatZodErrors(error: ZodError): Array<{ field: string; message: string }> {
  return error.errors.map((err) => ({
    field: err.path.join('.') || 'unknown',
    message: err.message,
  }));
}

/**
 * Options for validation middleware.
 */
interface ValidateOptions<TBody, TParams, TQuery> {
  body?: ZodSchema<TBody>;
  params?: ZodSchema<TParams>;
  query?: ZodSchema<TQuery>;
}

/**
 * Creates a validation middleware that validates request body, params, and query.
 * 
 * @example
 * ```typescript
 * router.post('/users', validate({ body: userCreateSchema }), (req, res) => {
 *   const { name, email } = req.validated.body;
 *   // ...
 * });
 * ```
 */
export function validate<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown
>(options: ValidateOptions<TBody, TParams, TQuery>) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const errors: Array<{ field: string; message: string }> = [];
    const validatedReq = req as ValidatedRequest<TBody, TParams, TQuery>;
    validatedReq.validated = {
      body: {} as TBody,
      params: {} as TParams,
      query: {} as TQuery,
    };

    try {
      // Validate body if schema provided
      if (options.body) {
        try {
          validatedReq.validated.body = options.body.parse(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error).map(e => ({
              ...e,
              field: `body.${e.field}`.replace('body.unknown', 'body'),
            })));
          } else {
            throw error;
          }
        }
      }

      // Validate params if schema provided
      if (options.params) {
        try {
          validatedReq.validated.params = options.params.parse(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error).map(e => ({
              ...e,
              field: `params.${e.field}`.replace('params.unknown', 'params'),
            })));
          } else {
            throw error;
          }
        }
      }

      // Validate query if schema provided
      if (options.query) {
        try {
          validatedReq.validated.query = options.query.parse(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error).map(e => ({
              ...e,
              field: `query.${e.field}`.replace('query.unknown', 'query'),
            })));
          } else {
            throw error;
          }
        }
      }

      // If there are any validation errors, return 400
      if (errors.length > 0) {
        // Log the validation failure
        const logEntry = createValidationLogEntry(
          req.path,
          req.method,
          errors,
          req.body as Record<string, unknown>
        );
        logValidationFailure(logEntry);

        const response: ValidationErrorResponse = {
          success: false,
          errors,
        };
        res.status(400).json(response);
        return;
      }

      next();
    } catch (error) {
      // Unexpected error during validation
      console.error('[VALIDATION] Unexpected error:', error);
      res.status(500).json({
        success: false,
        errors: [{ field: 'unknown', message: 'Internal validation error' }],
      });
    }
  };
}

/**
 * Shorthand for validating only request body.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return validate<T>({ body: schema });
}

/**
 * Shorthand for validating only request params.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return validate<unknown, T>({ params: schema });
}

/**
 * Shorthand for validating only request query.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return validate<unknown, unknown, T>({ query: schema });
}

/**
 * Type helper to extract validated body type from a schema.
 */
export type InferBody<T extends ZodSchema> = z.infer<T>;
