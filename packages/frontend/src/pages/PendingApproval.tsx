import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

export default function PendingApproval() {
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
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
            <svg
              className="h-6 w-6 text-yellow-600 dark:text-yellow-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Account Pending Approval
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your account registration is being reviewed
          </p>
        </div>

        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                What happens next?
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Our team is reviewing your registration</li>
                  <li>You'll receive an email once your account is approved</li>
                  <li>This process typically takes 1-2 business days</li>
                  <li>If you have questions, contact support@estatracker.com</li>
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
              <p className="text-sm text-blue-700 dark:text-blue-300">
                For employer/manager accounts, approval is required to ensure compliance with
                Michigan's ESTA regulations and protect your business data.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSignOut}
            className="w-full btn btn-secondary"
          >
            Sign Out
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Need immediate assistance? Contact our support team at{' '}
            <a href="mailto:support@estatracker.com" className="text-blue-600 hover:text-blue-500">
              support@estatracker.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
