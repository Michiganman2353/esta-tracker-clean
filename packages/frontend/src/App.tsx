/**
 * App Component
 * 
 * This is the root component for the ESTA Tracker web application.
 * It manages authentication state, routes, and global error handling.
 * 
 * Features:
 * - Uses AuthContext for Firebase authentication state management
 * - Provides public routes for login, registration, and pricing
 * - Provides protected routes for authenticated users with role-based access
 * - Implements proper route guards via ProtectedRoute component
 * - Integrates maintenance mode notification
 * 
 * Uses:
 * - React Router for client-side navigation
 * - AuthProvider for Firebase authentication
 * - ProtectedRoute for securing authenticated routes
 * - Design system components for consistent UI feedback
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { MaintenanceMode } from './components/MaintenanceMode';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterEmployee from './pages/RegisterEmployee';
import RegisterManager from './pages/RegisterManager';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';

/**
 * AppRoutes component - handles all routing logic
 * Separated from App to allow useAuth hook access
 */
function AppRoutes() {
  const { currentUser, userData, loading } = useAuth();

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

  return (
    <>
      <MaintenanceMode />
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={!currentUser ? <Login onLogin={() => {}} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register" 
          element={!currentUser ? <Register /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register/employee" 
          element={!currentUser ? <RegisterEmployee onRegister={() => {}} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register/manager" 
          element={!currentUser ? <RegisterManager onRegister={() => {}} /> : <Navigate to="/" replace />} 
        />
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard user={userData!} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/employee" 
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard user={userData!} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/employer" 
          element={
            <ProtectedRoute allowedRoles={['employer', 'admin']}>
              <EmployerDashboard user={userData!} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audit" 
          element={
            <ProtectedRoute>
              <AuditLog user={userData!} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings user={userData!} />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all - redirect to login or home based on auth state */}
        <Route 
          path="*" 
          element={<Navigate to={currentUser ? "/" : "/login"} replace />} 
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
