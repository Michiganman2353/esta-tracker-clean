/**
 * Responsive Card Component with Container Queries
 * 
 * Demonstrates advanced responsive design using CSS container queries.
 * Container queries allow components to adapt based on their parent container
 * size rather than viewport size, enabling truly modular responsive design.
 * 
 * Features:
 * - Container query-based responsive layout
 * - Optimized with React.memo for performance
 * - Uses Zustand for global notifications
 * - Demonstrates functional component best practices
 */

import { memo, ReactNode } from 'react';

interface ResponsiveCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * Responsive Card Component
 * 
 * Uses container queries (@container) to adapt layout based on parent size.
 * This is more flexible than media queries for modular components.
 * 
 * Container query breakpoints:
 * - < 320px: Ultra-compact (icon-only mode)
 * - 320px - 480px: Compact (minimal text)
 * - 480px - 768px: Standard (normal layout)
 * - > 768px: Detailed (expanded layout with extra info)
 */
export const ResponsiveCard = memo<ResponsiveCardProps>(({
  title,
  description,
  children,
  className = '',
  variant = 'default',
  onAction,
  actionLabel = 'Action',
}) => {
  const baseClasses = 'rounded-lg border shadow-sm transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white border-gray-200 hover:shadow-md',
    compact: 'bg-gray-50 border-gray-300',
    detailed: 'bg-gradient-to-br from-white to-gray-50 border-gray-200',
  };

  return (
    <div className={`@container ${className}`}>
      <div className={`${baseClasses} ${variantClasses[variant]}`}>
        {/* Header - adapts based on container size */}
        <div className="p-4 @sm:p-6 @lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title - responsive typography */}
              <h3 className="font-semibold text-base @sm:text-lg @lg:text-xl text-gray-900 truncate @md:whitespace-normal">
                {title}
              </h3>
              
              {/* Description - hidden on ultra-small, shown on larger */}
              {description && (
                <p className="mt-1 text-sm @sm:text-base text-gray-600 hidden @xs:line-clamp-2 @md:line-clamp-none">
                  {description}
                </p>
              )}
            </div>

            {/* Action button - adapts size and text visibility */}
            {onAction && (
              <button
                onClick={onAction}
                className="shrink-0 px-3 py-1.5 @sm:px-4 @sm:py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm @sm:text-base font-medium transition-colors"
                aria-label={actionLabel}
              >
                {/* Icon visible on all sizes, text hidden on ultra-small */}
                <span className="hidden @xs:inline">{actionLabel}</span>
                <span className="@xs:hidden">⚡</span>
              </button>
            )}
          </div>
        </div>

        {/* Content - responsive padding and layout */}
        {children && (
          <div className="px-4 pb-4 @sm:px-6 @sm:pb-6 @lg:px-8 @lg:pb-8">
            <div className="space-y-3 @md:space-y-4">
              {children}
            </div>
          </div>
        )}

        {/* Footer - only shown on larger containers */}
        {variant === 'detailed' && (
          <div className="hidden @md:block border-t border-gray-200 px-4 py-3 @lg:px-6 @lg:py-4 bg-gray-50">
            <div className="flex items-center gap-2 text-xs @lg:text-sm text-gray-500">
              <span>🔄</span>
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ResponsiveCard.displayName = 'ResponsiveCard';

/**
 * Responsive Grid Layout
 * 
 * Grid container that uses container queries to adapt column count.
 * More flexible than CSS Grid with media queries.
 */
interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  minColumnWidth?: string;
}

export const ResponsiveGrid = memo<ResponsiveGridProps>(({
  children,
  className = '',
  minColumnWidth = '280px',
}) => {
  return (
    <div className={`@container ${className}`}>
      <div 
        className="grid gap-4 @sm:gap-6"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}), 1fr))`
        }}
      >
        {children}
      </div>
    </div>
  );
});

ResponsiveGrid.displayName = 'ResponsiveGrid';

/**
 * Responsive Stat Card
 * 
 * Shows statistics with adaptive layout using container queries.
 */
interface ResponsiveStatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export const ResponsiveStatCard = memo<ResponsiveStatCardProps>(({
  label,
  value,
  change,
  icon,
  trend = 'neutral',
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className="@container w-full">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 @sm:p-6">
        {/* Horizontal layout on small, vertical on ultra-small */}
        <div className="flex @xs:flex-row flex-col @xs:items-center items-start gap-3 @sm:gap-4">
          {/* Icon */}
          {icon && (
            <div className="shrink-0 w-10 h-10 @sm:w-12 @sm:h-12 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
              {icon}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs @sm:text-sm font-medium text-gray-600 uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-1 text-2xl @sm:text-3xl @lg:text-4xl font-bold text-gray-900">
              {value}
            </p>
            
            {/* Change indicator - hidden on ultra-small */}
            {change !== undefined && (
              <div className={`mt-1 text-sm @sm:text-base font-medium ${trendColors[trend]} hidden @xs:flex items-center gap-1`}>
                <span>{trendIcons[trend]}</span>
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ResponsiveStatCard.displayName = 'ResponsiveStatCard';
