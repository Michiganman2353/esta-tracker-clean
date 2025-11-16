import { describe, it, expect } from 'vitest';
import {
  calculateAccrual,
  calculateCarryover,
  validateUsageRequest,
  SMALL_EMPLOYER_RULES,
  LARGE_EMPLOYER_RULES,
} from '../services/compliance.js';

describe('Backend Michigan ESTA Compliance Engine', () => {
  describe('Accrual Calculation', () => {
    it('should calculate 1 hour per 30 worked for large employer', () => {
      const accrued = calculateAccrual(30, 'large', 0);
      expect(accrued).toBe(1);
    });

    it('should return 0 for small employer (annual grant)', () => {
      const accrued = calculateAccrual(30, 'small', 0);
      expect(accrued).toBe(0);
    });
  });

  describe('Carryover Rules', () => {
    it('should cap small employer carryover at 40 hours', () => {
      const carryover = calculateCarryover(50, 'small');
      expect(carryover).toBe(40);
    });

    it('should cap large employer carryover at 72 hours', () => {
      const carryover = calculateCarryover(100, 'large');
      expect(carryover).toBe(72);
    });
  });

  describe('Compliance Rules Constants', () => {
    it('should have 3-year audit retention for both employer sizes', () => {
      expect(SMALL_EMPLOYER_RULES.auditRetentionYears).toBe(3);
      expect(LARGE_EMPLOYER_RULES.auditRetentionYears).toBe(3);
    });
  });
});
