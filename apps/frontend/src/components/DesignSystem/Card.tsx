/**
 * Card Component
 * 
 * A reusable card component that provides consistent container styling
 * across the ESTA Tracker application.
 * 
 * Features:
 * - Optional header with title and description
 * - Optional footer section
 * - Padding control (none, sm, md, lg)
 * - Hover effects
 * - Click handling with cursor pointer
 * - Responsive design
 * - Dark mode support
 * 
 * Uses:
 * - Tailwind CSS for styling
 * - clsx for conditional class management
 * - Supports custom className for additional styling
 */

import { ReactNode, HTMLAttributes } from 'react';
import clsx from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: ReactNode;
}

export function Card({
  title,
  description,
  footer,
  padding = 'md',
  hover = false,
  children,
  className,
  onClick,
  ...props
}: CardProps) {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-md';
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={clsx(
        baseClasses,
        paddingClasses[padding],
        hoverClasses,
        clickableClasses,
        className
      )}
      onClick={onClick}
      {...props}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div>{children}</div>
      
      {footer && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
}
