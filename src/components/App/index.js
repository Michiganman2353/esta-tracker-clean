// src/components/app/index.js
import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthUserContext } from '../Session';
import { Navigation } from '../Navigation';
import { LandingPage } from '../Landing';
import { SignUpPage } from '../SignUp';
import { SignInPage } from '../SignIn';
import { PasswordForgetPage } from '../PasswordForget';
import { HomePage } from '../Home';
import { AccountPage } from '../account';
import { AdminPage } from '../admin';
import * as ROUTES from '../../constants/routes';

// Global Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900 p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading Bar
const LoadingBar = () => (
  <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 z-50">
    <div className="h-full w-full animate-pulse bg-white/30"></div>
  </div>
);

const App = () => {
  const authUser = useContext(AuthUserContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate app load
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        {loading && <LoadingBar />}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path={ROUTES.LANDING} element={<LandingPage />} />
              <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
              <Route path={ROUTES.SIGN_IN} element={<SignInPage />} />
              <Route path={ROUTES.PASSWORD_FORGET} element={<PasswordForgetPage />} />
              <Route path={ROUTES.HOME} element={authUser ? <HomePage /> : <Navigate to={ROUTES.SIGN_IN} />} />
              <Route path={ROUTES.ACCOUNT} element={authUser ? <AccountPage /> : <Navigate to={ROUTES.SIGN_IN} />} />
              <Route
                path={ROUTES.ADMIN}
                element={
                  authUser && authUser.roles?.[ROLES.ADMIN] ? (
                    <AdminPage />
                  ) : (
                    <Navigate to={ROUTES.HOME} />
                  )
                }
              />
              <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;