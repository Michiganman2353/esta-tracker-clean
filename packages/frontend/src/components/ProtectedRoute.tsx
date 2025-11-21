import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
}

/**
 * ProtectedRoute component for securing routes that require authentication
 * 
 * @param children - The component to render if access is granted
 * @param requireEmailVerification - Whether email verification is required (default: false)
 * @param allowedRoles - Array of allowed roles (optional, if not provided, any authenticated user can access)
 */
export function ProtectedRoute({ 
  children, 
  requireEmailVerification = false,
  allowedRoles 
}: ProtectedRouteProps) {
  const { currentUser, userData, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser || !userData) {
    return <Navigate to="/login" replace />;
  }

  // Check email verification if required
  if (requireEmailVerification && !currentUser.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Email Verification Required
                </h3>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  Please verify your email address to access this feature. Check your inbox for the verification link.
                </p>
                <div className="mt-4">
                import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

<button
  className="btn btn-primary text-sm"
  onClick={() => navigate('/login')}
>
  Back to Login
</button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Access Denied
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  You don't have permission to access this page. Your role is: {userData.role}
                </p>
                <div className="mt-4">
                  <a
                    href="/"
                    className="btn btn-primary text-sm"
                  >
                    Back to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if account is approved
  if (userData.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Account Pending Approval
                </h3>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  Your account is pending approval. You will receive an email once your account has been activated.
                </p>
                {userData.role === 'employee' && (
                  <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    Please contact your employer if you believe this is an error.
                  </p>
                )}
                <div className="mt-4">
                  <a
                    href="/login"
                    className="btn btn-primary text-sm"
                  >
                    Back to Login
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userData.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Account Rejected
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  Your account registration has been rejected. Please contact support for more information.
                </p>
                <div className="mt-4">
                  <a
                    href="/login"
                    className="btn btn-primary text-sm"
                  >
                    Back to Login
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed, render the protected content
  return children;
}
