import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import EmailVerification from '../components/EmailVerification';
import { useEffect } from 'react';

export default function VerifyEmailPage() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || currentUser?.email || '';

  useEffect(() => {
    // If already verified, redirect to login
    if (currentUser?.emailVerified) {
      navigate('/login?verified=true', { replace: true });
    }
  }, [currentUser, navigate]);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              No email verification in progress. Please register first.
            </p>
            <div className="mt-4">
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary text-sm"
              >
                Go to Registration
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EmailVerification
      email={email}
      userId={currentUser?.uid}
      onVerified={() => {
        navigate('/login?verified=true');
      }}
    />
  );
}
