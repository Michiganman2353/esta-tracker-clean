/**
 * Maintenance Mode Component
 * Displays a full-page overlay when the application is in maintenance mode
 */

import { useMaintenanceMode } from '@/hooks/useEdgeConfig';

export function MaintenanceMode() {
  const { maintenanceMode, message, loading } = useMaintenanceMode();

  // Don't show anything while loading
  if (loading) {
    return null;
  }

  // Don't show if not in maintenance mode
  if (!maintenanceMode) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-95">
      <div className="max-w-2xl px-6 py-12 text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <svg
            className="h-24 w-24 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-4xl font-bold text-white">
          Scheduled Maintenance
        </h1>

        {/* Message */}
        <p className="mb-8 text-xl text-gray-300">
          {message || 'ESTA Tracker is currently undergoing scheduled maintenance. We\'ll be back shortly. Thank you for your patience.'}
        </p>

        {/* Additional Info */}
        <div className="rounded-lg bg-gray-800 p-6">
          <p className="text-sm text-gray-400">
            If you need immediate assistance, please contact support at{' '}
            <a
              href="mailto:support@estatracker.com"
              className="text-blue-400 hover:text-blue-300"
            >
              support@estatracker.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
