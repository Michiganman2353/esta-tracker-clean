/**
 * Chart Helper Utilities
 * 
 * Provides utility functions for preparing and formatting data
 * for charts and visualizations in the ESTA Tracker application.
 * 
 * Features:
 * - Data aggregation by time period (daily, weekly, monthly)
 * - Color scheme generation for charts
 * - Data formatting for common chart types
 * - Trend calculation utilities
 * - Responsive chart configuration helpers
 * 
 * Uses:
 * - Date-fns for date manipulation (if available)
 * - Pure functions for testability
 * 
 * Best Practices:
 * - Keep chart data structures consistent
 * - Use semantic color schemes
 * - Handle edge cases (empty data, single data point)
 */

import { format, parseISO, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Aggregate data by time period
 * @param data - Array of time series data points
 * @param period - Aggregation period ('daily', 'weekly', 'monthly', 'yearly')
 * @returns Aggregated data points
 */
export function aggregateByTimePeriod(
  data: TimeSeriesDataPoint[],
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
): ChartDataPoint[] {
  const grouped = new Map<string, number>();

  data.forEach((point) => {
    const date = parseISO(point.date);
    let key: string;

    switch (period) {
      case 'daily':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'weekly':
        key = format(startOfWeek(date), 'yyyy-MM-dd');
        break;
      case 'monthly':
        key = format(startOfMonth(date), 'yyyy-MM');
        break;
      case 'yearly':
        key = format(startOfYear(date), 'yyyy');
        break;
    }

    grouped.set(key, (grouped.get(key) || 0) + point.value);
  });

  return Array.from(grouped.entries()).map(([label, value]) => ({
    label,
    value,
    date: label,
  }));
}

/**
 * Generate color palette for charts
 * @param count - Number of colors needed
 * @param theme - Color theme ('primary', 'secondary', 'status')
 * @returns Array of color hex codes
 */
export function generateColorPalette(
  count: number,
  theme: 'primary' | 'secondary' | 'status' = 'primary'
): string[] {
  const palettes = {
    primary: [
      '#3B82F6', // blue-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#F59E0B', // amber-500
      '#10B981', // emerald-500
      '#06B6D4', // cyan-500
    ],
    secondary: [
      '#6B7280', // gray-500
      '#9CA3AF', // gray-400
      '#D1D5DB', // gray-300
      '#E5E7EB', // gray-200
      '#F3F4F6', // gray-100
    ],
    status: [
      '#10B981', // green - success
      '#F59E0B', // amber - warning
      '#EF4444', // red - danger
      '#3B82F6', // blue - info
      '#8B5CF6', // violet - pending
    ],
  };

  const palette = palettes[theme];
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    const color = palette[i % palette.length];
    if (color) {
      colors.push(color);
    }
  }

  return colors;
}

/**
 * Format data for pie/donut charts
 * @param data - Array of data points
 * @param labelKey - Key to use for labels
 * @param valueKey - Key to use for values
 * @returns Formatted chart data with percentages
 */
export function formatPieChartData(
  data: Record<string, unknown>[],
  labelKey: string,
  valueKey: string
): ChartDataPoint[] {
  const total = data.reduce((sum, item) => sum + (item[valueKey] as number), 0);

  return data.map((item, index) => {
    const value = item[valueKey] as number;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    return {
      label: `${item[labelKey]} (${percentage.toFixed(1)}%)`,
      value,
      color: generateColorPalette(data.length, 'primary')[index],
    };
  });
}

/**
 * Calculate simple moving average
 * @param data - Array of numerical values
 * @param windowSize - Size of the moving average window
 * @returns Array of moving average values
 */
export function calculateMovingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const currentValue = data[i];
    if (currentValue === undefined) continue;
    
    if (i < windowSize - 1) {
      result.push(currentValue); // Not enough data for average yet
    } else {
      const window = data.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, val) => sum + (val ?? 0), 0) / windowSize;
      result.push(average);
    }
  }

  return result;
}

/**
 * Calculate percentage change between two values
 * @param currentValue - Current value
 * @param previousValue - Previous value
 * @returns Percentage change
 */
export function calculatePercentageChange(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Format chart labels for display
 * @param date - Date string or Date object
 * @param period - Display period format
 * @returns Formatted label string
 */
export function formatChartLabel(
  date: string | Date,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  switch (period) {
    case 'daily':
      return format(dateObj, 'MMM d');
    case 'weekly':
      return format(dateObj, 'MMM d, yyyy');
    case 'monthly':
      return format(dateObj, 'MMM yyyy');
    case 'yearly':
      return format(dateObj, 'yyyy');
    default:
      return format(dateObj, 'MMM d, yyyy');
  }
}

/**
 * Get responsive chart dimensions based on container
 * @param containerWidth - Width of container element
 * @param aspectRatio - Desired aspect ratio (width/height)
 * @returns Object with width and height
 */
export function getResponsiveChartDimensions(
  containerWidth: number,
  aspectRatio: number = 16 / 9
): { width: number; height: number } {
  return {
    width: containerWidth,
    height: containerWidth / aspectRatio,
  };
}

/**
 * Prepare time series data for line charts
 * @param data - Raw time series data
 * @param fillMissingDates - Whether to fill in missing dates with zero values
 * @returns Formatted and sorted time series data
 */
export function prepareTimeSeriesData(
  data: TimeSeriesDataPoint[],
  fillMissingDates: boolean = false
): TimeSeriesDataPoint[] {
  // Sort by date
  const sorted = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (!fillMissingDates || sorted.length < 2) {
    return sorted;
  }

  // Fill missing dates (implementation would depend on date range requirements)
  return sorted;
}
