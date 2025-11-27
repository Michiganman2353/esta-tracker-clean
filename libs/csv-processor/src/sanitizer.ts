/**
 * CSV Sanitizer Module
 *
 * Canonicalizes and secures imported CSV formats by:
 * - Normalizing character encodings
 * - Removing potentially dangerous content (formula injection)
 * - Validating and sanitizing field values
 * - Normalizing date formats
 * - Handling special characters safely
 *
 * Security Features:
 * - Prevents CSV injection (formula attacks)
 * - Removes control characters
 * - Validates and sanitizes data types
 * - Normalizes line endings
 *
 * @module sanitizer
 */

/** Characters that indicate potential formula injection */
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r', '\n'];

/** Control characters to remove (except tabs and newlines handled separately) */
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Result of sanitization */
export interface SanitizeResult {
  value: string;
  wasModified: boolean;
  sanitizationApplied: string[];
}

/** Batch sanitization result */
export interface BatchSanitizeResult {
  rows: string[][];
  totalModifications: number;
  sanitizationSummary: Record<string, number>;
}

/** Configuration for sanitization */
export interface SanitizeConfig {
  /** Prevent formula injection by prefixing dangerous characters */
  preventFormulaInjection: boolean;
  /** Remove control characters */
  removeControlCharacters: boolean;
  /** Trim whitespace */
  trimWhitespace: boolean;
  /** Normalize line endings to LF */
  normalizeLineEndings: boolean;
  /** Maximum field length (0 = no limit) */
  maxFieldLength: number;
  /** Replace null bytes */
  removeNullBytes: boolean;
  /** Normalize Unicode (NFC normalization) */
  normalizeUnicode: boolean;
}

/** Default sanitization configuration */
export const DEFAULT_SANITIZE_CONFIG: SanitizeConfig = {
  preventFormulaInjection: true,
  removeControlCharacters: true,
  trimWhitespace: true,
  normalizeLineEndings: true,
  maxFieldLength: 10000,
  removeNullBytes: true,
  normalizeUnicode: true,
};

/**
 * Check if a value starts with a formula prefix character
 * that could be exploited in spreadsheet applications
 *
 * @param value - Value to check
 * @returns true if potentially dangerous
 */
export function hasFormulaPrefix(value: string): boolean {
  if (!value || value.length === 0) return false;
  const firstChar = value[0];
  if (!firstChar) return false;
  return FORMULA_PREFIXES.includes(firstChar);
}

/**
 * Sanitize a single CSV field value
 *
 * @param value - Raw field value
 * @param config - Sanitization configuration
 * @returns Sanitized result with modification info
 */
export function sanitizeField(
  value: string,
  config: Partial<SanitizeConfig> = {}
): SanitizeResult {
  const effectiveConfig = { ...DEFAULT_SANITIZE_CONFIG, ...config };
  let sanitized = value;
  const applied: string[] = [];

  // Handle null/undefined
  if (sanitized == null) {
    return {
      value: '',
      wasModified: true,
      sanitizationApplied: ['null_to_empty'],
    };
  }

  // Convert to string if not already
  if (typeof sanitized !== 'string') {
    sanitized = String(sanitized);
    applied.push('type_conversion');
  }

  // Remove null bytes
  if (effectiveConfig.removeNullBytes && sanitized.includes('\0')) {
    sanitized = sanitized.replace(/\0/g, '');
    applied.push('remove_null_bytes');
  }

  // Remove control characters
  if (effectiveConfig.removeControlCharacters) {
    const before = sanitized;
    sanitized = sanitized.replace(CONTROL_CHAR_REGEX, '');
    if (sanitized !== before) {
      applied.push('remove_control_chars');
    }
  }

  // Normalize line endings
  if (effectiveConfig.normalizeLineEndings) {
    const before = sanitized;
    sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (sanitized !== before) {
      applied.push('normalize_line_endings');
    }
  }

  // Trim whitespace
  if (effectiveConfig.trimWhitespace) {
    const before = sanitized;
    sanitized = sanitized.trim();
    if (sanitized !== before) {
      applied.push('trim_whitespace');
    }
  }

  // Prevent formula injection
  if (effectiveConfig.preventFormulaInjection && hasFormulaPrefix(sanitized)) {
    sanitized = "'" + sanitized;
    applied.push('formula_injection_prevention');
  }

  // Truncate if too long
  if (
    effectiveConfig.maxFieldLength > 0 &&
    sanitized.length > effectiveConfig.maxFieldLength
  ) {
    sanitized = sanitized.substring(0, effectiveConfig.maxFieldLength);
    applied.push('truncate');
  }

  // Normalize Unicode
  if (effectiveConfig.normalizeUnicode) {
    const before = sanitized;
    sanitized = sanitized.normalize('NFC');
    if (sanitized !== before) {
      applied.push('unicode_normalization');
    }
  }

  return {
    value: sanitized,
    wasModified: applied.length > 0,
    sanitizationApplied: applied,
  };
}

