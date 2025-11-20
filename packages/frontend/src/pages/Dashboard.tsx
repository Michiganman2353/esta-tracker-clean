/**
 * Dashboard Page
 * 
 * Main dashboard page for ESTA Tracker that provides navigation to
 * different sections based on user role.
 * 
 * Features:
 * - Role-based navigation cards
 * - Employee dashboard link (for employees and admins)
 * - Employer dashboard link (for employers and admins)
 * - Audit trail access
 * - Settings page access
 * - Michigan ESTA compliance information
 * - Trust badge display
 * - Responsive design
 * - Dark mode support
 * 
 * Uses:
 * - React Router Link for navigation
 * - TrustBadgeGroup component for security indicators
 * - User type for authentication
 */

import { User } from '../types';
import { Link } from 'react-router-dom';
import { TrustBadgeGroup } from '../components/Settings';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  return (
    <div className="min-h-screen gradient-bg">
      <nav className="glass-card shadow-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70 animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold gradient-header">
                ESTA Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/settings"
                className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hidden sm:inline transition-colors"
              >
                Settings
              </Link>
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px] sm:max-w-none">
                {user.name} ({user.role})
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  window.location.href = '/login';
                }}
                className="btn btn-secondary text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="px-0 sm:px-0">
          <div className="text-center mb-6 sm:mb-8 animate-fade-in-up">
            <h2 className="text-2xl sm:text-3xl font-bold gradient-header mb-2">
              Welcome back, {user.name}! 👋
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Michigan Earned Sick Time Act Compliance System
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
            {(user.role === 'employee' || user.role === 'admin') && (
              <Link to="/employee" className="glass-card-hover p-4 sm:p-6 group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 dark:text-primary-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      Employee Dashboard
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      View your sick time balance, request time off, and track your accrual
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {(user.role === 'employer' || user.role === 'admin') && (
              <Link to="/employer" className="glass-card-hover p-4 sm:p-6 group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 dark:text-primary-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      Employer Dashboard
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Manage employees, approve requests, and maintain compliance
                    </p>
                  </div>
                </div>
              </Link>
            )}

            <Link to="/audit" className="glass-card-hover p-4 sm:p-6 group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 dark:text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Audit Trail
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    3-year compliance audit trail and export reports
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/settings" className="glass-card-hover p-4 sm:p-6 group animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 dark:text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Settings
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Account settings, security information, and integrations
                  </p>
                </div>
              </div>
            </Link>

            <div className="glass-card p-4 sm:p-6 bg-gradient-to-br from-primary-50/80 to-purple-50/80 dark:from-primary-900/30 dark:to-purple-900/30 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 dark:text-primary-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-primary-900 dark:text-primary-100 mb-1 sm:mb-2">
                    Michigan ESTA Compliance
                  </h3>
                  <ul className="text-xs sm:text-sm text-primary-800 dark:text-primary-200 space-y-1">
                    <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                      <span className="mr-2 flex-shrink-0">✓</span>
                      <span>Small employer (&lt;10): 40 hrs/year</span>
                    </li>
                    <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                      <span className="mr-2 flex-shrink-0">✓</span>
                      <span>Large employer (10+): 1 hr/30 worked</span>
                    </li>
                    <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                      <span className="mr-2 flex-shrink-0">✓</span>
                      <span>Year-to-year carryover</span>
                    </li>
                    <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                      <span className="mr-2 flex-shrink-0">✓</span>
                      <span>Anti-retaliation protections</span>
                    </li>
                    <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                      <span className="mr-2 flex-shrink-0">✓</span>
                      <span>3-year audit trail</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 flex justify-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <TrustBadgeGroup badges={['security', 'compliance', 'verified']} size="sm" />
          </div>
        </div>
      </main>
    </div>
  );
}
