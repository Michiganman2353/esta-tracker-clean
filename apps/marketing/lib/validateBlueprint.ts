import Ajv from 'ajv';
/**
 * Blueprint schema - this is a copy from libs/blueprints/schema/blueprint.v1.json
 * The copy is maintained here because Next.js SSG requires the schema during build
 * and cross-package imports have compatibility issues with the build process.
 *
 * IMPORTANT: When updating the schema in libs/blueprints/schema/blueprint.v1.json,
 * also update this copy to maintain consistency.
 */
import schema from './blueprint.v1.json';

// Create and configure AJV instance
const ajv = new Ajv({ allErrors: true, verbose: true });
const validateFn = ajv.compile(schema);

export interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
  params?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a blueprint manifest against the v1 schema.
 */
export function validate(manifest: unknown): ValidationResult {
  const valid = validateFn(manifest);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors: ValidationError[] = (validateFn.errors || []).map((err) => ({
    path: err.instancePath || '/',
    message: err.message || 'Unknown validation error',
    keyword: err.keyword,
    params: err.params as Record<string, unknown>,
  }));

  return { valid: false, errors };
}

/**
 * Validates a blueprint and throws an error if invalid.
 */
export function validateOrThrow(manifest: unknown): ValidationResult {
  const result = validate(manifest);

  if (!result.valid) {
    const errorMessages = result.errors
      .map((e) => `  - ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Blueprint validation failed:\n${errorMessages}`);
  }

  return result;
}

export { schema };
