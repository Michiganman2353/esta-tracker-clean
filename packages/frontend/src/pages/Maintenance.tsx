import { useEffect, useState } from 'react';

export default function Maintenance() {
  const [estimatedTime, setEstimatedTime] = useState('');

  useEffect(() => {
    // In production, this could fetch from an API or Edge Config
    // For now, we'll set a default message
    setEstimatedTime('We will be back shortly');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900">
            <svg
              className="h-10 w-10 text-blue-600 dark:text-blue-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
          <h1 className="mt-6 text-4xl font-extrabold text-gray-900 dark:text-white">
            Scheduled Maintenance
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            We're currently performing system upgrades
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-6">
          <div className="flex justify-center">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-400"
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
            <div className="ml-3 text-left">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                What's happening?
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  ESTA Tracker is temporarily unavailable while we perform scheduled maintenance
                  to improve our services. We're working to:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Enhance system performance</li>
                  <li>Deploy new features</li>
                  <li>Improve security and compliance</li>
                  <li>Update our infrastructure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Expected Return
          </h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {estimatedTime}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Thank you for your patience!
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            For urgent matters or questions, please contact us:
          </p>
          <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:support@estatracker.com"
              className="inline-flex items-center text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              support@estatracker.com
            </a>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Check Status
          </button>
        </div>
      </div>
    </div>
  );
}
