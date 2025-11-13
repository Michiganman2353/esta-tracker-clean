// src/components/PasswordChange/index.js
import React, { useState } from 'react';
import { useFirebase } from '../firebase/context';

const INITIAL_STATE = {
  passwordOne: '',
  passwordTwo: '',
  error: null,
  loading: false,
};

const PasswordChangeForm = () => {
  const { doPasswordUpdate } = useFirebase();
  const [state, setState] = useState(INITIAL_STATE);
  const { passwordOne, passwordTwo, error, loading } = state;

  const isInvalid = passwordOne !== passwordTwo || passwordOne === '' || passwordOne.length < 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await doPasswordUpdate(passwordOne);
      setState(INITIAL_STATE);
      alert('Password updated successfully!');
    } catch (err) {
      setState((prev) => ({ ...prev, error: err, loading: false }));
    }
  };

  const handleChange = (e) => {
    setState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getStrength = () => {
    const length = passwordOne.length;
    if (length === 0) return { score: 0, label: '', color: '' };
    if (length < 8) return { score: 1, label: 'Weak', color: 'red' };
    if (length < 12) return { score: 2, label: 'Fair', color: 'yellow' };
    if (length < 16) return { score: 3, label: 'Good', color: 'lime' };
    return { score: 4, label: 'Strong', color: 'green' };
  };

  const { score, label, color } = getStrength();

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
        Change Password
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="passwordOne" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Password
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
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      score === 1 ? 'bg-red-500 w-1/4' :
                      score === 2 ? 'bg-yellow-500 w-2/4' :
                      score === 3 ? 'bg-lime-500 w-3/4' :
                      'bg-green-500 w-full'
                    }`}
                  />
                </div>
                <span className={`text-sm font-medium text-${color}-600 dark:text-${color}-400`}>
                  {label}
                </span>
              </div>
            </div>
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
              Updating...
            </span>
          ) : (
            'Update Password'
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error.message || 'An error occurred. Please try again.'}
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default PasswordChangeForm;