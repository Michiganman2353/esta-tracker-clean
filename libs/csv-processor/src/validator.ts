/**
 * CSV Validator
 * 
 * Validate CSV data against schemas
 * 
 * TODO: Migrate to Rust/WASM for high-performance validation
 */

import { CSV_LIMITS } from '@esta-tracker/shared-utils';

export interface CSVValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
  severity: 'error' | 'warning';
}

export interface CSVValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errors: CSVValidationError[];
  warnings: CSVValidationError[];
}

export type FieldValidator = (value: string) => string | null;

export interface CSVSchema {
  required: string[];
  optional: string[];
  validators: Record<string, FieldValidator>;
}

/**
 * Validate CSV data against a schema
 * 
 * @param headers - CSV headers
 * @param rows - CSV data rows
 * @param schema - Validation schema
 * @returns Validation result
 */
export function validateCSVData(
  headers: string[],
  rows: string[][],
  schema: CSVSchema
): CSVValidationResult {
  const errors: CSVValidationError[] = [];
  const warnings: CSVValidationError[] = [];

  // Check row/column limits
  if (rows.length > CSV_LIMITS.maxRows) {
    errors.push({
      row: 0,
      field: 'file',
      value: '',
      error: `CSV exceeds maximum ${CSV_LIMITS.maxRows} rows`,
      severity: 'error',
    });
    return {
      valid: false,
      totalRows: rows.length,
      validRows: 0,
      errors,
      warnings,
    };
  }

  if (headers.length > CSV_LIMITS.maxColumns) {
    errors.push({
      row: 0,
      field: 'headers',
      value: '',
      error: `CSV exceeds maximum ${CSV_LIMITS.maxColumns} columns`,
      severity: 'error',
    });
  }

  // Validate headers
  const missingRequired = schema.required.filter(
    (field) => !headers.includes(field)
  );
  if (missingRequired.length > 0) {
    errors.push({
      row: 0,
      field: 'headers',
      value: headers.join(', '),
      error: `Missing required columns: ${missingRequired.join(', ')}`,
      severity: 'error',
    });
  }

  // Check for unknown headers
  const allFields = [...schema.required, ...schema.optional];
  const unknownHeaders = headers.filter((h) => !allFields.includes(h));
  if (unknownHeaders.length > 0) {
    warnings.push({
      row: 0,
      field: 'headers',
      value: unknownHeaders.join(', '),
      error: `Unknown columns will be ignored: ${unknownHeaders.join(', ')}`,
      severity: 'warning',
    });
  }

  // Validate each row
  let validRowCount = 0;
  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2; // +1 for 0-index, +1 for header row
    let rowHasErrors = false;

    headers.forEach((header, colIndex) => {
      const value = row[colIndex] || '';

      // Check cell size
      if (value.length > CSV_LIMITS.maxCellSize) {
        errors.push({
          row: rowNumber,
          field: header,
          value: value.substring(0, 50) + '...',
          error: `Cell exceeds maximum ${CSV_LIMITS.maxCellSize} characters`,
          severity: 'error',
        });
        rowHasErrors = true;
        return;
      }

      // Validate required fields
      if (schema.required.includes(header) && !value.trim()) {
        errors.push({
          row: rowNumber,
          field: header,
          value,
          error: `${header} is required`,
          severity: 'error',
        });
        rowHasErrors = true;
        return;
      }

      // Run field-specific validators
      if (value) {
        const validator = schema.validators[header];
        if (validator && typeof validator === 'function') {
          const validationError = validator(value);
          if (validationError) {
            errors.push({
              row: rowNumber,
              field: header,
              value,
              error: validationError,
              severity: 'error',
            });
            rowHasErrors = true;
          }
        }
      }
    });

    if (!rowHasErrors) {
      validRowCount++;
    }
  });

  return {
    valid: errors.length === 0,
    totalRows: rows.length,
    validRows: validRowCount,
    errors,
    warnings,
  };
}
