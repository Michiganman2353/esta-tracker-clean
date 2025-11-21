import { describe, it, expect } from 'vitest';
import {
  getMaxAccrualForEmployerSize,
  getAccrualCap,
  hasReachedAccrualCap,
  getRemainingAccrualCapacity,
  getMaxUsageLimit,
} from '../rules';

describe('accrual rules', () => {
  describe('getMaxAccrualForEmployerSize', () => {
    it('should return small employer rules', () => {
      const rules = getMaxAccrualForEmployerSize('small');
      expect(rules.employerSize).toBe('small');
      expect(rules.maxPaidHoursPerYear).toBe(40);
      expect(rules.maxUnpaidHoursPerYear).toBe(32);
      expect(rules.carryoverCap).toBe(40);
    });

    it('should return large employer rules', () => {
      const rules = getMaxAccrualForEmployerSize('large');
      expect(rules.employerSize).toBe('large');
      expect(rules.maxPaidHoursPerYear).toBe(72);
      expect(rules.maxUnpaidHoursPerYear).toBe(0);
      expect(rules.carryoverCap).toBe(72);
    });

    it('should include accrual rate for large employers', () => {
      const rules = getMaxAccrualForEmployerSize('large');
      expect(rules.accrualRate).toBe(1 / 30);
    });

    it('should have 0 accrual rate for small employers', () => {
      const rules = getMaxAccrualForEmployerSize('small');
      expect(rules.accrualRate).toBe(0);
    });
  });

  describe('getAccrualCap', () => {
    it('should return 40 for small employers', () => {
      expect(getAccrualCap('small')).toBe(40);
    });

    it('should return 72 for large employers', () => {
      expect(getAccrualCap('large')).toBe(72);
    });
  });

  describe('hasReachedAccrualCap', () => {
    it('should return false when below cap for small employer', () => {
      expect(hasReachedAccrualCap(30, 'small')).toBe(false);
    });

    it('should return true when at cap for small employer', () => {
      expect(hasReachedAccrualCap(40, 'small')).toBe(true);
    });

    it('should return true when over cap for small employer', () => {
      expect(hasReachedAccrualCap(45, 'small')).toBe(true);
    });

    it('should return false when below cap for large employer', () => {
      expect(hasReachedAccrualCap(50, 'large')).toBe(false);
    });

    it('should return true when at cap for large employer', () => {
      expect(hasReachedAccrualCap(72, 'large')).toBe(true);
    });

    it('should return true when over cap for large employer', () => {
      expect(hasReachedAccrualCap(80, 'large')).toBe(true);
    });
  });

  describe('getRemainingAccrualCapacity', () => {
    it('should calculate remaining capacity for small employer', () => {
      expect(getRemainingAccrualCapacity(25, 'small')).toBe(15);
    });

    it('should calculate remaining capacity for large employer', () => {
      expect(getRemainingAccrualCapacity(50, 'large')).toBe(22);
    });

    it('should return 0 when at cap', () => {
      expect(getRemainingAccrualCapacity(72, 'large')).toBe(0);
    });

    it('should return 0 when over cap', () => {
      expect(getRemainingAccrualCapacity(80, 'large')).toBe(0);
    });

    it('should return full capacity when no accrual yet', () => {
      expect(getRemainingAccrualCapacity(0, 'small')).toBe(40);
      expect(getRemainingAccrualCapacity(0, 'large')).toBe(72);
    });
  });

  describe('getMaxUsageLimit', () => {
    it('should return paid limit for small employer', () => {
      expect(getMaxUsageLimit('small', true)).toBe(40);
    });

    it('should return unpaid limit for small employer', () => {
      expect(getMaxUsageLimit('small', false)).toBe(32);
    });

    it('should return paid limit for large employer', () => {
      expect(getMaxUsageLimit('large', true)).toBe(72);
    });

    it('should return 0 unpaid limit for large employer', () => {
      expect(getMaxUsageLimit('large', false)).toBe(0);
    });
  });
});
