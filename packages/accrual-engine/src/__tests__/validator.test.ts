import { describe, it, expect } from 'vitest';
import {
  validateHoursWorked,
  validateAccrualRequest,
  validateUsageRequest,
  validateEmployerSize,
} from '../validator';

describe('accrual validator', () => {
  describe('validateHoursWorked', () => {
    it('should accept valid hours', () => {
      const result = validateHoursWorked(8);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept 0 hours', () => {
      const result = validateHoursWorked(0);
      expect(result.valid).toBe(true);
    });

    it('should accept 24 hours (max)', () => {
      const result = validateHoursWorked(24);
      expect(result.valid).toBe(true);
    });

    it('should accept decimal hours', () => {
      const result = validateHoursWorked(8.5);
      expect(result.valid).toBe(true);
    });

    it('should reject negative hours', () => {
      const result = validateHoursWorked(-1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('should reject hours over 24', () => {
      const result = validateHoursWorked(25);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('24 hours');
    });
  });

  describe('validateAccrualRequest', () => {
    it('should accept valid accrual request for small employer', () => {
      const result = validateAccrualRequest(8, 20, 'small');
      expect(result.valid).toBe(true);
    });

    it('should accept valid accrual request for large employer', () => {
      const result = validateAccrualRequest(8, 50, 'large');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid hours worked', () => {
      const result = validateAccrualRequest(-5, 20, 'small');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('should reject negative yearly accrued', () => {
      const result = validateAccrualRequest(8, -10, 'small');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('should reject yearly accrued over cap for small employer', () => {
      const result = validateAccrualRequest(8, 50, 'small');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('40');
    });

    it('should reject yearly accrued over cap for large employer', () => {
      const result = validateAccrualRequest(8, 80, 'large');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('72');
    });

    it('should accept yearly accrued at cap', () => {
      const result1 = validateAccrualRequest(8, 40, 'small');
      const result2 = validateAccrualRequest(8, 72, 'large');
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  describe('validateUsageRequest', () => {
    it('should accept valid usage request', () => {
      const result = validateUsageRequest(8, 20);
      expect(result.valid).toBe(true);
    });

    it('should accept request for all available hours', () => {
      const result = validateUsageRequest(20, 20);
      expect(result.valid).toBe(true);
    });

    it('should reject request exceeding available hours', () => {
      const result = validateUsageRequest(25, 20);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient');
      expect(result.error).toContain('25');
      expect(result.error).toContain('20');
    });

    it('should reject 0 hours request', () => {
      const result = validateUsageRequest(0, 20);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('should reject negative hours request', () => {
      const result = validateUsageRequest(-5, 20);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('should handle zero available hours', () => {
      const result = validateUsageRequest(1, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient');
    });
  });

  describe('validateEmployerSize', () => {
    it('should classify as small employer with less than 10 employees', () => {
      expect(validateEmployerSize(5)).toBe('small');
      expect(validateEmployerSize(9)).toBe('small');
      expect(validateEmployerSize(1)).toBe('small');
    });

    it('should classify as large employer with 10 or more employees', () => {
      expect(validateEmployerSize(10)).toBe('large');
      expect(validateEmployerSize(15)).toBe('large');
      expect(validateEmployerSize(100)).toBe('large');
    });

    it('should handle boundary case of exactly 10 employees', () => {
      expect(validateEmployerSize(10)).toBe('large');
    });
  });
});
