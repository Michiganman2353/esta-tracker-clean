import { useNavigate } from 'react-router-dom';
import { useRegistrationStatus } from '../hooks/useEdgeConfig';
import { OnboardingWizard } from '../components/OnboardingWizard';

export default function RegisterManager() {
  const navigate = useNavigate();
  const { isOpen: registrationOpen, message: closedMessage, loading: checkingStatus } = useRegistrationStatus('employer');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {checkingStatus ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      ) : !registrationOpen ? (
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Registration Closed
            </h2>
            <div className="mt-6 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {closedMessage || 'Employer registration is currently closed. Please check back later or contact support for more information.'}
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      ) : (
        <OnboardingWizard />
      )}
    </div>
  );
}
