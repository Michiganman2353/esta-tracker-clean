import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { signIn } from '../lib/authService';
import { isFirebaseConfigured } from '../lib/firebase';
import { apiClient } from '../lib/api';
import { User } from '../types';
import { PasswordField } from '../components/PasswordField';
import { LoadingButton } from '../components/LoadingButton';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  
  const verified = searchParams.get('verified') === 'true';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isFirebaseConfigured) {
        // Use Firebase authentication
        const user = await signIn(email, password);
        onLogin(user);
      } else {
        // Fallback to existing API for local development
        const response = await apiClient.login(email, password);
        apiClient.setToken(response.token);
        onLogin(response.user as User);
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        // Type guard for ApiError
        const error = err as { status?: number; message?: string; isNetworkError?: boolean };
        
        if (error.isNetworkError) {
          setError('Unable to connect to server. Please check your internet connection and try again.');
        } else if (error.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (error.status === 403) {
          setError('Your account is pending approval. Please wait for an administrator to activate your account.');
        } else if (error.status && error.status >= 400 && error.status < 500) {
          setError(error.message || 'Login failed. Please check your credentials.');
        } else {
          setError('Login failed. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10 animate-fade-in-up">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-extrabold gradient-header animate-fade-in-down">
            Michigan ESTA Tracker
          </h2>
          <p className="mt-3 text-base text-gray-700 dark:text-gray-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Earned Sick Time Act Compliance
          </p>
        </div>
        <div className="glass-card p-8 animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {verified && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 animate-fade-in border-l-4 border-green-500">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Email verified successfully! You can now sign in.
                </p>
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border-l-4 border-red-500 animate-shake">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input w-full pl-10"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
              <PasswordField
                id="password"
                value={password}
                onChange={setPassword}
                placeholder="Password"
                required
                autoComplete="current-password"
              />
            </div>

            <div>
              <LoadingButton
                type="submit"
                loading={loading}
                loadingText="Signing in..."
                variant="primary"
                className="w-full flex justify-center py-3"
              >
                Sign in
              </LoadingButton>
            </div>

            <div className="text-center">
              <a
                href="/register"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 hover:underline transition-all"
              >
                Don't have an account? Register
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
