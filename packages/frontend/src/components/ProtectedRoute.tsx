import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireVerified?: boolean;
  requireApproved?: boolean;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  requireVerified = true,
  requireApproved = true,
  allowedRoles,
}: ProtectedRouteProps) {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-xl mb-4">Loading...</div>
          <div className="text-sm text-gray-500">Checking authentication</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email verification
  if (requireVerified && !currentUser.emailVerified) {
    return (
      <Navigate
        to="/verify-email"
        state={{ email: currentUser.email, from: location }}
        replace
      />
    );
  }

  // Check approval status
  if (requireApproved && userData?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                  Account Pending Approval
                </h3>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  Your account has been created but is pending approval. You will receive an email
                  notification once your account has been verified and approved.
                </p>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  This typically takes 1-2 business days.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => (window.location.href = '/login')}
                    className="btn btn-secondary text-sm"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if account is rejected
  if (userData?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                  Account Rejected
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  Your account has been rejected. Please contact support for more information.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => (window.location.href = '/login')}
                    className="btn btn-secondary text-sm"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && userData?.role && !allowedRoles.includes(userData.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                  Access Denied
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  You do not have permission to access this page.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => (window.location.href = '/')}
                    className="btn btn-secondary text-sm"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, verified, approved, and has correct role
  return <>{children}</>;
}
