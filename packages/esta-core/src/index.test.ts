import { describe, it, expect } from 'vitest';
import {
  calculateAccruedHours,
  calculateCappedAccrual,
  calculateBalance,
  HOURS_TO_ACCRUE_PER_HOUR,
  MAX_ACCRUAL_SMALL_EMPLOYER,
  MAX_ACCRUAL_LARGE_EMPLOYER,
} from './index';

describe('calculateAccruedHours', () => {
  it('calculates accrual for 30 hours (should be 1 hour)', () => {
    expect(calculateAccruedHours(30)).toBeCloseTo(1, 6);
  });

  it('calculates accrual for 40 hours', () => {
    expect(calculateAccruedHours(40)).toBeCloseTo(1.333333, 6);
  });

  it('calculates accrual for 60 hours (should be 2 hours)', () => {
    expect(calculateAccruedHours(60)).toBeCloseTo(2, 6);
  });

  it('returns 0 for zero hours', () => {
    expect(calculateAccruedHours(0)).toBe(0);
  });

  it('throws on negative hours', () => {
    expect(() => calculateAccruedHours(-1)).toThrow(
      'hoursWorked must be a non-negative finite number'
    );
  });

  it('throws on NaN', () => {
    expect(() => calculateAccruedHours(NaN)).toThrow(
      'hoursWorked must be a non-negative finite number'
    );
  });

  it('throws on Infinity', () => {
    expect(() => calculateAccruedHours(Infinity)).toThrow(
      'hoursWorked must be a non-negative finite number'
    );
  });
});

describe('calculateCappedAccrual', () => {
  it('applies 40-hour cap for small employers (10 or fewer employees)', () => {
    // 1800 hours worked = 60 hours accrued, but capped at 40
    expect(calculateCappedAccrual(1800, 10)).toBe(40);
  });

  it('applies 72-hour cap for large employers (more than 10 employees)', () => {
    // 2700 hours worked = 90 hours accrued, but capped at 72
    expect(calculateCappedAccrual(2700, 11)).toBe(72);
  });

  it('does not cap when accrual is below the limit', () => {
    expect(calculateCappedAccrual(300, 10)).toBeCloseTo(10, 6);
  });

  it('throws on invalid employee count', () => {
    expect(() => calculateCappedAccrual(100, 0)).toThrow(
      'employeeCount must be a positive integer'
    );
  });

  it('throws on negative employee count', () => {
    expect(() => calculateCappedAccrual(100, -5)).toThrow(
      'employeeCount must be a positive integer'
    );
  });
});

describe('calculateBalance', () => {
  it('calculates correct balance', () => {
    expect(calculateBalance(20, 5)).toBe(15);
  });

  it('returns 0 when used exceeds accrued', () => {
    expect(calculateBalance(5, 10)).toBe(0);
  });

  it('returns full accrued when nothing used', () => {
    expect(calculateBalance(40, 0)).toBe(40);
  });

  it('throws on negative accrued', () => {
    expect(() => calculateBalance(-1, 0)).toThrow(
      'accrued must be a non-negative finite number'
    );
  });

  it('throws on negative used', () => {
    expect(() => calculateBalance(10, -1)).toThrow(
      'used must be a non-negative finite number'
    );
  });
});

describe('constants', () => {
  it('has correct accrual rate (1 per 30)', () => {
    expect(HOURS_TO_ACCRUE_PER_HOUR).toBeCloseTo(1 / 30, 10);
  });

  it('has correct small employer cap', () => {
    expect(MAX_ACCRUAL_SMALL_EMPLOYER).toBe(40);
  });

  it('has correct large employer cap', () => {
    expect(MAX_ACCRUAL_LARGE_EMPLOYER).toBe(72);
  });
});
