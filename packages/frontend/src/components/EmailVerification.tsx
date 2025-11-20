import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification, reload } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions, isFirebaseConfigured } from '../lib/firebase';

interface EmailVerificationProps {
  email: string;
  onVerified?: () => void;
}

export default function EmailVerification({ email, onVerified }: EmailVerificationProps) {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [autoCheckCount, setAutoCheckCount] = useState(0);
  const navigate = useNavigate();

  // Auto-check verification status every 5 seconds (max 24 times = 2 minutes)
  useEffect(() => {
    if (!auth?.currentUser || !isFirebaseConfigured || autoCheckCount >= 24) {
      return;
    }

    async function autoCheck() {
      if (!auth?.currentUser) return;
      
      try {
        await reload(auth.currentUser);
        
        if (auth.currentUser.emailVerified) {
          // Email is verified! Now activate the account
          try {
            if (functions) {
              console.log('Calling approveUserAfterVerification function');
              const approveUser = httpsCallable(functions, 'approveUserAfterVerification');
              const result = await approveUser({});
              console.log('User approved successfully:', result);
            } else {
              console.warn('Firebase functions not available - continuing without activation');
            }
          } catch (activationError) {
            console.error('Error activating account:', activationError);
            // Continue anyway - they might be able to login even without custom claims
            // The user document status was already set to active during registration
          }

          if (onVerified) {
            onVerified();
          } else {
            navigate('/login?verified=true');
          }
        }
      } catch (error) {
        console.error('Auto-check error:', error);
      }
    }

    const interval = setInterval(() => {
      autoCheck();
      setAutoCheckCount((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoCheckCount, onVerified, navigate]);

  async function checkVerification(isAuto = false) {
    if (!auth?.currentUser || !isFirebaseConfigured) {
      console.warn('Cannot check verification: auth not available');
      return;
    }

    if (!isAuto) {
      setChecking(true);
    }

    try {
      // Reload user data from Firebase with retry logic
      let reloadAttempts = 0;
      const maxReloadAttempts = 3;
      
      while (reloadAttempts < maxReloadAttempts) {
        try {
          await reload(auth.currentUser);
          break;
        } catch (reloadError) {
          reloadAttempts++;
          if (reloadAttempts >= maxReloadAttempts) {
            throw reloadError;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * reloadAttempts));
        }
      }
      
      if (auth.currentUser.emailVerified) {
        // Email is verified! Now activate the account
        try {
          if (functions) {
            console.log('Calling approveUserAfterVerification function');
            const approveUser = httpsCallable(functions, 'approveUserAfterVerification');
            const result = await approveUser({});
            console.log('User approved successfully:', result);
          } else {
            console.warn('Firebase functions not available - continuing without activation');
          }
        } catch (activationError) {
          console.error('Error activating account:', activationError);
          // Continue anyway - they might be able to login even without custom claims
          // The user document status was already set to active during registration
        }

        // Email is verified and account activated!
        if (onVerified) {
          onVerified();
        } else {
          // Redirect to login or dashboard
          navigate('/login?verified=true');
        }
      } else if (!isAuto) {
        setResendMessage('Email not verified yet. Please check your inbox and spam folder.');
        setTimeout(() => setResendMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      if (!isAuto) {
        const err = error as { code?: string; message?: string };
        let errorMessage = 'Error checking verification status. ';
        
        if (err.code === 'auth/network-request-failed') {
          errorMessage += 'Please check your internet connection and try again.';
        } else if (err.code === 'auth/too-many-requests') {
          errorMessage += 'Too many requests. Please wait a moment and try again.';
        } else {
          errorMessage += 'Please try again or contact support if the problem persists.';
        }
        
        setResendMessage(errorMessage);
        setTimeout(() => setResendMessage(''), 5000);
      }
    } finally {
      if (!isAuto) {
        setChecking(false);
      }
    }
  }

  async function resendVerificationEmail() {
    if (!auth?.currentUser || !isFirebaseConfigured) {
      setResendMessage('Authentication not available. Please refresh the page and try again.');
      setTimeout(() => setResendMessage(''), 5000);
      return;
    }

    setResending(true);
    setResendMessage('');

    try {
      // Retry logic for sending email
      let sendAttempts = 0;
      const maxSendAttempts = 2;
      let lastError: Error | null = null;
      
      while (sendAttempts < maxSendAttempts) {
        try {
          await sendEmailVerification(auth.currentUser, {
            url: window.location.origin + '/login?verified=true',
            handleCodeInApp: false,
          });
          setResendMessage('✓ Verification email sent! Please check your inbox and spam folder.');
          return; // Success
        } catch (sendError) {
          lastError = sendError as Error;
          sendAttempts++;
          if (sendAttempts < maxSendAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // If we get here, all attempts failed
      throw lastError;
    } catch (error: unknown) {
      console.error('Error resending verification email:', error);
      
      const err = error as { code?: string; message?: string };
      let errorMessage = '';
      
      if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.code === 'auth/timeout') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else {
        errorMessage = 'Failed to send verification email. Please try again later or contact support.';
      }
      
      setResendMessage(errorMessage);
    } finally {
      setResending(false);
      setTimeout(() => setResendMessage(''), 8000); // Longer display time for error messages
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900">
            <svg
              className="h-8 w-8 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            We've sent a verification link to:
          </p>
          <p className="mt-1 text-center text-base font-medium text-gray-900 dark:text-white">
            {email}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                Check your email inbox for the verification link
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                Click the verification link in the email
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                Return here and click "I've Verified" or wait for automatic detection
              </p>
            </div>
          </div>

          {resendMessage && (
            <div
              className={`rounded-md p-3 ${
                resendMessage.includes('sent') || resendMessage.includes('Sent')
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
              }`}
            >
              <p className="text-sm">{resendMessage}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => checkVerification(false)}
              disabled={checking}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {checking ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Checking...
                </>
              ) : (
                "I've Verified My Email"
              )}
            </button>

            <button
              onClick={resendVerificationEmail}
              disabled={resending}
              className="btn btn-secondary w-full"
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Didn't receive the email? Check your spam folder or click resend.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
