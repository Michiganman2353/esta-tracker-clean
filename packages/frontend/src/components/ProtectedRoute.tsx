import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  children,
  requireEmailVerification = false,
  allowedRoles
}: ProtectedRouteProps) {
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();

  // Loading state
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

  // Not authenticated → redirect
  if (!currentUser || !userData) {
    return <Navigate to="/login" replace />;
  }

  // Email verification check
  if (requireEmailVerification && !currentUser.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Email Verification Required
            </h3>
            <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              Please verify your email address to continue.
            </p>

            <div className="mt-4">
              <button
                className="btn btn-primary text-sm"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Role-based access
  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Access Denied
            </h3>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              You do not have permission to view this page.
            </p>

            <div className="mt-4">
              <button
                className="btn btn-primary text-sm"
                onClick={() => navigate('/')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Account status: pending
  if (userData.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Account Pending Approval
            </h3>

            <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              Your account is pending approval. You’ll be notified once activated.
            </p>

            {userData.role === 'employee' && (
              <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                Contact your employer if this seems incorrect.
              </p>
            )}

            <div className="mt-4">
              <button
                className="btn btn-primary text-sm"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Account status: rejected
  if (userData.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Account Rejected
            </h3>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              Your registration was rejected. Contact support for help.
            </p>

            <div className="mt-4">
              <button
                className="btn btn-primary text-sm"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All good — render child
  return children;
}