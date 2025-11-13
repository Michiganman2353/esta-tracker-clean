// src/components/users/userItem.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '../firebase/context';

const UserItem = ({ userId }) => {
  const { doPasswordReset, db } = useFirebase();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError('');

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUser(snapshot.data());
        } else {
          setError('User not found');
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, db]);

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setError('No email available for reset');
      return;
    }

    setResetLoading(true);
    setError('');
    try {
      await doPasswordReset(user.email);
      alert('Password reset email sent!');
    } catch (err) {
      setError(err.message || 'Reset failed. Try again.');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 dark:text-red-400 text-lg mb-4">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          User Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          ID: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
            {user.uid}
          </code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label className="font-semibold text-gray-700 dark:text-gray-300">
            Email
          </label>
          <p className="text-lg text-gray-900 dark:text-gray-100">
            {user.email}
          </p>
        </div>

        <div className="space-y-2">
          <label className="font-semibold text-gray-700 dark:text-gray-300">
            Username
          </label>
          <p className="text-lg text-gray-900 dark:text-gray-100">
            {user.username || 'Not set'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-semibold text-gray-700 dark:text-gray-300">
          Roles
        </label>
        <ul className="list-disc list-inside space-y-1">
          {Object.keys(user.roles || {}).map((role) => (
            <li key={role} className="text-gray-900 dark:text-gray-100">
              {role}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={handlePasswordReset}
          disabled={resetLoading}
          className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {resetLoading ? 'Sending...' : 'Send Password Reset'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default UserItem;