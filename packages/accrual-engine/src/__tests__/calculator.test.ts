import { describe, it, expect } from 'vitest';
import {
  calculateAccrual,
  calculateHoursNeededForAccrual,
  calculateAnnualGrant,
  calculateAvailableHours,
  isWithinUsageLimit,
} from '../calculator';

describe('accrual calculator', () => {
  describe('calculateAccrual', () => {
    it('should calculate accrual for large employers (1 hour per 30)', () => {
      const result = calculateAccrual(30, 'large', 0);
      expect(result.accrued).toBe(1);
      expect(result.cap).toBe(72);
      expect(result.remaining).toBe(72);
      expect(result.capped).toBe(false);
    });

    it('should calculate accrual for 60 hours worked for large employer', () => {
      const result = calculateAccrual(60, 'large', 0);
      expect(result.accrued).toBe(2);
      expect(result.cap).toBe(72);
      expect(result.remaining).toBe(72);
    });

    it('should respect yearly accrual cap for large employers', () => {
      const result = calculateAccrual(30, 'large', 71);
      expect(result.accrued).toBe(1);
      expect(result.remaining).toBe(1);
      expect(result.capped).toBe(false);
    });

    it('should cap accrual when limit is reached for large employers', () => {
      const result = calculateAccrual(30, 'large', 72);
      expect(result.accrued).toBe(0);
      expect(result.remaining).toBe(0);
      expect(result.capped).toBe(true);
    });

    it('should cap partial accrual when approaching limit', () => {
      const result = calculateAccrual(60, 'large', 71);
      // 60 hours would normally accrue 2 hours, but only 1 hour of capacity remains
      expect(result.accrued).toBe(1);
      expect(result.remaining).toBe(1); // 1 hour remaining before this accrual
      expect(result.capped).toBe(true); // Capping occurred because we couldn't accrue full 2 hours
    });

    it('should return 0 accrual for small employers', () => {
      const result = calculateAccrual(30, 'small', 0);
      expect(result.accrued).toBe(0);
      expect(result.cap).toBe(40);
      expect(result.remaining).toBe(40);
      expect(result.capped).toBe(false);
    });

    it('should track remaining capacity for small employers', () => {
      const result = calculateAccrual(30, 'small', 25);
      expect(result.accrued).toBe(0);
      expect(result.remaining).toBe(15);
    });
  });

  describe('calculateHoursNeededForAccrual', () => {
    it('should calculate hours needed for large employers', () => {
      const hoursNeeded = calculateHoursNeededForAccrual(8, 'large');
      expect(hoursNeeded).toBe(240); // 8 * 30
    });

    it('should calculate hours for 1 hour accrual', () => {
      const hoursNeeded = calculateHoursNeededForAccrual(1, 'large');
      expect(hoursNeeded).toBe(30);
    });

    it('should return 0 for small employers', () => {
      const hoursNeeded = calculateHoursNeededForAccrual(8, 'small');
      expect(hoursNeeded).toBe(0);
    });
  });

  describe('calculateAnnualGrant', () => {
    it('should grant 40 hours for small employers', () => {
      const grant = calculateAnnualGrant('small');
      expect(grant).toBe(40);
    });

    it('should grant 0 hours for large employers', () => {
      const grant = calculateAnnualGrant('large');
      expect(grant).toBe(0);
    });
  });

  describe('calculateAvailableHours', () => {
    it('should calculate available paid hours for large employer', () => {
      const result = calculateAvailableHours(40, 10, 0, 0, 'large');
      expect(result.availablePaid).toBe(30);
      expect(result.availableUnpaid).toBe(0);
    });

    it('should calculate available hours with carryover', () => {
      const result = calculateAvailableHours(30, 10, 0, 20, 'large');
      expect(result.availablePaid).toBe(40); // 30 + 20 - 10
    });

    it('should cap total accrued at maximum for large employer', () => {
      const result = calculateAvailableHours(50, 0, 0, 30, 'large');
      // 50 + 30 = 80, but capped at 72
      expect(result.availablePaid).toBe(72);
    });

    it('should calculate paid and unpaid hours for small employer', () => {
      const result = calculateAvailableHours(30, 10, 5, 0, 'small');
      expect(result.availablePaid).toBe(20); // 30 - 10
      expect(result.availableUnpaid).toBe(27); // 32 - 5
    });

    it('should handle zero available hours', () => {
      const result = calculateAvailableHours(20, 20, 0, 0, 'large');
      expect(result.availablePaid).toBe(0);
    });

    it('should not allow negative available hours', () => {
      const result = calculateAvailableHours(10, 15, 0, 0, 'large');
      expect(result.availablePaid).toBe(0);
    });
  });

  describe('isWithinUsageLimit', () => {
    it('should return true when paid request is within limit', () => {
      expect(isWithinUsageLimit(8, 20, 10, true)).toBe(true);
    });

    it('should return false when paid request exceeds limit', () => {
      expect(isWithinUsageLimit(25, 20, 10, true)).toBe(false);
    });

    it('should return true when unpaid request is within limit', () => {
      expect(isWithinUsageLimit(5, 20, 10, false)).toBe(true);
    });

    it('should return false when unpaid request exceeds limit', () => {
      expect(isWithinUsageLimit(15, 20, 10, false)).toBe(false);
    });

    it('should handle exact match', () => {
      expect(isWithinUsageLimit(20, 20, 0, true)).toBe(true);
    });

    it('should handle zero available hours', () => {
      expect(isWithinUsageLimit(1, 0, 0, true)).toBe(false);
    });
  });
});
