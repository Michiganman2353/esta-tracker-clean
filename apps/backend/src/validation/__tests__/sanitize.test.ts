/**
 * Unit tests for sanitization utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  escapeHtml,
  normalizeNumber,
  normalizeDate,
  normalizeEmail,
  sanitizeObject,
} from '../sanitize.js';

describe('Sanitization Utilities', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>hello')).toBe('alert("xss")hello');
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
    });

    it('should normalize multiple spaces', () => {
      expect(sanitizeString('hello   world')).toBe('hello world');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('hello & world')).toBe('hello &amp; world');
    });

    it('should escape less than', () => {
      expect(escapeHtml('a < b')).toBe('a &lt; b');
    });

    it('should escape greater than', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("'hello'")).toBe('&#x27;hello&#x27;');
    });

    it('should escape forward slash', () => {
      expect(escapeHtml('a/b')).toBe('a&#x2F;b');
    });

    it('should handle strings without special characters', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('normalizeNumber', () => {
    it('should pass through numbers', () => {
      expect(normalizeNumber(42)).toBe(42);
    });

    it('should parse numeric strings', () => {
      expect(normalizeNumber('42')).toBe(42);
    });

    it('should parse floats', () => {
      expect(normalizeNumber('3.14')).toBe(3.14);
    });

    it('should handle strings with whitespace', () => {
      expect(normalizeNumber('  42  ')).toBe(42);
    });

    it('should return null for empty strings', () => {
      expect(normalizeNumber('')).toBe(null);
    });

    it('should return null for non-numeric strings', () => {
      expect(normalizeNumber('abc')).toBe(null);
    });

    it('should return null for NaN', () => {
      expect(normalizeNumber(NaN)).toBe(null);
    });

    it('should return null for objects', () => {
      expect(normalizeNumber({})).toBe(null);
    });
  });

  describe('normalizeDate', () => {
    it('should convert Date objects to ISO string', () => {
      const date = new Date('2024-01-15T00:00:00.000Z');
      const result = normalizeDate(date);
      expect(result).toBe('2024-01-15T00:00:00.000Z');
    });

    it('should parse date strings', () => {
      const result = normalizeDate('2024-01-15');
      expect(result).toBeTruthy();
      expect(result?.includes('2024-01-15')).toBe(true);
    });

    it('should return null for empty strings', () => {
      expect(normalizeDate('')).toBe(null);
    });

    it('should return null for invalid dates', () => {
      expect(normalizeDate('not a date')).toBe(null);
    });
  });

  describe('normalizeEmail', () => {
    it('should lowercase email', () => {
      expect(normalizeEmail('John@Example.COM')).toBe('john@example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  john@example.com  ')).toBe('john@example.com');
    });
  });

  describe('sanitizeObject', () => {
    it('should trim string values by default', () => {
      const obj = { name: '  John  ', age: 25 };
      const result = sanitizeObject(obj);
      expect(result.name).toBe('John');
      expect(result.age).toBe(25);
    });

    it('should normalize specified email fields', () => {
      const obj = { email: 'JOHN@EXAMPLE.COM', name: 'John' };
      const result = sanitizeObject(obj, { normalizeEmails: ['email'] });
      expect(result.email).toBe('john@example.com');
    });

    it('should normalize specified date fields', () => {
      const obj = { createdAt: '2024-01-15', name: 'John' };
      const result = sanitizeObject(obj, { normalizeDates: ['createdAt'] });
      expect(result.createdAt).toBeTruthy();
    });

    it('should normalize specified number fields', () => {
      const obj = { count: '42', name: 'John' };
      const result = sanitizeObject(obj, { normalizeNumbers: ['count'] });
      expect(result.count).toBe(42);
    });

    it('should not modify original object', () => {
      const obj = { name: '  John  ' };
      sanitizeObject(obj);
      expect(obj.name).toBe('  John  ');
    });
  });
});
