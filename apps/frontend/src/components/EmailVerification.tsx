import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface EmailVerificationProps {
  email: string;
  onVerified?: () => void;
}

export default function EmailVerification({ email, onVerified: _onVerified }: EmailVerificationProps) {
  const navigate = useNavigate();

  // DEVELOPMENT MODE: Email verification is bypassed
  // Auto-redirect after 3 seconds or allow manual skip
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[DEV MODE] Auto-skipping email verification');
      navigate('/login');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  // The following code is kept for reference but disabled in development mode
  // When re-enabling email verification, uncomment everything below and restore imports
  /* 
  // Restore these imports when re-enabling:
  // import { useState } from 'react';
  // import { sendEmailVerification, reload } from 'firebase/auth';
  // import { httpsCallable } from 'firebase/functions';
  // import { auth, functions, isFirebaseConfigured } from '../lib/firebase';

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [autoCheckCount, setAutoCheckCount] = useState(0);
  
  useEffect(() => {
    if (!auth?.currentUser || !isFirebaseConfigured || autoCheckCount >= 24) {
      return;
    }

    async function autoCheck() {
      if (!auth?.currentUser) return;
      
      try {
        await reload(auth.currentUser);
        
        if (auth.currentUser.emailVerified) {
          // Email is verified! Try to activate the account via function
          try {
            if (functions) {
              console.log('Calling approveUserAfterVerification function');
              const approveUser = httpsCallable(functions, 'approveUserAfterVerification');
              const result = await approveUser({});
              console.log('User approved successfully:', result);
            } else {
              console.warn('Firebase functions not available - user will be auto-activated on login');
            }
          } catch (activationError) {
            console.error('Error activating account (non-fatal):', activationError);
            // Continue anyway - user will be auto-activated on login
            // The signIn function handles this case
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
        // Email is verified! Try to activate the account via function
        try {
          if (functions) {
            console.log('Calling approveUserAfterVerification function');
            const approveUser = httpsCallable(functions, 'approveUserAfterVerification');
            const result = await approveUser({});
            console.log('User approved successfully:', result);
          } else {
            console.warn('Firebase functions not available - user will be auto-activated on login');
          }
        } catch (activationError) {
          console.error('Error activating account (non-fatal):', activationError);
          // Continue anyway - user will be auto-activated on login
          // The signIn function handles this case
        }

        // Email is verified and account activated (or will be on login)!
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
  */

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* DEVELOPMENT MODE BANNER */}
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 border-2 border-yellow-400 dark:border-yellow-600">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Development Mode - Email Verification Bypassed
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Email verification is temporarily disabled. You will be redirected to login in 3 seconds, or click the button below to continue immediately.</p>
              </div>
            </div>
          </div>
        </div>

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
            Email Verification Skipped
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Registration completed for:
          </p>
          <p className="mt-1 text-center text-base font-medium text-gray-900 dark:text-white">
            {email}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-4">
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary w-full"
            >
              Continue to Login
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Note: In production, you would need to verify your email before logging in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
