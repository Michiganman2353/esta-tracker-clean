import { describe, it, expect } from 'vitest';

/**
 * Example unit tests demonstrating testing best practices
 * These tests show how to structure tests in the ESTA Tracker application
 */

describe('Example Unit Tests', () => {
  describe('Math operations', () => {
    it('should add two numbers correctly', () => {
      const result = 2 + 2;
      expect(result).toBe(4);
    });

    it('should handle negative numbers', () => {
      const result = -5 + 3;
      expect(result).toBe(-2);
    });

    it('should handle decimal numbers', () => {
      const result = 0.1 + 0.2;
      expect(result).toBeCloseTo(0.3, 1);
    });
  });

  describe('Array operations', () => {
    it('should filter even numbers', () => {
      const numbers = [1, 2, 3, 4, 5, 6];
      const evens = numbers.filter(n => n % 2 === 0);
      expect(evens).toEqual([2, 4, 6]);
    });

    it('should map array values', () => {
      const numbers = [1, 2, 3];
      const doubled = numbers.map(n => n * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });

    it('should check array contains value', () => {
      const fruits = ['apple', 'banana', 'orange'];
      expect(fruits).toContain('banana');
      expect(fruits).not.toContain('grape');
    });
  });

  describe('Object operations', () => {
    it('should create object with expected properties', () => {
      const user = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email', 'john@example.com');
      expect(user.name).toBe('John Doe');
    });

    it('should compare objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };

      expect(obj1).toEqual(obj2); // Deep equality
      expect(obj1).not.toBe(obj2); // Reference equality
    });
  });

  describe('Async operations', () => {
    it('should handle promises', async () => {
      const promise = Promise.resolve('success');
      const result = await promise;
      expect(result).toBe('success');
    });

    it('should handle async functions', async () => {
      const fetchData = async () => {
        return { data: 'test' };
      };

      const result = await fetchData();
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle rejected promises', async () => {
      const promise = Promise.reject(new Error('Failed'));
      await expect(promise).rejects.toThrow('Failed');
    });
  });

  describe('Error handling', () => {
    it('should throw error', () => {
      const throwError = () => {
        throw new Error('Something went wrong');
      };

      expect(throwError).toThrow();
      expect(throwError).toThrow('Something went wrong');
    });

    it('should handle null and undefined', () => {
      const value = null;
      expect(value).toBeNull();
      expect(value).not.toBeUndefined();

      const undefinedValue = undefined;
      expect(undefinedValue).toBeUndefined();
      expect(undefinedValue).not.toBeNull();
    });
  });

  describe('Boolean checks', () => {
    it('should check truthy and falsy values', () => {
      expect(true).toBeTruthy();
      expect(1).toBeTruthy();
      expect('hello').toBeTruthy();

      expect(false).toBeFalsy();
      expect(0).toBeFalsy();
      expect('').toBeFalsy();
      expect(null).toBeFalsy();
      expect(undefined).toBeFalsy();
    });
  });

  describe('String operations', () => {
    it('should match strings', () => {
      const message = 'Hello, World!';
      expect(message).toContain('World');
      expect(message).toMatch(/Hello/);
      expect(message).toHaveLength(13);
    });

    it('should handle case sensitivity', () => {
      const str = 'HELLO';
      expect(str.toLowerCase()).toBe('hello');
      expect(str).not.toBe('hello');
    });
  });
});
