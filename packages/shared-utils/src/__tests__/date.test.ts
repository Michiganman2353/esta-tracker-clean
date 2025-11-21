import { describe, it, expect } from 'vitest';
import {
  calculateDaysBetween,
  calculateHoursBetween,
  getFiscalYearStart,
  getFiscalYearEnd,
  isDateInRange,
  getDateRange,
  countBusinessDays,
  formatDateISO,
  formatDateDisplay,
  formatDateTime,
  parseDateISO,
  parseDateDisplay,
  calculateYearsOfService,
  isWithinDays,
  getMonthStart,
  getMonthEnd,
  getYearStart,
  getYearEnd,
  isToday,
  isPast,
  isFuture,
} from '../date';

describe('date utilities', () => {
  describe('calculateDaysBetween', () => {
    it('should calculate days between two dates inclusively', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-05');
      expect(calculateDaysBetween(start, end)).toBe(5);
    });

    it('should return 1 for same day', () => {
      const date = new Date('2024-01-01');
      expect(calculateDaysBetween(date, date)).toBe(1);
    });

    it('should handle dates across months', () => {
      const start = new Date('2024-01-31');
      const end = new Date('2024-02-02');
      expect(calculateDaysBetween(start, end)).toBe(3);
    });
  });

  describe('calculateHoursBetween', () => {
    it('should calculate hours between two dates', () => {
      const start = new Date('2024-01-01T08:00:00');
      const end = new Date('2024-01-01T16:00:00');
      expect(calculateHoursBetween(start, end)).toBe(8);
    });

    it('should handle hours across days', () => {
      const start = new Date('2024-01-01T20:00:00');
      const end = new Date('2024-01-02T04:00:00');
      expect(calculateHoursBetween(start, end)).toBe(8);
    });
  });

  describe('getFiscalYearStart', () => {
    it('should get fiscal year start for January-based fiscal year', () => {
      const date = new Date('2024-06-15');
      const fiscalStart = getFiscalYearStart(date, 1);
      expect(fiscalStart.getFullYear()).toBe(2024);
      expect(fiscalStart.getMonth()).toBe(0); // January
      expect(fiscalStart.getDate()).toBe(1);
    });

    it('should get fiscal year start for July-based fiscal year', () => {
      const date = new Date('2024-09-15');
      const fiscalStart = getFiscalYearStart(date, 7);
      expect(fiscalStart.getFullYear()).toBe(2024);
      expect(fiscalStart.getMonth()).toBe(6); // July
    });

    it('should get previous fiscal year if date is before fiscal start', () => {
      const date = new Date('2024-03-15');
      const fiscalStart = getFiscalYearStart(date, 7);
      expect(fiscalStart.getFullYear()).toBe(2023);
      expect(fiscalStart.getMonth()).toBe(6); // July
    });
  });

  describe('getFiscalYearEnd', () => {
    it('should get fiscal year end', () => {
      const date = new Date('2024-06-15');
      const fiscalEnd = getFiscalYearEnd(date, 1);
      expect(fiscalEnd.getFullYear()).toBe(2024);
      expect(fiscalEnd.getMonth()).toBe(11); // December
      expect(fiscalEnd.getDate()).toBe(31);
    });
  });

  describe('isDateInRange', () => {
    it('should return true for date within range', () => {
      const date = new Date('2024-06-15');
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    it('should return true for date at start boundary', () => {
      const date = new Date('2024-01-01');
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    it('should return true for date at end boundary', () => {
      const date = new Date('2024-12-31');
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    it('should return false for date before range', () => {
      const date = new Date('2023-12-31');
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(false);
    });

    it('should return false for date after range', () => {
      const date = new Date('2025-01-01');
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(false);
    });
  });

  describe('getDateRange', () => {
    it('should generate array of dates between two dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-03');
      const range = getDateRange(start, end);
      expect(range).toHaveLength(3);
      expect(range[0].getDate()).toBe(1);
      expect(range[2].getDate()).toBe(3);
    });

    it('should include single date when start equals end', () => {
      const date = new Date('2024-01-01');
      const range = getDateRange(date, date);
      expect(range).toHaveLength(1);
    });
  });

  describe('countBusinessDays', () => {
    it('should count only weekdays', () => {
      // Jan 1, 2024 is Monday, Jan 5, 2024 is Friday
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-05');
      expect(countBusinessDays(start, end)).toBe(5);
    });

    it('should exclude weekends', () => {
      // Jan 1, 2024 (Mon) to Jan 7, 2024 (Sun) = 5 weekdays
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-07');
      expect(countBusinessDays(start, end)).toBe(5);
    });
  });

  describe('formatDateISO', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-03-15');
      expect(formatDateISO(date)).toBe('2024-03-15');
    });
  });

  describe('formatDateDisplay', () => {
    it('should format date as MM/DD/YYYY', () => {
      const date = new Date('2024-03-15');
      expect(formatDateDisplay(date)).toBe('03/15/2024');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2024-03-15T14:30:00');
      expect(formatDateTime(date)).toMatch(/03\/15\/2024 \d{2}:\d{2}/);
    });
  });

  describe('parseDateISO', () => {
    it('should parse ISO date string', () => {
      const date = parseDateISO('2024-03-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(2); // March (0-indexed)
      expect(date.getDate()).toBe(15);
    });
  });

  describe('parseDateDisplay', () => {
    it('should parse display date string', () => {
      const date = parseDateDisplay('03/15/2024');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(2); // March
      expect(date.getDate()).toBe(15);
    });
  });

  describe('calculateYearsOfService', () => {
    it('should calculate full years of service', () => {
      const hireDate = new Date('2020-01-01');
      const asOfDate = new Date('2024-01-01');
      expect(calculateYearsOfService(hireDate, asOfDate)).toBe(4);
    });

    it('should calculate calendar years between dates', () => {
      const hireDate = new Date('2020-06-15');
      const asOfDate = new Date('2024-03-15');
      // calculateYearsOfService uses differenceInCalendarYears from date-fns
      // which returns 4 for dates spanning 2020, 2021, 2022, 2023, 2024
      expect(calculateYearsOfService(hireDate, asOfDate)).toBe(4);
    });
  });

  describe('isWithinDays', () => {
    it('should return true if date is within specified days', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isWithinDays(tomorrow, 5, today)).toBe(true);
    });

    it('should return false if date is beyond specified days', () => {
      const today = new Date();
      const future = new Date(today);
      future.setDate(future.getDate() + 10);
      expect(isWithinDays(future, 5, today)).toBe(false);
    });
  });

  describe('getMonthStart', () => {
    it('should get first day of month', () => {
      const date = new Date('2024-06-15');
      const start = getMonthStart(date);
      expect(start.getDate()).toBe(1);
      expect(start.getMonth()).toBe(5); // June
    });
  });

  describe('getMonthEnd', () => {
    it('should get last day of month', () => {
      const date = new Date('2024-02-15');
      const end = getMonthEnd(date);
      expect(end.getDate()).toBe(29); // 2024 is leap year
      expect(end.getMonth()).toBe(1); // February
    });
  });

  describe('getYearStart', () => {
    it('should get first day of year', () => {
      const date = new Date('2024-06-15');
      const start = getYearStart(date);
      expect(start.getMonth()).toBe(0); // January
      expect(start.getDate()).toBe(1);
    });
  });

  describe('getYearEnd', () => {
    it('should get last day of year', () => {
      const date = new Date('2024-06-15');
      const end = getYearEnd(date);
      expect(end.getMonth()).toBe(11); // December
      expect(end.getDate()).toBe(31);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('isPast', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01');
      expect(isPast(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isPast(futureDate)).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('should return true for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isFuture(futureDate)).toBe(true);
    });

    it('should return false for past date', () => {
      const pastDate = new Date('2020-01-01');
      expect(isFuture(pastDate)).toBe(false);
    });
  });
});
