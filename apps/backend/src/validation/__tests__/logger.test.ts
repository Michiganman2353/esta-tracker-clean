/**
 * Unit tests for validation logger utilities.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeForLogging,
  createValidationLogEntry,
  logValidationFailure,
} from '../logger.js';

describe('Validation Logger Utilities', () => {
  describe('sanitizeForLogging', () => {
    it('should redact password field', () => {
      const input = { username: 'john', password: 'secret123' };
      const result = sanitizeForLogging(input);
      expect(result.username).toBe('john');
      expect(result.password).toBe('[REDACTED]');
    });

    it('should redact token field', () => {
      const input = { userId: '123', token: 'abc-token-xyz' };
      const result = sanitizeForLogging(input);
      expect(result.userId).toBe('123');
      expect(result.token).toBe('[REDACTED]');
    });

    it('should redact nested sensitive fields', () => {
      const input = {
        user: {
          name: 'John',
          password: 'secret',
        },
      };
      const result = sanitizeForLogging(input);
      expect((result.user as Record<string, unknown>).name).toBe('John');
      expect((result.user as Record<string, unknown>).password).toBe('[REDACTED]');
    });

    it('should not modify non-sensitive fields', () => {
      const input = { name: 'John', email: 'john@example.com', age: 25 };
      const result = sanitizeForLogging(input);
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.age).toBe(25);
    });

    it('should handle arrays', () => {
      const input = { items: ['a', 'b', 'c'] };
      const result = sanitizeForLogging(input);
      expect(result.items).toEqual(['a', 'b', 'c']);
    });

    it('should handle null values', () => {
      const input = { name: null };
      const result = sanitizeForLogging(input);
      expect(result.name).toBe(null);
    });

    it('should redact various sensitive field names', () => {
      const input = {
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
        accessToken: 'token1',
        refreshToken: 'token2',
        secret: 'mysecret',
        apiKey: 'key123',
        ssn: '123-45-6789',
        creditCard: '4111111111111111',
        cvv: '123',
      };
      const result = sanitizeForLogging(input);
      expect(result.currentPassword).toBe('[REDACTED]');
      expect(result.newPassword).toBe('[REDACTED]');
      expect(result.confirmPassword).toBe('[REDACTED]');
      expect(result.accessToken).toBe('[REDACTED]');
      expect(result.refreshToken).toBe('[REDACTED]');
      expect(result.secret).toBe('[REDACTED]');
      expect(result.apiKey).toBe('[REDACTED]');
      expect(result.ssn).toBe('[REDACTED]');
      expect(result.creditCard).toBe('[REDACTED]');
      expect(result.cvv).toBe('[REDACTED]');
    });
  });

  describe('createValidationLogEntry', () => {
    it('should create log entry with all fields', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'name', message: 'Name is required' },
      ];
      const rawInput = { email: 'invalid', password: 'secret' };

      const entry = createValidationLogEntry(
        '/api/v1/auth/register',
        'POST',
        errors,
        rawInput
      );

      expect(entry.route).toBe('/api/v1/auth/register');
      expect(entry.method).toBe('POST');
      expect(entry.errors).toEqual(errors);
      expect(entry.sanitizedInput?.email).toBe('invalid');
      expect(entry.sanitizedInput?.password).toBe('[REDACTED]');
      expect(entry.timestamp).toBeTruthy();
    });

    it('should work without raw input', () => {
      const errors = [{ field: 'id', message: 'ID is required' }];

      const entry = createValidationLogEntry(
        '/api/v1/users/123',
        'GET',
        errors
      );

      expect(entry.route).toBe('/api/v1/users/123');
      expect(entry.method).toBe('GET');
      expect(entry.errors).toEqual(errors);
      expect(entry.sanitizedInput).toBeUndefined();
    });

    it('should set timestamp automatically', () => {
      const entry = createValidationLogEntry('/test', 'POST', []);
      expect(entry.timestamp).toBeTruthy();
      // Check that it's a valid ISO date string
      const timestamp = new Date(entry.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('logValidationFailure', () => {
    it('should log validation failure to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const entry = createValidationLogEntry(
        '/api/v1/auth/register',
        'POST',
        [{ field: 'email', message: 'Invalid email' }],
        { email: 'bad-email' }
      );

      logValidationFailure(entry);

      expect(consoleSpy).toHaveBeenCalledOnce();
      const logOutput = consoleSpy.mock.calls[0][1];
      expect(logOutput).toContain('/api/v1/auth/register');
      expect(logOutput).toContain('POST');
      expect(logOutput).toContain('email');
      expect(logOutput).toContain('Invalid email');

      consoleSpy.mockRestore();
    });
  });
});
