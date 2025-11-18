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

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await apiClient.getCurrentUser();
      setUser(response.user as User);
    } catch (error) {
      console.error('Not authenticated', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl">Loading...</div>
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
