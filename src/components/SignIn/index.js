// src/components/signin/index.js
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  TwitterAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { debounce } from 'lodash';
import { auth, db } from '../lib/firebase';
import { SignUpLink } from './SignUp';
import { PasswordForgetLink } from './PasswordForget';
import * as ROUTES from '../../constants/routes';

const ERROR_CODE_ACCOUNT_EXISTS = 'auth/account-exists-with-different-credential';
const ERROR_MSG_ACCOUNT_EXISTS = `An account with this email already exists via another provider. Try signing in with that method first.`;

const SignInPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to track your ESTA status</p>
          </div>
          <SignInForm navigate={navigate} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <SignInGoogle navigate={navigate} />
            <SignInFacebook navigate={navigate} />
            <SignInTwitter navigate={navigate} />
          </div>
          <div className="text-center space-y-2 text-sm">
            <PasswordForgetLink />
            <SignUpLink />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SignInForm = ({ navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isInvalid = password === '' || email === '';

  // Debounced validation for heavy traffic
  const debouncedValidation = useMemo(
    () =>
      debounce(() => {
        if (email && !email.includes('@')) {
          setError(new Error('Please enter a valid email'));
        } else {
          setError(null);
        }
      }, 500),
    [email]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Cache session for PWA offline
      localStorage.setItem('session', JSON.stringify({ email, timestamp: Date.now() }));
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup debounce
  useEffect(() => {
    return () => debouncedValidation.cancel();
  }, [debouncedValidation]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            debouncedValidation();
          }}
          placeholder="your@email.com"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isInvalid || loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing In...
          </span>
        ) : (
          'Sign In'
        )}
      </button>
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </div>
      )}
    </form>
  );
};

const SignInGoogle = ({ navigate }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const provider = new GoogleAuthProvider();

  const onClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: user.displayName || 'Anonymous',
        email: user.email,
        photoURL: user.photoURL,
        roles: {},
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      }, { merge: true });

      // Cache session
      localStorage.setItem('session', JSON.stringify({ email: user.email, timestamp: Date.now() }));

      navigate(ROUTES.HOME);
    } catch (err) {
      if (err.code === ERROR_CODE_ACCOUNT_EXISTS) {
        err.message = ERROR_MSG_ACCOUNT_EXISTS;
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 6.25c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </motion.button>
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </div>
      )}
    </>
  );
};

const SignInFacebook = ({ navigate }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const provider = new FacebookAuthProvider();

  const onClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, 'users', user.uid), {
        username: user.displayName || 'Facebook User',
        email: user.email,
        photoURL: user.photoURL,
        roles: {},
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      }, { merge: true });

      localStorage.setItem('session', JSON.stringify({ email: user.email, timestamp: Date.now() }));

      navigate(ROUTES.HOME);
    } catch (err) {
      if (err.code === ERROR_CODE_ACCOUNT_EXISTS) {
        err.message = ERROR_MSG_ACCOUNT_EXISTS;
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition font-medium disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with Facebook'}
      </motion.button>
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </div>
      )}
    </>
  );
};

const SignInTwitter = ({ navigate }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const provider = new TwitterAuthProvider();

  const onClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, 'users', user.uid), {
        username: user.displayName || 'Twitter User',
        email: user.email,
        photoURL: user.photoURL,
        roles: {},
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      }, { merge: true });

      localStorage.setItem('session', JSON.stringify({ email: user.email, timestamp: Date.now() }));

      navigate(ROUTES.HOME);
    } catch (err) {
      if (err.code === ERROR_CODE_ACCOUNT_EXISTS) {
        err.message = ERROR_MSG_ACCOUNT_EXISTS;
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with Twitter'}
      </motion.button>
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </div>
      )}
    </>
  );
};

export default SignInPage;

export { SignInForm, SignInGoogle, SignInFacebook, SignInTwitter };