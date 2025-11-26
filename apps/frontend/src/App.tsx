/**
 * App Component
 *
 * This is the root component for the ESTA Tracker web application.
 * It manages authentication state, routes, and global error handling.
 *
 * Features:
 * - Integrates with Firebase AuthContext for centralized auth state
 * - Handles loading states with better UX
 * - Provides detailed error messages with recovery options
 * - Supports both Firebase and API-based authentication
 * - Displays skeleton dashboard and retry logic on connection issues
 * - Provides public routes for login, registration, and pricing
 * - Provides protected routes for authenticated users
 * - Implements conditional navigation based on user authentication
 * - Integrates maintenance mode notification
 * - Includes debug panel for development
 * - Uses React lazy loading for optimal performance
 *
 * Uses:
 * - React Router for client-side navigation
 * - AuthContext for Firebase authentication state
 * - API client for backend authentication fallback
 * - Design system components for consistent UI feedback
 * - React.lazy and Suspense for code splitting
 *
 * All application pages and layout are controlled from here.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { User } from '@/types';
import { MaintenanceMode } from '@/components/MaintenanceMode';
import { DebugPanel } from '@/components/DebugPanel';

// Eagerly load critical components that appear on first render
import Login from '@/pages/Login';

// Lazy load other pages for better performance
const Landing = lazy(() => import('@/pages/Landing'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Register = lazy(() => import('@/pages/Register'));
const RegisterEmployee = lazy(() => import('@/pages/RegisterEmployee'));
const RegisterManager = lazy(() => import('@/pages/RegisterManager'));
const EmployeeDashboard = lazy(() => import('@/pages/EmployeeDashboard'));
const EmployerDashboard = lazy(() => import('@/pages/EmployerDashboard'));
const AuditLog = lazy(() => import('@/pages/AuditLog'));
const Settings = lazy(() => import('@/pages/Settings'));
const Pricing = lazy(() => import('@/pages/Pricing'));

/**
 * Loading fallback component for lazy-loaded routes
 */
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="space-y-4 text-center">
      <div className="relative">
        <div className="border-primary-200 border-t-primary-600 mx-auto h-16 w-16 animate-spin rounded-full border-4"></div>
      </div>
      <div>
        <div className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Loading...
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we load the page
        </p>
      </div>
    </div>
  </div>
);

function App() {
  const { userData, currentUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Log authentication state changes for debugging
  useEffect(() => {
    console.log('=== Auth State Change ===');
    console.log('Firebase User:', currentUser?.email);
    console.log(
      'User Data:',
      userData?.email,
      userData?.role,
      userData?.status
    );
    console.log('Auth Loading:', authLoading);
    console.log('========================');
  }, [currentUser, userData, authLoading]);

  useEffect(() => {
    // Wait for Firebase auth to initialize
    if (authLoading) {
      return;
    }

    // If we have user data, use it
    if (userData) {
      console.log('Using Firebase user data:', userData);
      setUser(userData);
      setLoading(false);
      setError(null);
      return;
    }

    // If no user, clear state and stop loading
    if (!userData && !currentUser) {
      console.log('No Firebase user, showing login');
      setUser(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(false);
  }, [currentUser, userData, authLoading]);

  // Enhanced loading screen with progress indicator
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="space-y-4 text-center">
          <div className="relative">
            {/* Animated spinner */}
            <div className="border-primary-200 border-t-primary-600 mx-auto h-16 w-16 animate-spin rounded-full border-4"></div>
          </div>
          <div>
            <div className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Loading ESTA Tracker
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {authLoading
                ? 'Checking authentication...'
                : 'Connecting to server...'}
            </div>
          </div>
          {/* Show helpful info if loading takes too long */}
          {retryCount > 0 && (
            <div className="mx-auto mt-4 max-w-md rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This is taking longer than expected. Please check your internet
                connection.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enhanced error screen with actionable steps
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="mb-2 text-base font-semibold text-red-800 dark:text-red-200">
                  Connection Error
                </h3>
                <p className="mb-4 text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>

                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-semibold text-red-800 dark:text-red-200">
                    What you can try:
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-300">
                    <li>Check your internet connection</li>
                    <li>Refresh your browser</li>
                    <li>Clear your browser cache</li>
                    <li>Try a different browser</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      setRetryCount(retryCount + 1);
                      // Retry will happen via useEffect
                      setLoading(false);
                    }}
                    className="btn btn-primary text-sm"
                  >
                    Retry Connection
                  </button>
                  <a
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      setError(null);
                      setUser(null);
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    Go to Login
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <MaintenanceMode />
      <DebugPanel />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes - accessible without authentication */}
          <Route
            path="/"
            element={!user ? <Landing /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/login"
            element={
              !user ? <Login onLogin={setUser} /> : <Navigate to="/dashboard" />
            }
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register/employee"
            element={
              !user ? (
                <RegisterEmployee onRegister={setUser} />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/register/manager"
            element={
              !user ? (
                <RegisterManager onRegister={setUser} />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route path="/pricing" element={<Pricing />} />

          {/* Protected routes - require authentication */}
          {user ? (
            <>
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route
                path="/employee"
                element={<EmployeeDashboard user={user} />}
              />
              <Route
                path="/employer"
                element={<EmployerDashboard user={user} />}
              />
              <Route path="/audit" element={<AuditLog user={user} />} />
              <Route path="/settings" element={<Settings user={user} />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" />} />
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
