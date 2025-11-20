import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>
      
      <div className="max-w-2xl w-full space-y-8 relative z-10 animate-fade-in-up">
        <div className="text-center">
          <h2 className="mt-6 text-5xl font-extrabold gradient-header animate-fade-in-down">
            Create Your ESTA Tracker Account
          </h2>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Choose your account type to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Manager Registration Card */}
          <div className="glass-card-hover p-8 group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 p-5 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg
                    className="w-12 h-12 text-primary-600 dark:text-primary-400"
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
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Manager / Employer
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Register your company and manage your employees' ESTA compliance
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
                <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Track employee sick time
                </li>
                <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Automated compliance reports
                </li>
                <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Manage employee roster
                </li>
              </ul>
              <button
                onClick={() => navigate('/register/manager')}
                className="btn btn-primary w-full mt-4 relative overflow-hidden group/btn"
              >
                <span className="relative z-10">Register as Manager</span>
                <span className="absolute inset-0 shimmer-bg opacity-0 group-hover/btn:opacity-100 transition-opacity"></span>
              </button>
            </div>
          </div>

          {/* Employee Registration Card */}
          <div className="glass-card-hover p-8 group animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 p-5 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg
                    className="w-12 h-12 text-primary-600 dark:text-primary-400"
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
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Employee
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access your sick time balance and request time off
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
                <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View sick time balance
                </li>
                <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Submit time-off requests
                </li>
                <li className="flex items-start transform transition-transform duration-200 hover:translate-x-1">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Track your hours
                </li>
              </ul>
              <button
                onClick={() => navigate('/register/employee')}
                className="btn btn-primary w-full mt-4 relative overflow-hidden group/btn"
              >
                <span className="relative z-10">Register as Employee</span>
                <span className="absolute inset-0 shimmer-bg opacity-0 group-hover/btn:opacity-100 transition-opacity"></span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <a
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 hover:underline transition-all"
          >
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
