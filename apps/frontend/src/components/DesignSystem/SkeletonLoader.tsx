/**
 * SkeletonLoader Component
 * 
 * A reusable skeleton loading component that provides visual feedback
 * during data loading states across the ESTA Tracker application.
 * 
 * Features:
 * - Multiple variants (text, circle, rectangular, card)
 * - Customizable width and height
 * - Animated shimmer effect
 * - Count property for multiple skeleton items
 * - Responsive design
 * - Dark mode support
 * 
 * Uses:
 * - Tailwind CSS for styling and animations
 * - clsx for conditional class management
 * 
 * Best Practices:
 * - Use skeleton loaders to improve perceived performance
 * - Match skeleton shape to actual content
 * - Show skeleton during initial load and lazy loading
 */

import clsx from 'clsx';

export interface SkeletonLoaderProps {
  variant?: 'text' | 'circle' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export function SkeletonLoader({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-lg h-48',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        className,
        count > 1 && index < count - 1 ? 'mb-2' : ''
      )}
      style={style}
    />
  ));

  return <>{skeletons}</>;
}

/**
 * Pre-configured skeleton components for common use cases
 */

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={clsx(
            'animate-pulse bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2',
            index === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-lg shadow-md p-6', className)}>
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
