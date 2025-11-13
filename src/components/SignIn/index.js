import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  TwitterAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; // Pro SDK
import { SignUpLink } from './SignUp';
import { PasswordForgetLink } from './PasswordForget';
import * as ROUTES from '../../constants/routes';

const ERROR_CODE_ACCOUNT_EXISTS = 'auth/account-exists-with-different-credential';
const ERROR_MSG_ACCOUNT_EXISTS = `An account with this email already exists via another provider. Try signing in with that method first.`;

const SignInPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to track your ESTA status</p>
        </div>
        <SignInForm />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <SignInGoogle />
          <SignInFacebook />
          <SignInTwitter />
        </div>
        <div className="text-center space-y-2 text-sm">
          <PasswordForgetLink />
          <SignUpLink />
        </div>
      </div>
    </div>
  </div>
);

const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isInvalid = password === '' || email === '';

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="Email Address"
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        required
      />
      <input
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        required
      />
      <button
        disabled={isInvalid || loading}
        type="submit"
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition duration-200 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error.message}
        </p>
      )}
    </form>
  );
};

const SignInGoogle = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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
      <button
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
      </button>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error.message}
        </p>
      )}
    </>
  );
};

const SignInFacebook = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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
      <button
        onClick={onClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition font-medium disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with Facebook'}
      </button>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error.message}
        </p>
      )}
    </>
  );
};

const SignInTwitter = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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
      <button
        onClick={onClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with Twitter'}
      </button>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error.message}
        </p>
      )}
    </>
  );
};

export default SignInPage;

export { SignInForm, SignInGoogle, SignInFacebook, SignInTwitter };