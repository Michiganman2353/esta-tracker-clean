import { describe, it, expect } from 'vitest';
import {
  getMaxAccrualForEmployerSize,
  getAccrualCap,
  hasReachedAccrualCap,
  getRemainingAccrualCapacity,
  getMaxUsageLimit,
  PROBATION_PERIOD_DAYS,
  calculateProbationEndDate,
  isInProbationPeriod,
  getRemainingProbationDays,
  getDefaultProbationPolicy,
  getRegionalRules,
  validateProbationPolicy,
  canUseSickTime,
  MICHIGAN_ESTA_RULES,
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

describe('120-Day Probationary Period Rules', () => {
  describe('PROBATION_PERIOD_DAYS', () => {
    it('should be 120 days per Michigan ESTA law', () => {
      expect(PROBATION_PERIOD_DAYS).toBe(120);
    });
  });

  describe('calculateProbationEndDate', () => {
    it('should add waiting period days to hire date', () => {
      const hireDate = new Date('2024-01-01');
      const policy = { enforced: true, waitingPeriodDays: 120 };

      const result = calculateProbationEndDate(hireDate, policy);
      expect(result.toISOString().split('T')[0]).toBe('2024-04-30');
    });

    it('should return hire date if probation not enforced', () => {
      const hireDate = new Date('2024-01-01');
      const policy = { enforced: false, waitingPeriodDays: 120 };

      const result = calculateProbationEndDate(hireDate, policy);
      expect(result.toISOString().split('T')[0]).toBe('2024-01-01');
    });

    it('should cap waiting period at 120 days', () => {
      const hireDate = new Date('2024-01-01');
      const policy = { enforced: true, waitingPeriodDays: 180 };

      const result = calculateProbationEndDate(hireDate, policy);
      // Should use 120 days, not 180
      expect(result.toISOString().split('T')[0]).toBe('2024-04-30');
    });

    it('should handle shorter waiting periods', () => {
      const hireDate = new Date('2024-01-01');
      const policy = { enforced: true, waitingPeriodDays: 30 };

      const result = calculateProbationEndDate(hireDate, policy);
      expect(result.toISOString().split('T')[0]).toBe('2024-01-31');
    });
  });

  describe('isInProbationPeriod', () => {
    const hireDate = new Date('2024-01-01');
    const policy = { enforced: true, waitingPeriodDays: 120 };

    it('should return true when in probation', () => {
      const currentDate = new Date('2024-02-15');
      expect(isInProbationPeriod(hireDate, currentDate, policy)).toBe(true);
    });

    it('should return false after probation ends', () => {
      const currentDate = new Date('2024-05-15');
      expect(isInProbationPeriod(hireDate, currentDate, policy)).toBe(false);
    });

    it('should return false when probation not enforced', () => {
      const currentDate = new Date('2024-02-15');
      const noPolicy = { enforced: false, waitingPeriodDays: 120 };
      expect(isInProbationPeriod(hireDate, currentDate, noPolicy)).toBe(false);
    });
  });

  describe('getRemainingProbationDays', () => {
    const hireDate = new Date('2024-01-01');
    const policy = { enforced: true, waitingPeriodDays: 120 };

    it('should calculate remaining days correctly', () => {
      const currentDate = new Date('2024-01-15');
      const remaining = getRemainingProbationDays(
        hireDate,
        currentDate,
        policy
      );
      expect(remaining).toBe(106); // 120 - 14 days
    });

    it('should return 0 after probation ends', () => {
      const currentDate = new Date('2024-06-01');
      const remaining = getRemainingProbationDays(
        hireDate,
        currentDate,
        policy
      );
      expect(remaining).toBe(0);
    });

    it('should return 0 when probation not enforced', () => {
      const currentDate = new Date('2024-01-15');
      const noPolicy = { enforced: false, waitingPeriodDays: 120 };
      expect(getRemainingProbationDays(hireDate, currentDate, noPolicy)).toBe(
        0
      );
    });
  });

  describe('getDefaultProbationPolicy', () => {
    it('should return policy with 120-day period', () => {
      const policy = getDefaultProbationPolicy(true);
      expect(policy.waitingPeriodDays).toBe(120);
      expect(policy.enforced).toBe(true);
    });

    it('should return unenforced policy by default', () => {
      const policy = getDefaultProbationPolicy();
      expect(policy.enforced).toBe(false);
    });
  });
});

describe('Regional Rules Engine', () => {
  describe('MICHIGAN_ESTA_RULES', () => {
    it('should have correct Michigan-specific values', () => {
      expect(MICHIGAN_ESTA_RULES.region).toBe('MI');
      expect(MICHIGAN_ESTA_RULES.probationMaxDays).toBe(120);
      expect(MICHIGAN_ESTA_RULES.accrualRateDenominator).toBe(30);
      expect(MICHIGAN_ESTA_RULES.smallEmployerThreshold).toBe(10);
      expect(MICHIGAN_ESTA_RULES.largeEmployerPaidHoursCap).toBe(72);
      expect(MICHIGAN_ESTA_RULES.smallEmployerPaidHoursCap).toBe(40);
    });
  });

  describe('getRegionalRules', () => {
    it('should return Michigan rules for MI region', () => {
      const rules = getRegionalRules('MI');
      expect(rules.region).toBe('MI');
    });

    it('should return Michigan rules for MI variants', () => {
      expect(getRegionalRules('MI_URBAN').region).toBe('MI');
      expect(getRegionalRules('MI_RURAL').region).toBe('MI');
    });
  });

  describe('validateProbationPolicy', () => {
    it('should accept valid policy', () => {
      const policy = { enforced: true, waitingPeriodDays: 90 };
      const result = validateProbationPolicy(policy, 'MI');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject policy exceeding max days', () => {
      const policy = { enforced: true, waitingPeriodDays: 150 };
      const result = validateProbationPolicy(policy, 'MI');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('150');
      expect(result.errors[0]).toContain('120');
    });

    it('should reject negative waiting period', () => {
      const policy = { enforced: true, waitingPeriodDays: -10 };
      const result = validateProbationPolicy(policy, 'MI');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Waiting period cannot be negative');
    });
  });

  describe('canUseSickTime', () => {
    const hireDate = new Date('2024-01-01');
    const enforcedPolicy = { enforced: true, waitingPeriodDays: 120 };
    const noPolicy = { enforced: false, waitingPeriodDays: 0 };

    it('should deny during probation period', () => {
      const result = canUseSickTime({
        hireDate,
        currentDate: new Date('2024-02-15'),
        probationPolicy: enforcedPolicy,
        availableBalance: 8,
        hoursRequested: 4,
        employerSize: 'large',
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('probationary period');
      expect(result.remainingProbationDays).toBeGreaterThan(0);
    });

    it('should allow after probation ends', () => {
      const result = canUseSickTime({
        hireDate,
        currentDate: new Date('2024-06-01'),
        probationPolicy: enforcedPolicy,
        availableBalance: 8,
        hoursRequested: 4,
        employerSize: 'large',
      });

      expect(result.allowed).toBe(true);
    });

    it('should allow when no probation enforced', () => {
      const result = canUseSickTime({
        hireDate,
        currentDate: new Date('2024-01-15'),
        probationPolicy: noPolicy,
        availableBalance: 8,
        hoursRequested: 4,
        employerSize: 'large',
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny when insufficient balance', () => {
      const result = canUseSickTime({
        hireDate,
        currentDate: new Date('2024-06-01'),
        probationPolicy: enforcedPolicy,
        availableBalance: 4,
        hoursRequested: 8,
        employerSize: 'large',
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds available balance');
    });

    it('should deny when exceeding max usage limit', () => {
      const result = canUseSickTime({
        hireDate,
        currentDate: new Date('2024-06-01'),
        probationPolicy: enforcedPolicy,
        availableBalance: 100,
        hoursRequested: 100,
        employerSize: 'large',
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('maximum usage limit');
    });
  });
});
