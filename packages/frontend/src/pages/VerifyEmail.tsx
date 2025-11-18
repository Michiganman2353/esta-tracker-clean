import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const email = searchParams.get('email') || '';

  useEffect(() => {
    // Check if user is already verified
    const checkVerification = async () => {
      if (auth?.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          navigate('/');
        }
      }
    };

    checkVerification();
    const interval = setInterval(checkVerification, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  const handleResendEmail = async () => {
    if (!auth?.currentUser) {
      setMessage('No user is currently signed in.');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      await sendEmailVerification(auth.currentUser);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error sending verification email:', error);
      setMessage('Failed to send verification email. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
            <svg
              className="h-6 w-6 text-blue-600 dark:text-blue-300"
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
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We sent a verification link to
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
            {email}
          </p>
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
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Please check your email
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>Click the verification link in the email to activate your account.</p>
                <p className="mt-2">
                  Once verified, you'll be automatically redirected to your dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`rounded-md ${message.includes('sent') ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} p-4`}>
            <p className={`text-sm ${message.includes('sent') ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {message}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={sending}
            className="w-full btn btn-secondary"
          >
            {sending ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full btn btn-outline"
          >
            Back to Login
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Didn't receive the email? Check your spam folder or request a new verification email.
          </p>
        </div>
      </div>
    </div>
  );
}