/**
 * Sanitize an entire row of CSV data
 *
 * @param row - Array of field values
 * @param config - Sanitization configuration
 * @returns Sanitized row with modification count
 */
export function sanitizeRow(
  row: string[],
  config: Partial<SanitizeConfig> = {}
): { row: string[]; modifications: number; summary: Record<string, number> } {
  const summary: Record<string, number> = {};
  let modifications = 0;

  const sanitizedRow = row.map((field) => {
    const result = sanitizeField(field, config);
    if (result.wasModified) {
      modifications++;
      result.sanitizationApplied.forEach((s) => {
        summary[s] = (summary[s] || 0) + 1;
      });
    }
    return result.value;
  });

  return { row: sanitizedRow, modifications, summary };
}

/**
 * Sanitize a batch of CSV rows
 *
 * @param rows - 2D array of CSV data
 * @param config - Sanitization configuration
 * @returns Sanitized data with summary statistics
 */
export function sanitizeCSVBatch(
  rows: string[][],
  config: Partial<SanitizeConfig> = {}
): BatchSanitizeResult {
  const summary: Record<string, number> = {};
  let totalModifications = 0;

  const sanitizedRows = rows.map((row) => {
    const result = sanitizeRow(row, config);
    totalModifications += result.modifications;
    Object.entries(result.summary).forEach(([key, count]) => {
      summary[key] = (summary[key] || 0) + count;
    });
    return result.row;
  });

  return {
    rows: sanitizedRows,
    totalModifications,
    sanitizationSummary: summary,
  };
}

/**
 * Canonicalize header names to a standard format
 *
 * - Convert to lowercase
 * - Replace spaces/special chars with underscores
 * - Remove leading/trailing underscores
 * - Limit to alphanumeric and underscores
 *
 * @param header - Original header name
 * @returns Canonicalized header name
 */
export function canonicalizeHeader(header: string): string {
  if (!header) return 'unnamed_column';

  return (
    header
      .toLowerCase()
      .trim()
      .normalize('NFC')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'unnamed_column'
  );
}

/**
 * Canonicalize all headers in a CSV
 *
 * @param headers - Original header array
 * @returns Canonicalized headers with uniqueness guaranteed
 */
export function canonicalizeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();

  return headers.map((header) => {
    const baseCanonical = canonicalizeHeader(header);
    const count = seen.get(baseCanonical) || 0;

    let result = baseCanonical;
    if (count > 0) {
      result = `${baseCanonical}_${count + 1}`;
    }

    seen.set(baseCanonical, count + 1);
    return result;
  });
}

/**
 * Validate and normalize a date string
 *
 * @param value - Date string to normalize
 * @returns ISO 8601 date string or null if invalid
 */
export function normalizeDate(value: string): string | null {
  if (!value || !value.trim()) return null;

  // Try parsing various formats
  const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
  const usSlashFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const usDashFormat = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;

  // Try ISO format first
  const isoMatch = value.match(isoFormat);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2];
    const day = isoMatch[3];
    if (year && month && day) {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return `${year}-${month}-${day}`;
      }
    }
  }

  // Try US format MM/DD/YYYY or MM-DD-YYYY
  const usMatch = value.match(usSlashFormat) || value.match(usDashFormat);
  if (usMatch) {
    const month = usMatch[1];
    const day = usMatch[2];
    const year = usMatch[3];
    if (year && month && day) {
      const m = month.padStart(2, '0');
      const d = day.padStart(2, '0');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return `${year}-${m}-${d}`;
      }
    }
  }

  // Try built-in Date parsing as last resort
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Validate and normalize a numeric value
 *
 * @param value - String value to normalize
 * @returns Normalized number string or null if invalid
 */
export function normalizeNumber(value: string): string | null {
  if (!value || !value.trim()) return null;

  // Remove common formatting
  const cleaned = value.replace(/[$,\s]/g, '').replace(/\(([0-9.]+)\)/, '-$1'); // Handle negative in parentheses

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  // Return with reasonable precision
  return String(num);
}

/**
 * Normalize hours worked value (specific to ESTA tracking)
 *
 * @param value - Hours string to normalize
 * @returns Normalized decimal hours or null
 */
export function normalizeHours(value: string): string | null {
  const normalized = normalizeNumber(value);
  if (normalized === null) return null;

  const hours = parseFloat(normalized);

  // Validate reasonable range (0 to 168 hours per week max)
  if (hours < 0 || hours > 168) return null;

  // Round to 2 decimal places
  return hours.toFixed(2);
}
