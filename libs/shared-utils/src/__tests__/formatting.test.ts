import { describe, it, expect } from 'vitest';
import {
  formatHours,
  formatFullName,
  formatCurrency,
  formatPercentage,
  formatFileSize,
  formatPhoneNumber,
  truncateText,
  formatInitials,
  formatEmployeeStatus,
  formatRequestStatus,
} from '../formatting';

describe('formatting utilities', () => {
  describe('formatHours', () => {
    it('should format hours with decimals by default', () => {
      expect(formatHours(8.5)).toBe('8.5 hours');
    });

    it('should format singular hour', () => {
      expect(formatHours(1)).toBe('1.0 hour');
    });

    it('should format hours without decimals when specified', () => {
      expect(formatHours(8.5, false)).toBe('9 hours');
    });

    it('should handle zero hours', () => {
      expect(formatHours(0)).toBe('0.0 hours');
    });
  });

  describe('formatFullName', () => {
    it('should format full name', () => {
      expect(formatFullName('John', 'Doe')).toBe('John Doe');
    });

    it('should handle single letter names', () => {
      expect(formatFullName('J', 'D')).toBe('J D');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in USD', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-50.25)).toContain('-$50.25');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage without decimals by default', () => {
      expect(formatPercentage(0.85)).toBe('85%');
    });

    it('should format percentage with decimals when specified', () => {
      expect(formatPercentage(0.8567, 2)).toBe('85.67%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0%');
    });

    it('should handle 1 (100%)', () => {
      expect(formatPercentage(1)).toBe('100%');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle zero', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format decimal sizes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit phone number', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    });

    it('should format 11-digit phone number with country code', () => {
      expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
    });

    it('should handle already formatted numbers', () => {
      const formatted = '(555) 123-4567';
      expect(formatPhoneNumber(formatted)).toBe(formatted);
    });

    it('should handle numbers with dashes and spaces', () => {
      expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
    });

    it('should return original if not valid format', () => {
      expect(formatPhoneNumber('123')).toBe('123');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      expect(truncateText(text, 20)).toBe('This is a very lo...');
    });

    it('should not truncate short text', () => {
      const text = 'Short';
      expect(truncateText(text, 20)).toBe('Short');
    });

    it('should handle exact length', () => {
      const text = 'Exactly twenty chars';
      expect(truncateText(text, 20)).toBe('Exactly twenty chars');
    });
  });

  describe('formatInitials', () => {
    it('should format initials from first and last name', () => {
      expect(formatInitials('John', 'Doe')).toBe('JD');
    });

    it('should uppercase initials', () => {
      expect(formatInitials('john', 'doe')).toBe('JD');
    });

    it('should handle single character names', () => {
      expect(formatInitials('J', 'D')).toBe('JD');
    });
  });

  describe('formatEmployeeStatus', () => {
    it('should capitalize status', () => {
      expect(formatEmployeeStatus('active')).toBe('Active');
    });

    it('should handle uppercase input', () => {
      expect(formatEmployeeStatus('ACTIVE')).toBe('Active');
    });

    it('should handle mixed case', () => {
      expect(formatEmployeeStatus('InAcTiVe')).toBe('Inactive');
    });
  });

  describe('formatRequestStatus', () => {
    it('should format pending status with emoji', () => {
      expect(formatRequestStatus('pending')).toBe('🕐 Pending');
    });

    it('should format approved status with emoji', () => {
      expect(formatRequestStatus('approved')).toBe('✅ Approved');
    });

    it('should format denied status with emoji', () => {
      expect(formatRequestStatus('denied')).toBe('❌ Denied');
    });

    it('should format cancelled status with emoji', () => {
      expect(formatRequestStatus('cancelled')).toBe('⚠️ Cancelled');
    });

    it('should return original for unknown status', () => {
      expect(formatRequestStatus('unknown')).toBe('unknown');
    });
  });
});
