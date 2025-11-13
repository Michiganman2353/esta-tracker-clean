// src/components/signout/index.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFirebase } from '../firebase/context';

const SignOutButton = ({ className = '' }) => {
  const { doSignOut } = useFirebase();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await doSignOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className={`px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition ${className}`}
        aria-label="Sign out of account"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing out...
          </span>
        ) : (
          'Sign Out'
        )}
      </motion.button>

      {/* Confirmation Dialog */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: confirmOpen ? 1 : 0 }}
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${confirmOpen ? '' : 'hidden'}`}
        onClick={() => setConfirmOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Confirm Sign Out
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default SignOutButton;