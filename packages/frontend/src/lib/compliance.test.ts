import { describe, it, expect } from 'vitest';
import {
  calculateAccrual,
  calculateCarryover,
  validateUsageRequest,
  SMALL_EMPLOYER_RULES,
  LARGE_EMPLOYER_RULES,
} from '../lib/compliance';

describe('Michigan ESTA Compliance Engine', () => {
  describe('Accrual Calculation', () => {
    it('should calculate accrual for large employer (1 hr per 30 worked)', () => {
      const accrued = calculateAccrual(30, 'large', 0);
      expect(accrued).toBe(1);
    });

    it('should calculate accrual for 60 hours worked (large employer)', () => {
      const accrued = calculateAccrual(60, 'large', 0);
      expect(accrued).toBe(2);
    });

    it('should return 0 for small employer ongoing accrual', () => {
      const accrued = calculateAccrual(30, 'small', 0);
      expect(accrued).toBe(0);
    });

    it('should cap accrual at max yearly hours', () => {
      const accrued = calculateAccrual(3000, 'large', 70);
      expect(accrued).toBe(2); // 72 max - 70 already accrued
    });
  });

  describe('Carryover Calculation', () => {
    it('should carryover full balance if under cap (small employer)', () => {
      const carryover = calculateCarryover(30, 'small');
      expect(carryover).toBe(30);
    });

    it('should cap carryover at 40 hours for small employer', () => {
      const carryover = calculateCarryover(50, 'small');
      expect(carryover).toBe(40);
    });

    it('should cap carryover at 72 hours for large employer', () => {
      const carryover = calculateCarryover(100, 'large');
      expect(carryover).toBe(72);
    });
  });

  describe('Usage Request Validation', () => {
    it('should validate paid request with sufficient balance', () => {
      const result = validateUsageRequest(8, true, 40, 0, 'large');
      expect(result.valid).toBe(true);
    });

    it('should reject paid request with insufficient balance', () => {
      const result = validateUsageRequest(50, true, 40, 0, 'large');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient paid hours');
    });

    it('should reject unpaid request for large employer', () => {
      const result = validateUsageRequest(8, false, 40, 32, 'large');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Large employers do not offer unpaid');
    });

    it('should validate unpaid request for small employer', () => {
      const result = validateUsageRequest(8, false, 40, 32, 'small');
      expect(result.valid).toBe(true);
    });

    it('should reject negative hours', () => {
      const result = validateUsageRequest(-5, true, 40, 0, 'large');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be positive');
    });
  });

  describe('Compliance Rules', () => {
    it('should have correct small employer rules', () => {
      expect(SMALL_EMPLOYER_RULES.maxPaidHoursPerYear).toBe(40);
      expect(SMALL_EMPLOYER_RULES.maxUnpaidHoursPerYear).toBe(32);
      expect(SMALL_EMPLOYER_RULES.carryoverCap).toBe(40);
      expect(SMALL_EMPLOYER_RULES.auditRetentionYears).toBe(3);
    });

    it('should have correct large employer rules', () => {
      expect(LARGE_EMPLOYER_RULES.maxPaidHoursPerYear).toBe(72);
      expect(LARGE_EMPLOYER_RULES.maxUnpaidHoursPerYear).toBe(0);
      expect(LARGE_EMPLOYER_RULES.carryoverCap).toBe(72);
      expect(LARGE_EMPLOYER_RULES.accrualRate).toBe(1 / 30);
      expect(LARGE_EMPLOYER_RULES.auditRetentionYears).toBe(3);
    });
  });
});
