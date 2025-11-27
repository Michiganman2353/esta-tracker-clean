/**
 * Tests for CSV Sanitizer
 */
import { describe, it, expect } from 'vitest';
import {
  sanitizeField,
  sanitizeRow,
  sanitizeCSVBatch,
  hasFormulaPrefix,
  canonicalizeHeader,
  canonicalizeHeaders,
  normalizeDate,
  normalizeNumber,
  normalizeHours,
  DEFAULT_SANITIZE_CONFIG,
} from '../sanitizer';

describe('CSV Sanitizer', () => {
  describe('hasFormulaPrefix', () => {
    it('should detect formula prefix characters', () => {
      expect(hasFormulaPrefix('=SUM(A1:A10)')).toBe(true);
      expect(hasFormulaPrefix('+1234')).toBe(true);
      expect(hasFormulaPrefix('-100')).toBe(true);
      expect(hasFormulaPrefix('@email')).toBe(true);
    });

    it('should return false for safe values', () => {
      expect(hasFormulaPrefix('John Doe')).toBe(false);
      expect(hasFormulaPrefix('123')).toBe(false);
      expect(hasFormulaPrefix('')).toBe(false);
    });
  });

  describe('sanitizeField', () => {
    it('should prevent formula injection', () => {
      const result = sanitizeField('=SUM(A1:A10)');
      expect(result.value).toBe("'=SUM(A1:A10)");
      expect(result.wasModified).toBe(true);
      expect(result.sanitizationApplied).toContain(
        'formula_injection_prevention'
      );
    });

    it('should remove control characters', () => {
      const result = sanitizeField('Hello\x00World\x1F');
      expect(result.value).toBe('HelloWorld');
      expect(result.wasModified).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = sanitizeField('  John Doe  ');
      expect(result.value).toBe('John Doe');
      expect(result.wasModified).toBe(true);
    });

    it('should normalize line endings', () => {
      const result = sanitizeField('Line1\r\nLine2\rLine3');
      expect(result.value).toBe('Line1\nLine2\nLine3');
      expect(result.wasModified).toBe(true);
    });

    it('should handle null values', () => {
      // @ts-expect-error testing null handling
      const result = sanitizeField(null);
      expect(result.value).toBe('');
      expect(result.wasModified).toBe(true);
    });

    it('should truncate long values', () => {
      const longValue = 'x'.repeat(15000);
      const result = sanitizeField(longValue, { maxFieldLength: 10000 });
      expect(result.value.length).toBe(10000);
      expect(result.sanitizationApplied).toContain('truncate');
    });

    it('should not modify safe values', () => {
      const result = sanitizeField('John Doe');
      expect(result.value).toBe('John Doe');
      expect(result.wasModified).toBe(false);
    });

    it('should respect disabled options', () => {
      const result = sanitizeField('=FORMULA', {
        preventFormulaInjection: false,
      });
      expect(result.value).toBe('=FORMULA');
    });
  });

  describe('sanitizeRow', () => {
    it('should sanitize all fields in a row', () => {
      const row = ['  John  ', '=SUM()', 'Normal'];
      const result = sanitizeRow(row);

      expect(result.row).toEqual(['John', "'=SUM()", 'Normal']);
      expect(result.modifications).toBe(2);
    });

    it('should track sanitization summary', () => {
      const row = ['  spaces  ', '=formula', '\x00control'];
      const result = sanitizeRow(row);

      expect(result.summary['trim_whitespace']).toBeDefined();
      expect(result.summary['formula_injection_prevention']).toBeDefined();
    });
  });

  describe('sanitizeCSVBatch', () => {
    it('should sanitize all rows in batch', () => {
      const rows = [
        ['  John  ', '=SUM()'],
        ['Jane', '+123'],
      ];
      const result = sanitizeCSVBatch(rows);

      expect(result.rows[0]).toEqual(['John', "'=SUM()"]);
      expect(result.rows[1]).toEqual(['Jane', "'+123"]);
      expect(result.totalModifications).toBe(3);
    });

    it('should aggregate sanitization summary', () => {
      const rows = [
        ['=a', '=b'],
        ['=c', '=d'],
      ];
      const result = sanitizeCSVBatch(rows);

      expect(result.sanitizationSummary['formula_injection_prevention']).toBe(
        4
      );
    });
  });

  describe('canonicalizeHeader', () => {
    it('should lowercase headers', () => {
      expect(canonicalizeHeader('FirstName')).toBe('firstname');
    });

    it('should replace spaces with underscores', () => {
      expect(canonicalizeHeader('First Name')).toBe('first_name');
    });

    it('should remove special characters', () => {
      expect(canonicalizeHeader('Email (Work)')).toBe('email_work');
    });

    it('should handle empty headers', () => {
      expect(canonicalizeHeader('')).toBe('unnamed_column');
    });

    it('should collapse multiple underscores', () => {
      expect(canonicalizeHeader('First   Name')).toBe('first_name');
    });
  });

  describe('canonicalizeHeaders', () => {
    it('should canonicalize all headers', () => {
      const headers = ['First Name', 'Last Name', 'Email'];
      expect(canonicalizeHeaders(headers)).toEqual([
        'first_name',
        'last_name',
        'email',
      ]);
    });

    it('should handle duplicate headers', () => {
      const headers = ['Name', 'Name', 'Name'];
      expect(canonicalizeHeaders(headers)).toEqual([
        'name',
        'name_2',
        'name_3',
      ]);
    });
  });

  describe('normalizeDate', () => {
    it('should handle ISO format', () => {
      expect(normalizeDate('2024-01-15')).toBe('2024-01-15');
    });

    it('should handle US format MM/DD/YYYY', () => {
      expect(normalizeDate('1/15/2024')).toBe('2024-01-15');
      expect(normalizeDate('01/15/2024')).toBe('2024-01-15');
    });

    it('should handle US format MM-DD-YYYY', () => {
      expect(normalizeDate('1-15-2024')).toBe('2024-01-15');
    });

    it('should return null for invalid dates', () => {
      expect(normalizeDate('not a date')).toBe(null);
      expect(normalizeDate('')).toBe(null);
    });
  });

  describe('normalizeNumber', () => {
    it('should handle plain numbers', () => {
      expect(normalizeNumber('123')).toBe('123');
      expect(normalizeNumber('123.45')).toBe('123.45');
    });

    it('should remove formatting', () => {
      expect(normalizeNumber('$1,234.56')).toBe('1234.56');
      expect(normalizeNumber('1,000')).toBe('1000');
    });

    it('should handle negative in parentheses', () => {
      expect(normalizeNumber('(100)')).toBe('-100');
    });

    it('should return null for invalid numbers', () => {
      expect(normalizeNumber('not a number')).toBe(null);
      expect(normalizeNumber('')).toBe(null);
    });
  });

  describe('normalizeHours', () => {
    it('should normalize valid hours', () => {
      expect(normalizeHours('8')).toBe('8.00');
      expect(normalizeHours('7.5')).toBe('7.50');
    });

    it('should reject hours out of range', () => {
      expect(normalizeHours('-1')).toBe(null);
      expect(normalizeHours('200')).toBe(null);
    });

    it('should accept boundary values', () => {
      expect(normalizeHours('0')).toBe('0.00');
      expect(normalizeHours('168')).toBe('168.00');
    });
  });

  describe('DEFAULT_SANITIZE_CONFIG', () => {
    it('should have expected defaults', () => {
      expect(DEFAULT_SANITIZE_CONFIG.preventFormulaInjection).toBe(true);
      expect(DEFAULT_SANITIZE_CONFIG.removeControlCharacters).toBe(true);
      expect(DEFAULT_SANITIZE_CONFIG.trimWhitespace).toBe(true);
      expect(DEFAULT_SANITIZE_CONFIG.maxFieldLength).toBe(10000);
    });
  });
});
