/**
 * Procedure template validator using JSON Schema
 */

import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Procedure } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the schema from file system
const schemaPath = join(__dirname, '..', 'schema', 'procedure.v1.json');
let schema: object;

try {
  schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
} catch {
  // During testing or when dist structure is different, try alternate path
  const altSchemaPath = join(
    __dirname,
    '..',
    '..',
    'schema',
    'procedure.v1.json'
  );
  schema = JSON.parse(readFileSync(altSchemaPath, 'utf-8'));
}

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
 * Validates a procedure template against the v1 schema.
 * @param procedure - The procedure template object to validate
 * @returns Validation result with errors if any
 */
export function validateProcedure(procedure: unknown): ValidationResult {
  const valid = validateFn(procedure);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors: ValidationError[] = (validateFn.errors ?? []).map((err) => ({
    path: err.instancePath || '/',
    message: err.message ?? 'Unknown validation error',
    keyword: err.keyword,
    params: err.params as Record<string, unknown>,
  }));

  return { valid: false, errors };
}

/**
 * Validates a procedure and throws an error if invalid.
 * @param procedure - The procedure template object to validate
 * @throws {Error} If the procedure is invalid
 * @returns The validated procedure (type-asserted)
 */
export function validateProcedureOrThrow(procedure: unknown): Procedure {
  const result = validateProcedure(procedure);

  if (!result.valid) {
    const errorMessages = result.errors
      .map((e) => `  - ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Procedure validation failed:\n${errorMessages}`);
  }

  return procedure as Procedure;
}

export { schema };
