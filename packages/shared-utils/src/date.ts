/**
 * Date and Time Utilities
 * 
 * Pure functions for date calculations and manipulation
 * All dates are treated as midnight local time unless specified
 */

import {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInCalendarYears,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  isWeekend,
  isBefore,
  isAfter,
  isSameDay,
  format,
  parse,
  parseISO,
} from 'date-fns';

/**
 * Calculate the number of calendar days between two dates (inclusive)
 */
export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  return differenceInDays(endDate, startDate) + 1;
}

/**
 * Calculate the number of hours between two dates
 */
export function calculateHoursBetween(startDate: Date, endDate: Date): number {
  return differenceInHours(endDate, startDate);
}

/**
 * Get the start of the current fiscal year
 * @param fiscalYearStartMonth - 1-12, defaults to 1 (January)
 */
export function getFiscalYearStart(
  date: Date = new Date(),
  fiscalYearStartMonth: number = 1
): Date {
  const year = date.getFullYear();
  const fiscalStart = new Date(year, fiscalYearStartMonth - 1, 1);
  
  if (isBefore(date, fiscalStart)) {
    return addYears(fiscalStart, -1);
  }
  
  return fiscalStart;
}

/**
 * Get the end of the current fiscal year
 */
export function getFiscalYearEnd(
  date: Date = new Date(),
  fiscalYearStartMonth: number = 1
): Date {
  const fiscalStart = getFiscalYearStart(date, fiscalYearStartMonth);
  return addYears(addDays(fiscalStart, -1), 1);
}

/**
 * Check if a date is within a range (inclusive)
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return !isBefore(date, startDate) && !isAfter(date, endDate);
}

/**
 * Get all dates between two dates (inclusive)
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = startDate;
  
  while (!isAfter(currentDate, endDate)) {
    dates.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

/**
 * Count business days between two dates (excluding weekends)
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  const allDays = getDateRange(startDate, endDate);
  return allDays.filter(date => !isWeekend(date)).length;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format date for display (MM/DD/YYYY)
 */
export function formatDateDisplay(date: Date): string {
  return format(date, 'MM/dd/yyyy');
}

/**
 * Format date with time (MM/DD/YYYY HH:mm)
 */
export function formatDateTime(date: Date): string {
  return format(date, 'MM/dd/yyyy HH:mm');
}

/**
 * Parse ISO date string (YYYY-MM-DD)
 */
export function parseDateISO(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Parse display date string (MM/DD/YYYY)
 */
export function parseDateDisplay(dateString: string): Date {
  return parse(dateString, 'MM/dd/yyyy', new Date());
}

/**
 * Calculate years of service for an employee
 */
export function calculateYearsOfService(hireDate: Date, asOfDate: Date = new Date()): number {
  return differenceInCalendarYears(asOfDate, hireDate);
}

/**
 * Check if today is within N days of a date
 */
export function isWithinDays(targetDate: Date, days: number, fromDate: Date = new Date()): boolean {
  const diffDays = Math.abs(differenceInDays(targetDate, fromDate));
  return diffDays <= days;
}

/**
 * Get the first day of the current month
 */
export function getMonthStart(date: Date = new Date()): Date {
  return startOfMonth(date);
}

/**
 * Get the last day of the current month
 */
export function getMonthEnd(date: Date = new Date()): Date {
  return endOfMonth(date);
}

/**
 * Get the first day of the current year
 */
export function getYearStart(date: Date = new Date()): Date {
  return startOfYear(date);
}

/**
 * Get the last day of the current year
 */
export function getYearEnd(date: Date = new Date()): Date {
  return endOfYear(date);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return isBefore(date, new Date());
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date): boolean {
  return isAfter(date, new Date());
}

// Re-export useful date-fns functions
export {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  differenceInHours,
  isWeekend,
  isBefore,
  isAfter,
  isSameDay,
};
