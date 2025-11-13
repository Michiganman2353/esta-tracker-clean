// src/components/signup/index.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFirebase } from '../firebase/context';
import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';

const SignUpPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join ESTA Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your account to track ESTA status in real-time.
          </p>
        </motion.div>
        <SignUpForm />
        <SignUpLink />
      </div>
    </div>
  </div>
);

const SignUpForm = () => {
  const { doCreateUserWithEmailAndPassword, doSendEmailVerification, db } = useFirebase();
  const [state, setState] = useState({
    username: '',
    email: '',
    passwordOne: '',
    passwordTwo: '',
    isAdmin: false,
    loading: false,
    error: null,
    success: null,
  });
  const { username, email, passwordOne, passwordTwo, isAdmin, loading, error, success } = state;

  const isInvalid =
    passwordOne !== passwordTwo ||
    passwordOne.length < 8 ||
    email === '' ||
    username === '';

  const passwordStrength = passwordOne.length < 8 ? 'Weak' : passwordOne.length < 12 ? 'Fair' : 'Strong';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, loading: true, error: null, success: null }));

    try {
      const authUser = await doCreateUserWithEmailAndPassword(email, passwordOne);
      const roles = {};
      if (isAdmin) roles[ROLES.ADMIN] = ROLES.ADMIN;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', authUser.user.uid), {
        username,
        email,
        roles,
        createdAt: serverTimestamp(),
      });

      await doSendEmailVerification();
      setState((prev) => ({ ...prev, loading: false, success: 'Account created! Check your email for verification.' }));
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        err.message = 'An account with this email already exists. Try signing in instead.';
      }
      setState((prev) => ({ ...prev, loading: false, error: err }));
    }
  };

  const handleChange = (e) => {
    setState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckbox = (e) => {
    setState((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full Name
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={handleChange}
          placeholder="John Doe"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
          minLength={2}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={handleChange}
          placeholder="john@example.com"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label htmlFor="passwordOne" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="passwordOne"
          name="passwordOne"
          type="password"
          value={passwordOne}
          onChange={handleChange}
          placeholder="At least 8 characters"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
          minLength={8}
        />
        {passwordOne && (
          <p className={`mt-1 text-sm ${
            passwordStrength === 'Weak' ? 'text-red-600 dark:text-red-400' :
            passwordStrength === 'Fair' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            {passwordStrength} ({passwordOne.length}/8+ chars)
          </p>
        )}
      </div>

      <div>
        <label htmlFor="passwordTwo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          id="passwordTwo"
          name="passwordTwo"
          type="password"
          value={passwordTwo}
          onChange={handleChange}
          placeholder="Repeat password"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          required
        />
        {passwordOne && passwordTwo && passwordOne !== passwordTwo && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            Passwords do not match
          </p>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="isAdmin"
          name="isAdmin"
          type="checkbox"
          checked={isAdmin}
          onChange={handleCheckbox}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isAdmin" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Admin Access (for testing only)
        </label>
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
            Creating Account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.message || 'An error occurred. Please try again.'}
          </p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">
            {success}
          </p>
        </div>
      )}
    </form>
  );
};

const SignUpLink = () => (
  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
    Already have an account? <Link to={ROUTES.SIGN_IN} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition">Sign In</Link>
  </p>
);

export default SignUpPage;

export { SignUpForm, SignUpLink };