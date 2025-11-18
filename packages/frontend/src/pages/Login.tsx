import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { signIn } from '../lib/authService';
import { isFirebaseConfigured } from '../lib/firebase';
import { apiClient } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const verified = searchParams.get('verified') === 'true';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isFirebaseConfigured) {
        // Use Firebase authentication
        await signIn(email, password);
        // AuthContext will handle the navigation
        navigate('/');
      } else {
        // Fallback to existing API for local development
        const response = await apiClient.login(email, password);
        apiClient.setToken(response.token);
        navigate('/');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Michigan ESTA Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Earned Sick Time Act Compliance
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {verified && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Email verified successfully! You can now sign in.
              </p>
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input appearance-none rounded-none relative block w-full rounded-t-md"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input appearance-none rounded-none relative block w-full rounded-b-md"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary group relative w-full flex justify-center py-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/register"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Don't have an account? Register
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
