/**
 * Sanitization utilities for cleaning and normalizing input data.
 * All transformations happen after validation and before business logic.
 */

/**
 * Removes HTML tags and potentially dangerous characters from a string.
 * Protects against XSS attacks.
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}

/**
 * Escapes HTML entities to prevent XSS in rendered content.
 */
export function escapeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Normalizes a numeric string to an actual number.
 * Returns null if the input cannot be parsed.
 */
export function normalizeNumber(input: unknown): number | null {
  if (typeof input === 'number' && !Number.isNaN(input)) {
    return input;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '') {
      return null;
    }
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

/**
 * Normalizes a date string to ISO format.
 * Returns null if the input cannot be parsed.
 */
export function normalizeDate(input: unknown): string | null {
  if (input instanceof Date) {
    return input.toISOString();
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '') {
      return null;
    }
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return null;
}

/**
 * Normalizes an email address to lowercase and trims whitespace.
 */
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Sanitizes and normalizes an object by applying transformations to all string fields.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    trimStrings?: boolean;
    normalizeEmails?: string[];
    normalizeDates?: string[];
    normalizeNumbers?: string[];
  } = {}
): T {
  const {
    trimStrings = true,
    normalizeEmails = [],
    normalizeDates = [],
    normalizeNumbers = [],
  } = options;

  const result = { ...obj } as Record<string, unknown>;

  for (const [key, value] of Object.entries(result)) {
    // Apply number normalization first (can handle strings)
    if (normalizeNumbers.includes(key)) {
      result[key] = normalizeNumber(value) ?? value;
    }
    // Apply other string transformations
    else if (typeof value === 'string') {
      // Apply email normalization
      if (normalizeEmails.includes(key)) {
        result[key] = normalizeEmail(value);
      }
      // Apply date normalization
      else if (normalizeDates.includes(key)) {
        result[key] = normalizeDate(value) ?? value;
      }
      // Apply basic string sanitization
      else if (trimStrings) {
        result[key] = sanitizeString(value);
      }
    }
  }

  return result as T;
}
