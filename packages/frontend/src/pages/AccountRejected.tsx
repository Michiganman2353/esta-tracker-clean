import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

export default function AccountRejected() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Account Not Approved
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your account registration was not approved
          </p>
        </div>

        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Why was my account rejected?
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>
                  Your account registration did not meet our verification requirements.
                  This could be due to:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Incomplete or incorrect information</li>
                  <li>Duplicate account registration</li>
                  <li>Verification issues</li>
                  <li>Other compliance reasons</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                What should I do next?
              </h3>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                Please contact our support team for more information about your account status
                and guidance on next steps. We're here to help!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <a
            href="mailto:support@estatracker.com?subject=Account Rejection Inquiry"
            className="w-full btn btn-primary"
          >
            Contact Support
          </a>

          <button
            onClick={handleSignOut}
            className="w-full btn btn-secondary"
          >
            Sign Out
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Email us at{' '}
            <a href="mailto:support@estatracker.com" className="text-blue-600 hover:text-blue-500">
              support@estatracker.com
            </a>
            {' '}for assistance
          </p>
        </div>
      </div>
    </div>
  );
}
