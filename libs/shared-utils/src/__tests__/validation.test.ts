import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidZipCode,
  isInRange,
  isNonEmptyString,
  isValidHoursWorked,
  isValidHoursPerWeek,
  sanitizeString,
  isNotFutureDate,
  isRecentDate,
} from '../validation';

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate US phone numbers', () => {
      expect(isValidPhoneNumber('555-123-4567')).toBe(true);
      expect(isValidPhoneNumber('(555) 123-4567')).toBe(true);
      expect(isValidPhoneNumber('5551234567')).toBe(true);
      expect(isValidPhoneNumber('+1 555-123-4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('invalid')).toBe(false);
      expect(isValidPhoneNumber('555-12-4567')).toBe(false);
    });
  });

  describe('isValidZipCode', () => {
    it('should validate 5-digit ZIP codes', () => {
      expect(isValidZipCode('12345')).toBe(true);
    });

    it('should validate ZIP+4 format', () => {
      expect(isValidZipCode('12345-6789')).toBe(true);
    });

    it('should reject invalid ZIP codes', () => {
      expect(isValidZipCode('1234')).toBe(false);
      expect(isValidZipCode('123456')).toBe(false);
      expect(isValidZipCode('abcde')).toBe(false);
      expect(isValidZipCode('12345-678')).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should return true for values within range', () => {
      expect(isInRange(5, 0, 10)).toBe(true);
    });

    it('should return true for boundary values', () => {
      expect(isInRange(0, 0, 10)).toBe(true);
      expect(isInRange(10, 0, 10)).toBe(true);
    });

    it('should return false for values outside range', () => {
      expect(isInRange(-1, 0, 10)).toBe(false);
      expect(isInRange(11, 0, 10)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('test')).toBe(true);
      expect(isNonEmptyString('  test  ')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isNonEmptyString(null as any)).toBe(false);
      expect(isNonEmptyString(undefined as any)).toBe(false);
      expect(isNonEmptyString(123 as any)).toBe(false);
    });
  });

  describe('isValidHoursWorked', () => {
    it('should validate hours between 0 and 24', () => {
      expect(isValidHoursWorked(0)).toBe(true);
      expect(isValidHoursWorked(8)).toBe(true);
      expect(isValidHoursWorked(24)).toBe(true);
    });

    it('should reject hours outside 0-24 range', () => {
      expect(isValidHoursWorked(-1)).toBe(false);
      expect(isValidHoursWorked(25)).toBe(false);
    });

    it('should handle decimal hours', () => {
      expect(isValidHoursWorked(8.5)).toBe(true);
    });
  });

  describe('isValidHoursPerWeek', () => {
    it('should validate hours between 0 and 168', () => {
      expect(isValidHoursPerWeek(0)).toBe(true);
      expect(isValidHoursPerWeek(40)).toBe(true);
      expect(isValidHoursPerWeek(168)).toBe(true);
    });

    it('should reject hours outside 0-168 range', () => {
      expect(isValidHoursPerWeek(-1)).toBe(false);
      expect(isValidHoursPerWeek(169)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove HTML tag markers', () => {
      expect(sanitizeString('Hello <script>alert("xss")</script>')).toBe(
        'Hello scriptalert("xss")/script'
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });

    it('should handle strings without dangerous characters', () => {
      expect(sanitizeString('normal text')).toBe('normal text');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('isNotFutureDate', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isNotFutureDate(pastDate)).toBe(true);
    });

    it('should return true for today', () => {
      const today = new Date();
      expect(isNotFutureDate(today)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isNotFutureDate(futureDate)).toBe(false);
    });
  });

  describe('isRecentDate', () => {
    it('should return true for dates within specified years', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      expect(isRecentDate(twoYearsAgo, 5)).toBe(true);
    });

    it('should return false for dates beyond specified years', () => {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      expect(isRecentDate(tenYearsAgo, 5)).toBe(false);
    });

    it('should handle boundary case', () => {
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      // Should be true as it's exactly at the boundary
      expect(isRecentDate(fiveYearsAgo, 5)).toBe(true);
    });
  });
});
