/**
 * Constant-Time Operations Tests
 *
 * Tests for timing-safe cryptographic operations.
 */

import { describe, it, expect } from 'vitest';
import {
  constantTimeEqual,
  constantTimeStringEqual,
  constantTimeSelect,
  constantTimeSelectBuffer,
  constantTimeIsZero,
  constantTimeCopyIf,
  hardenedRandomBytes,
  constantTimeLexCompare,
  constantTimeAnd,
  constantTimeOr,
  constantTimeXor,
  secureZero,
  constantTimeMod,
  validateConstantTimeOps,
} from '../constantTimeOps';

describe('Constant-Time Operations Service', () => {
  describe('constantTimeEqual', () => {
    it('should return true for equal buffers', () => {
      const a = Buffer.from([1, 2, 3, 4]);
      const b = Buffer.from([1, 2, 3, 4]);
      expect(constantTimeEqual(a, b)).toBe(true);
    });

    it('should return false for different buffers', () => {
      const a = Buffer.from([1, 2, 3, 4]);
      const b = Buffer.from([1, 2, 3, 5]);
      expect(constantTimeEqual(a, b)).toBe(false);
    });

    it('should return false for different lengths', () => {
      const a = Buffer.from([1, 2, 3]);
      const b = Buffer.from([1, 2, 3, 4]);
      expect(constantTimeEqual(a, b)).toBe(false);
    });

    it('should handle empty buffers', () => {
      const a = Buffer.alloc(0);
      const b = Buffer.alloc(0);
      expect(constantTimeEqual(a, b)).toBe(true);
    });
  });

  describe('constantTimeStringEqual', () => {
    it('should return true for equal strings', () => {
      expect(constantTimeStringEqual('hello', 'hello')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(constantTimeStringEqual('hello', 'world')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(constantTimeStringEqual('Hello', 'hello')).toBe(false);
    });

    it('should handle unicode', () => {
      expect(constantTimeStringEqual('你好', '你好')).toBe(true);
      expect(constantTimeStringEqual('你好', '再见')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(constantTimeStringEqual('', '')).toBe(true);
    });
  });

  describe('constantTimeSelect', () => {
    it('should return trueValue when condition is true', () => {
      expect(constantTimeSelect(true, 'yes', 'no')).toBe('yes');
    });

    it('should return falseValue when condition is false', () => {
      expect(constantTimeSelect(false, 'yes', 'no')).toBe('no');
    });

    it('should work with numbers', () => {
      expect(constantTimeSelect(true, 1, 2)).toBe(1);
      expect(constantTimeSelect(false, 1, 2)).toBe(2);
    });

    it('should work with objects', () => {
      const obj1 = { value: 1 };
      const obj2 = { value: 2 };
      expect(constantTimeSelect(true, obj1, obj2)).toBe(obj1);
      expect(constantTimeSelect(false, obj1, obj2)).toBe(obj2);
    });
  });

  describe('constantTimeSelectBuffer', () => {
    it('should return trueBuffer when condition is true', () => {
      const a = Buffer.from([1, 2, 3]);
      const b = Buffer.from([4, 5, 6]);
      const result = constantTimeSelectBuffer(true, a, b);
      expect(constantTimeEqual(result, a)).toBe(true);
    });

    it('should return falseBuffer when condition is false', () => {
      const a = Buffer.from([1, 2, 3]);
      const b = Buffer.from([4, 5, 6]);
      const result = constantTimeSelectBuffer(false, a, b);
      expect(constantTimeEqual(result, b)).toBe(true);
    });

    it('should handle different length buffers', () => {
      const a = Buffer.from([1, 2]);
      const b = Buffer.from([3, 4, 5]);
      const result = constantTimeSelectBuffer(true, a, b);
      expect(result.length).toBe(3); // Max length
    });
  });

  describe('constantTimeIsZero', () => {
    it('should return true for all-zero buffer', () => {
      expect(constantTimeIsZero(Buffer.alloc(10))).toBe(true);
    });

    it('should return false for non-zero buffer', () => {
      expect(constantTimeIsZero(Buffer.from([0, 0, 1, 0]))).toBe(false);
    });

    it('should return true for empty buffer', () => {
      expect(constantTimeIsZero(Buffer.alloc(0))).toBe(true);
    });
  });

  describe('constantTimeCopyIf', () => {
    it('should copy when condition is true', () => {
      const source = Buffer.from([1, 2, 3]);
      const dest = Buffer.from([0, 0, 0]);
      constantTimeCopyIf(true, source, dest);
      expect(constantTimeEqual(dest, source)).toBe(true);
    });

    it('should not copy when condition is false', () => {
      const source = Buffer.from([1, 2, 3]);
      const dest = Buffer.from([0, 0, 0]);
      const original = Buffer.from(dest);
      constantTimeCopyIf(false, source, dest);
      expect(constantTimeEqual(dest, original)).toBe(true);
    });
  });

  describe('hardenedRandomBytes', () => {
    it('should generate bytes of requested length', () => {
      const bytes = hardenedRandomBytes(16);
      expect(bytes.length).toBe(16);
    });

    it('should generate unique values', () => {
      const bytes1 = hardenedRandomBytes(32);
      const bytes2 = hardenedRandomBytes(32);
      expect(constantTimeEqual(bytes1, bytes2)).toBe(false);
    });

    it('should cap at 32 bytes (SHA-256 output)', () => {
      const bytes = hardenedRandomBytes(64);
      expect(bytes.length).toBe(32);
    });
  });

  describe('constantTimeLexCompare', () => {
    it('should return 0 for equal buffers', () => {
      const a = Buffer.from([1, 2, 3]);
      const b = Buffer.from([1, 2, 3]);
      expect(constantTimeLexCompare(a, b)).toBe(0);
    });

    it('should return -1 when a < b', () => {
      const a = Buffer.from([1, 2, 2]);
      const b = Buffer.from([1, 2, 3]);
      expect(constantTimeLexCompare(a, b)).toBe(-1);
    });

    it('should return 1 when a > b', () => {
      const a = Buffer.from([1, 2, 4]);
      const b = Buffer.from([1, 2, 3]);
      expect(constantTimeLexCompare(a, b)).toBe(1);
    });

    it('should handle different lengths', () => {
      const a = Buffer.from([1, 2]);
      const b = Buffer.from([1, 2, 3]);
      expect(constantTimeLexCompare(a, b)).toBe(-1);
    });
  });

  describe('constantTimeAnd', () => {
    it('should perform bitwise AND', () => {
      const a = Buffer.from([0xff, 0x0f]);
      const b = Buffer.from([0xf0, 0xff]);
      const result = constantTimeAnd(a, b);
      expect(result).toEqual(Buffer.from([0xf0, 0x0f]));
    });
  });

  describe('constantTimeOr', () => {
    it('should perform bitwise OR', () => {
      const a = Buffer.from([0xf0, 0x00]);
      const b = Buffer.from([0x0f, 0xff]);
      const result = constantTimeOr(a, b);
      expect(result).toEqual(Buffer.from([0xff, 0xff]));
    });
  });

  describe('constantTimeXor', () => {
    it('should perform bitwise XOR', () => {
      const a = Buffer.from([0xff, 0x00]);
      const b = Buffer.from([0xf0, 0xf0]);
      const result = constantTimeXor(a, b);
      expect(result).toEqual(Buffer.from([0x0f, 0xf0]));
    });

    it('should be self-inverse', () => {
      const a = Buffer.from([1, 2, 3, 4]);
      const xored = constantTimeXor(a, a);
      expect(constantTimeIsZero(xored)).toBe(true);
    });
  });

  describe('secureZero', () => {
    it('should zero all bytes', () => {
      const buffer = Buffer.from([1, 2, 3, 4, 5]);
      secureZero(buffer);
      expect(constantTimeIsZero(buffer)).toBe(true);
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0);
      expect(() => secureZero(buffer)).not.toThrow();
    });
  });

  describe('constantTimeMod', () => {
    it('should compute modulo correctly', () => {
      expect(constantTimeMod(10, 3)).toBe(1);
      expect(constantTimeMod(15, 5)).toBe(0);
      expect(constantTimeMod(7, 10)).toBe(7);
    });

    it('should handle edge cases', () => {
      expect(constantTimeMod(0, 5)).toBe(0);
      expect(constantTimeMod(1, 1)).toBe(0);
    });
  });

  describe('validateConstantTimeOps', () => {
    it('should pass all self-tests', () => {
      expect(validateConstantTimeOps()).toBe(true);
    });
  });
});
