import { describe, it, expect } from 'vitest';
import {
  ACCRUAL_RATE_DENOMINATOR,
  LARGE_EMPLOYER_RULES,
  SMALL_EMPLOYER_RULES,
  EMPLOYER_SIZE_THRESHOLD,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  CSV_LIMITS,
  PAGINATION_DEFAULTS,
  DATE_FORMATS,
  REGEX_PATTERNS,
  ERROR_CODES,
  HTTP_STATUS,
} from '../constants';

describe('constants', () => {
  describe('ESTA Rules', () => {
    it('should define accrual rate denominator', () => {
      expect(ACCRUAL_RATE_DENOMINATOR).toBe(30);
    });

    it('should define employer size threshold', () => {
      expect(EMPLOYER_SIZE_THRESHOLD).toBe(10);
    });

    it('should have correct large employer rules', () => {
      expect(LARGE_EMPLOYER_RULES.employerSize).toBe('large');
      expect(LARGE_EMPLOYER_RULES.accrualRate).toBe(1 / 30);
      expect(LARGE_EMPLOYER_RULES.maxPaidHoursPerYear).toBe(72);
      expect(LARGE_EMPLOYER_RULES.maxUnpaidHoursPerYear).toBe(0);
      expect(LARGE_EMPLOYER_RULES.carryoverCap).toBe(72);
      expect(LARGE_EMPLOYER_RULES.auditRetentionYears).toBe(3);
    });

    it('should have correct small employer rules', () => {
      expect(SMALL_EMPLOYER_RULES.employerSize).toBe('small');
      expect(SMALL_EMPLOYER_RULES.accrualRate).toBe(0);
      expect(SMALL_EMPLOYER_RULES.maxPaidHoursPerYear).toBe(40);
      expect(SMALL_EMPLOYER_RULES.maxUnpaidHoursPerYear).toBe(32);
      expect(SMALL_EMPLOYER_RULES.carryoverCap).toBe(40);
      expect(SMALL_EMPLOYER_RULES.auditRetentionYears).toBe(3);
    });
  });

  describe('File Upload Constants', () => {
    it('should define max file size (10MB)', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });

    it('should include common image types', () => {
      expect(ALLOWED_FILE_TYPES).toContain('image/jpeg');
      expect(ALLOWED_FILE_TYPES).toContain('image/png');
      expect(ALLOWED_FILE_TYPES).toContain('image/gif');
    });

    it('should include PDF type', () => {
      expect(ALLOWED_FILE_TYPES).toContain('application/pdf');
    });

    it('should include Word document types', () => {
      expect(ALLOWED_FILE_TYPES).toContain('application/msword');
      expect(ALLOWED_FILE_TYPES).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });
  });

  describe('CSV Limits', () => {
    it('should define CSV row limit', () => {
      expect(CSV_LIMITS.maxRows).toBe(10000);
    });

    it('should define CSV column limit', () => {
      expect(CSV_LIMITS.maxColumns).toBe(50);
    });

    it('should define max cell size', () => {
      expect(CSV_LIMITS.maxCellSize).toBe(10000);
    });
  });

  describe('Pagination Defaults', () => {
    it('should define default page', () => {
      expect(PAGINATION_DEFAULTS.page).toBe(1);
    });

    it('should define default limit', () => {
      expect(PAGINATION_DEFAULTS.limit).toBe(25);
    });

    it('should define max limit', () => {
      expect(PAGINATION_DEFAULTS.maxLimit).toBe(100);
    });
  });

  describe('Date Formats', () => {
    it('should define ISO format', () => {
      expect(DATE_FORMATS.iso).toBe('yyyy-MM-dd');
    });

    it('should define display format', () => {
      expect(DATE_FORMATS.display).toBe('MM/dd/yyyy');
    });

    it('should define display with time format', () => {
      expect(DATE_FORMATS.displayWithTime).toBe('MM/dd/yyyy HH:mm');
    });

    it('should define long display format', () => {
      expect(DATE_FORMATS.displayLong).toBe('MMMM d, yyyy');
    });
  });

  describe('Regex Patterns', () => {
    it('should have email pattern', () => {
      expect(REGEX_PATTERNS.email).toBeInstanceOf(RegExp);
      expect(REGEX_PATTERNS.email.test('test@example.com')).toBe(true);
    });

    it('should have phone pattern', () => {
      expect(REGEX_PATTERNS.phone).toBeInstanceOf(RegExp);
      expect(REGEX_PATTERNS.phone.test('555-123-4567')).toBe(true);
    });

    it('should have ZIP code pattern', () => {
      expect(REGEX_PATTERNS.zipCode).toBeInstanceOf(RegExp);
      expect(REGEX_PATTERNS.zipCode.test('12345')).toBe(true);
    });

    it('should have ISO date pattern', () => {
      expect(REGEX_PATTERNS.isoDate).toBeInstanceOf(RegExp);
      expect(REGEX_PATTERNS.isoDate.test('2024-01-01')).toBe(true);
    });
  });

  describe('Error Codes', () => {
    it('should define common error codes', () => {
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });

    it('should define business logic error codes', () => {
      expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(ERROR_CODES.INSUFFICIENT_BALANCE).toBe('INSUFFICIENT_BALANCE');
      expect(ERROR_CODES.DUPLICATE_ENTRY).toBe('DUPLICATE_ENTRY');
    });
  });

  describe('HTTP Status Codes', () => {
    it('should define success status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.NO_CONTENT).toBe(204);
    });

    it('should define client error status codes', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.CONFLICT).toBe(409);
    });

    it('should define server error status codes', () => {
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });
});
