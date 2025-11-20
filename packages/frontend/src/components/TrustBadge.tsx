/**
 * App Component
 *
 * This is the root component for the ESTA Tracker web application.
 * It manages authentication state, routes, and global error handling.
 *
 * Features:
 * - Checks for authenticated user on mount, handles loading and network errors
 * - Displays skeleton dashboard and retry logic on connection issues
 * - Provides public routes for login, registration, and pricing
 * - Provides protected routes for authenticated users:
 *   - Dashboard, EmployeeDashboard, EmployerDashboard, AuditLog, Settings, etc.
 * - Implements conditional navigation based on user authentication
 * - Integrates maintenance mode notification
 *
 * Uses:
 * - React Router for client-side navigation
 * - API client for user authentication
 * - Design system components for consistent UI feedback
 *
 * All application pages and layout are controlled from here.
 */

import { Tooltip } from './DesignSystem';

interface TrustBadgeProps {
  variant?: 'default' | 'compact';
  showTooltip?: boolean;
}

export function TrustBadge({ variant = 'default', showTooltip = true }: TrustBadgeProps) {
  const badge = (
    <div className={`inline-flex items-center space-x-2 ${
      variant === 'compact' 
        ? 'bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-xs' 
        : 'bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg'
    }`}>
      <svg 
        className={`text-green-600 ${variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'}`} 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
          clipRule="evenodd" 
        />
      </svg>
      <span className={`font-semibold text-green-900 dark:text-green-100 ${
        variant === 'compact' ? 'text-xs' : 'text-sm'
      }`}>
        {variant === 'compact' ? 'Secure' : 'ESTA Compliant'}
      </span>
    </div>
  );

  if (showTooltip) {
    return (
      <Tooltip 
        content="End-to-end encrypted | 3-year audit trail | Michigan ESTA compliant"
        position="bottom"
      >
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
