import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiClient } from './lib/api';
import { User } from './types';

// Pages (we'll create these)
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterEmployee from './pages/RegisterEmployee';
import RegisterManager from './pages/RegisterManager';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AuditLog from './pages/AuditLog';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await apiClient.getCurrentUser();
      setUser(response.user as User);
      setError(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Type guard for ApiError
      const apiError = error as { status?: number; message?: string; isNetworkError?: boolean };
      
      // Only show error if it's not a simple "not authenticated" case
      if (apiError.status && apiError.status !== 401) {
        if (apiError.isNetworkError) {
          setError('Unable to connect to server. Please check your internet connection.');
        } else {
          setError(`Error loading application: ${apiError.message || 'Unknown error'}`);
        }
      }
      
      // Clear any invalid token
      if (apiError.status === 401) {
        apiClient.setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-xl mb-4">Loading...</div>
          <div className="text-sm text-gray-500">Connecting to ESTA Tracker</div>
        </div>
      </div>
    );
  }

  if (error) {
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
                  Connection Error
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      checkAuth();
                    }}
                    className="btn btn-primary text-sm"
                  >
                    Retry Connection
                  </button>
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
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/register/employee" element={!user ? <RegisterEmployee onRegister={setUser} /> : <Navigate to="/" />} />
        <Route path="/register/manager" element={!user ? <RegisterManager /> : <Navigate to="/" />} />
        
        {user ? (
          <>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/employee" element={<EmployeeDashboard user={user} />} />
            <Route path="/employer" element={<EmployerDashboard user={user} />} />
            <Route path="/audit" element={<AuditLog user={user} />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
