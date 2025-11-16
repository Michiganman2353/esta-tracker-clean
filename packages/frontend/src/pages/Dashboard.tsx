import { User } from '../types';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                ESTA Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user.name} ({user.role})
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  window.location.href = '/login';
                }}
                className="btn btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome, {user.name}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Michigan Earned Sick Time Act Compliance System
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {(user.role === 'employee' || user.role === 'admin') && (
              <Link to="/employee" className="card hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Employee Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  View your sick time balance, request time off, and track your accrual
                </p>
              </Link>
            )}

            {(user.role === 'employer' || user.role === 'admin') && (
              <Link to="/employer" className="card hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Employer Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage employees, approve requests, and maintain compliance
                </p>
              </Link>
            )}

            <Link to="/audit" className="card hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Audit Trail
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                3-year compliance audit trail and export reports
              </p>
            </Link>

            <div className="card bg-primary-50 dark:bg-primary-900/20">
              <h3 className="text-xl font-semibold text-primary-900 dark:text-primary-100 mb-2">
                Michigan ESTA Compliance
              </h3>
              <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
                <li>✓ Small employer (&lt;10): 40 hrs/year</li>
                <li>✓ Large employer (10+): 1 hr/30 worked</li>
                <li>✓ Year-to-year carryover</li>
                <li>✓ Anti-retaliation protections</li>
                <li>✓ 3-year audit trail</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
