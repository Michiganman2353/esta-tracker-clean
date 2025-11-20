/**
 * Chart helper utilities for data visualization
 */

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: Date | string;
  value: number;
}

/**
 * Format data for pie/donut charts
 */
export function formatPieChartData(
  data: ChartDataPoint[]
): { labels: string[]; values: number[]; colors: string[] } {
  return {
    labels: data.map(d => d.label),
    values: data.map(d => d.value),
    colors: data.map(d => d.color || getDefaultColor(data.indexOf(d))),
  };
}

/**
 * Format data for time series charts
 */
export function formatTimeSeriesData(
  data: TimeSeriesDataPoint[]
): { labels: string[]; values: number[] } {
  return {
    labels: data.map(d => formatDate(d.date)),
    values: data.map(d => d.value),
  };
}

/**
 * Calculate percentage for display
 */
export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${Math.round(percentage)}%`;
}

/**
 * Get default color from palette
 */
function getDefaultColor(index: number): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
  ];
  return colors[index % colors.length];
}

/**
 * Format date for chart labels
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Generate aggregated monthly data from daily data
 */
export function aggregateByMonth(
  data: TimeSeriesDataPoint[]
): TimeSeriesDataPoint[] {
  const monthlyMap = new Map<string, number>();

  data.forEach(point => {
    const date = typeof point.date === 'string' ? new Date(point.date) : point.date;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + point.value);
  });

  return Array.from(monthlyMap.entries()).map(([monthKey, value]) => ({
    date: new Date(monthKey + '-01'),
    value,
  }));
}

/**
 * Calculate moving average for smoothing data
 */
export function calculateMovingAverage(
  data: number[],
  window: number = 7
): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowData = data.slice(start, i + 1);
    const average = windowData.reduce((sum, val) => sum + val, 0) / windowData.length;
    result.push(Math.round(average * 100) / 100);
  }
  
  return result;
}

/**
 * Find min and max values in dataset
 */
export function getDataRange(data: number[]): { min: number; max: number } {
  if (data.length === 0) return { min: 0, max: 0 };
  
  return {
    min: Math.min(...data),
    max: Math.max(...data),
  };
}
