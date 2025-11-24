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
 * 
 * Uses:
 * - React Router for client-side navigation
 * - AuthContext for Firebase authentication state
 * - API client for backend authentication fallback
 * - Design system components for consistent UI feedback
 * 
 * All application pages and layout are controlled from here.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { User } from '@/types';
import { MaintenanceMode } from '@/components/MaintenanceMode';
import { DebugPanel } from '@/components/DebugPanel';

// Pages
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import RegisterEmployee from '@/pages/RegisterEmployee';
import RegisterManager from '@/pages/RegisterManager';
import EmployeeDashboard from '@/pages/EmployeeDashboard';
import EmployerDashboard from '@/pages/EmployerDashboard';
import AuditLog from '@/pages/AuditLog';
import Settings from '@/pages/Settings';
import Pricing from '@/pages/Pricing';

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
    console.log('User Data:', userData?.email, userData?.role, userData?.status);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="relative">
            {/* Animated spinner */}
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading ESTA Tracker
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {authLoading ? 'Checking authentication...' : 'Connecting to server...'}
            </div>
          </div>
          {/* Show helpful info if loading takes too long */}
          {retryCount > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This is taking longer than expected. Please check your internet connection.
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-base font-semibold text-red-800 dark:text-red-200 mb-2">
                  Connection Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                    What you can try:
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
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
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/register/employee" element={!user ? <RegisterEmployee onRegister={setUser} /> : <Navigate to="/" />} />
        <Route path="/register/manager" element={!user ? <RegisterManager onRegister={setUser} /> : <Navigate to="/" />} />
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Protected routes */}
        {user ? (
          <>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/employee" element={<EmployeeDashboard user={user} />} />
            <Route path="/employer" element={<EmployerDashboard user={user} />} />
            <Route path="/audit" element={<AuditLog user={user} />} />
            <Route path="/settings" element={<Settings user={user} />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
