// src/components/EmployeeDashboard.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { logWorkHours, getSickBalance, requestSickLeave } from '../services/firebase';
import { debounce } from 'lodash'; // Add to deps if not present

const ELITE_VALIDATION = {
  hoursMin: 0.25,
  hoursMax: 24,
  reasonMin: 10,
  reasonMax: 500,
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [hours, setHours] = useState('');
  const [balance, setBalance] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Debounced input for performance
  const debouncedSetHours = useCallback(debounce((value) => {
    setHours(value);
  }, 300), []);

  // Load balance
  useEffect(() => {
    if (user) {
      const loadBalance = async () => {
        try {
          const bal = await getSickBalance(user.uid);
          setBalance(bal);
        } catch (err) {
          setError('Failed to load balance. Retry?');
        }
      };
      loadBalance();
    }
  }, [user]);

  // Validation
  const isValidHours = useMemo(() => {
    const numHours = parseFloat(hours);
    return numHours >= ELITE_VALIDATION.hoursMin && numHours <= ELITE_VALIDATION.hoursMax;
  }, [hours]);

  const isValidReason = useMemo(() => {
    return reason.length >= ELITE_VALIDATION.reasonMin && reason.length <= ELITE_VALIDATION.reasonMax;
  }, [reason]);

  const isFormValid = isValidHours && isValidReason;

  const handleLogHours = async () => {
    if (!isValidHours) {
      setError('Hours must be between 0.25 and 24.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await logWorkHours(user.uid, parseFloat(hours));
      setSuccess('Hours logged successfully!');
      setHours('');
      // Reload balance
      const bal = await getSickBalance(user.uid);
      setBalance(bal);
    } catch (err) {
      setError(err.message || 'Logging failed. Retry?');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSickLeave = async () => {
    if (!isFormValid) {
      setError('Invalid form. Check hours and reason.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await requestSickLeave(user.uid, parseFloat(hours), reason);
      setSuccess('Sick leave requested! Approval pending.');
      setHours('');
      setReason('');
    } catch (err) {
      setError(err.message || 'Request failed. Retry?');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Employee Dashboard</h1>
          <p className="text-gray-600 mb-4">Please sign in to access.</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Employee Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Balance: <span className="font-semibold text-green-600 dark:text-green-400">{balance.toFixed(2)}</span> hours
            </p>
          </div>

          {/* Log Hours */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Log Work Hours
            </h3>
            <input
              type="number"
              step="0.25"
              min={ELITE_VALIDATION.hoursMin}
              max={ELITE_VALIDATION.hoursMax}
              value={hours}
              onChange={(e) => debouncedSetHours(e.target.value)}
              placeholder="Hours (e.g., 8.5)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleLogHours}
              disabled={loading || !isValidHours}
              className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Logging...' : 'Log Hours'}
            </button>
          </div>

          {/* Request Sick Leave */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Request Sick Leave
            </h3>
            <input
              type="number"
              step="0.25"
              min={ELITE_VALIDATION.hoursMin}
              max={balance}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Hours"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (min 10 chars)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none h-20"
              maxLength={ELITE_VALIDATION.reasonMax}
            />
            <button
              onClick={handleRequestSickLeave}
              disabled={loading || !isFormValid}
              className="w-full py-3 px-4 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Requesting...' : 'Request Sick Leave'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                {success}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;