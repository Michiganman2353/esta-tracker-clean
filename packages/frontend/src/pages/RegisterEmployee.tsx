import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerEmployee } from '../lib/authService';
import { isFirebaseConfigured } from '../lib/firebase';
import { apiClient } from '../lib/api';
import { User } from '../types';
import EmailVerification from '../components/EmailVerification';
import { useRegistrationStatus } from '../hooks/useEdgeConfig';
import { PasswordField } from '../components/PasswordField';
import { LoadingButton } from '../components/LoadingButton';

interface RegisterEmployeeProps {
  onRegister: (user: User) => void;
}

export default function RegisterEmployee({ onRegister }: RegisterEmployeeProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const navigate = useNavigate();
  const { isOpen: registrationOpen, message: closedMessage, loading: checkingStatus } = useRegistrationStatus('employee');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      if (isFirebaseConfigured) {
        // Use Firebase authentication
        const { user, needsVerification } = await registerEmployee({
          name,
          email,
          password,
          tenantCode: tenantCode.trim() || undefined,
        });
        
        if (needsVerification) {
          setShowVerification(true);
        } else {
          // Auto-login for employees if no verification needed (shouldn't happen)
          onRegister(user);
        }
      } else {
        // Fallback to existing API for local development
        const response = await apiClient.registerEmployee({ name, email, password });
        apiClient.setToken(response.token);
        onRegister(response.user as User);
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        // Type guard for ApiError
        const error = err as { status?: number; message?: string; isNetworkError?: boolean };
        
        if (error.isNetworkError) {
          setError('Unable to connect to server. Please check your internet connection and try again.');
        } else if (error.status === 409) {
          setError('This email is already registered. Please use a different email or try logging in.');
        } else if (error.status && error.status >= 400 && error.status < 500) {
          setError(error.message || 'Registration failed. Please check your information and try again.');
        } else {
          setError('Registration failed. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {checkingStatus ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      ) : !registrationOpen ? (
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Registration Closed
            </h2>
            <div className="mt-6 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {closedMessage || 'Employee registration is currently closed. Please check back later or contact your employer for more information.'}
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      ) : showVerification ? (
        <EmailVerification
          email={email}
          onVerified={() => {
            navigate('/login?verified=true');
          }}
        />
      ) : (
        <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Employee Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Create your ESTA Tracker employee account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input mt-1 block w-full"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input mt-1 block w-full"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tenantCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Code (Optional)
              </label>
              <input
                id="tenantCode"
                name="tenantCode"
                type="text"
                className="input mt-1 block w-full"
                placeholder="Enter your company code"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ask your employer for the company code to link your account
              </p>
            </div>
            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Minimum 8 characters"
              required
              autoComplete="new-password"
              className="mb-4"
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter password"
              required
              autoComplete="new-password"
              showIcon={false}
            />
          </div>

          <div>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Creating account..."
              variant="primary"
              className="w-full flex justify-center py-2"
            >
              Register as Employee
            </LoadingButton>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => navigate('/register/manager')}
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Register as Manager instead?
            </button>
            <div>
              <a
                href="/login"
                className="font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400"
              >
                Already have an account? Sign in
              </a>
            </div>
          </div>
        </form>
        </div>
      )}
    </div>
  );
}
