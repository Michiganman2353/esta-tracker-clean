import { describe, it, expect } from 'vitest';
import {
  calculateCarryover,
  getCarryoverCap,
  isCarryoverCapped,
  calculateForfeitedHours,
} from '../carryover';

describe('carryover logic', () => {
  describe('calculateCarryover', () => {
    it('should allow full carryover when under cap for small employer', () => {
      expect(calculateCarryover(30, 'small')).toBe(30);
    });

    it('should cap carryover at 40 for small employer', () => {
      expect(calculateCarryover(50, 'small')).toBe(40);
    });

    it('should allow full carryover when under cap for large employer', () => {
      expect(calculateCarryover(60, 'large')).toBe(60);
    });

    it('should cap carryover at 72 for large employer', () => {
      expect(calculateCarryover(80, 'large')).toBe(72);
    });

    it('should handle zero balance', () => {
      expect(calculateCarryover(0, 'small')).toBe(0);
      expect(calculateCarryover(0, 'large')).toBe(0);
    });

    it('should handle exact cap amount', () => {
      expect(calculateCarryover(40, 'small')).toBe(40);
      expect(calculateCarryover(72, 'large')).toBe(72);
    });
  });

  describe('getCarryoverCap', () => {
    it('should return 40 for small employers', () => {
      expect(getCarryoverCap('small')).toBe(40);
    });

    it('should return 72 for large employers', () => {
      expect(getCarryoverCap('large')).toBe(72);
    });
  });

  describe('isCarryoverCapped', () => {
    it('should return false when under cap for small employer', () => {
      expect(isCarryoverCapped(30, 'small')).toBe(false);
    });

    it('should return false when at exact cap for small employer', () => {
      expect(isCarryoverCapped(40, 'small')).toBe(false);
    });

    it('should return true when over cap for small employer', () => {
      expect(isCarryoverCapped(45, 'small')).toBe(true);
    });

    it('should return false when under cap for large employer', () => {
      expect(isCarryoverCapped(60, 'large')).toBe(false);
    });

    it('should return false when at exact cap for large employer', () => {
      expect(isCarryoverCapped(72, 'large')).toBe(false);
    });

    it('should return true when over cap for large employer', () => {
      expect(isCarryoverCapped(80, 'large')).toBe(true);
    });

    it('should handle zero balance', () => {
      expect(isCarryoverCapped(0, 'small')).toBe(false);
    });
  });

  describe('calculateForfeitedHours', () => {
    it('should return 0 when under cap for small employer', () => {
      expect(calculateForfeitedHours(30, 'small')).toBe(0);
    });

    it('should return 0 when at exact cap', () => {
      expect(calculateForfeitedHours(40, 'small')).toBe(0);
      expect(calculateForfeitedHours(72, 'large')).toBe(0);
    });

    it('should calculate forfeited hours for small employer', () => {
      expect(calculateForfeitedHours(50, 'small')).toBe(10);
    });

    it('should calculate forfeited hours for large employer', () => {
      expect(calculateForfeitedHours(80, 'large')).toBe(8);
    });

    it('should handle large forfeitures', () => {
      expect(calculateForfeitedHours(100, 'large')).toBe(28);
    });

    it('should return 0 for zero balance', () => {
      expect(calculateForfeitedHours(0, 'small')).toBe(0);
    });
  });
});
