import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PDFDownloadLink, Document, Page, Text, View } from '@react-pdf/renderer';
import { useAuth } from '../Session';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { debounce } from 'lodash';

const ELITE_VALIDATION = {
  hoursMin: 0.25,
  hoursMax: 24,
  reasonMin: 10,
  reasonMax: 500,
  accrualRate: 1 / 30, // MI ESTA: 1hr sick time per 30hr worked
  maxAccrual: 40, // Annual cap
  maxRollover: 40, // Carryover max
};

export default function EmployeeDashboard() {
  const { authUser, loading: authLoading } = useAuth();
  const [hours, setHours] = useState('');
  const [balance, setBalance] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [offlineQueue, setOfflineQueue] = useState([]);

  // Debounced input for performance
  const debouncedSetHours = useCallback(debounce((value) => setHours(value), 300), []);

  // Firebase helper functions
  const getSickBalance = async (uid) => {
    const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
    if (!userDoc.empty) {
      return userDoc.docs[0].data().sickBalance || 0;
    }
    return 0;
  };

  const logWorkHours = async (uid, hours) => {
    await addDoc(collection(db, 'workHours'), {
      uid,
      hours,
      timestamp: serverTimestamp(),
    });
  };

  const requestSickLeave = async (uid, hours, reason) => {
    await addDoc(collection(db, 'sickRequests'), {
      uid,
      hours,
      reason,
      status: 'pending',
      timestamp: serverTimestamp(),
    });
  };

  // Authentication check
  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Employee Dashboard</h1>
          <p className="text-gray-600 mb-4">Please sign in to access sick time tracking.</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Load balance (with offline fallback)
  useEffect(() => {
    if (authUser) {
      const loadBalance = async () => {
        try {
          const bal = await getSickBalance(authUser.uid);
          setBalance(bal);
          localStorage.setItem('sickBalance', bal.toString());
        } catch (err) {
          if (navigator.onLine) {
            setError('Failed to load sick time balance. Retry?');
          } else {
            const cached = localStorage.getItem('sickBalance');
            if (cached) setBalance(parseFloat(cached));
          }
        }
      };
      loadBalance();

      // Auto-refresh every 5min (accrual updates)
      const interval = setInterval(loadBalance, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [authUser]);

  // Validation
  const isValidHours = useMemo(() => {
    const numHours = parseFloat(hours);
    return numHours >= ELITE_VALIDATION.hoursMin && numHours <= ELITE_VALIDATION.hoursMax;
  }, [hours]);

  const isValidReason = useMemo(() => {
    return reason.length >= ELITE_VALIDATION.reasonMin && reason.length <= ELITE_VALIDATION.reasonMax;
  }, [reason]);

  const isFormValid = isValidHours && isValidReason;

  // Accrual calc (MI ESTA: 1hr/30hr worked)
  const accrualEarned = useMemo(() => {
    // Assume weekly worked hours from localStorage or API
    const workedHours = parseFloat(localStorage.getItem('weeklyWorked') || '0');
    return Math.min(ELITE_VALIDATION.maxAccrual, workedHours * ELITE_VALIDATION.accrualRate);
  }, []);

  // Offline queue sync
  useEffect(() => {
    if (navigator.onLine && authUser) {
      offlineQueue.forEach(async (req) => {
        if (req.type === 'log') await logWorkHours(authUser.uid, req.hours);
        if (req.type === 'request') await requestSickLeave(authUser.uid, req.hours, req.reason);
      });
      setOfflineQueue([]);
    }
  }, [navigator.onLine, authUser, offlineQueue]);

  const handleLogHours = async () => {
    if (!isValidHours) {
      setError('Hours must be between 0.25 and 24.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await logWorkHours(authUser.uid, parseFloat(hours));
      setSuccess('Hours logged – accrual updated!');
      setHours('');
      const bal = await getSickBalance(authUser.uid);
      setBalance(bal);
      localStorage.setItem('sickBalance', bal.toString());
      localStorage.setItem('weeklyWorked', (parseFloat(localStorage.getItem('weeklyWorked') || '0') + parseFloat(hours)).toString());
    } catch (err) {
      if (navigator.onLine) {
        setError(err.message || 'Logging failed. Retry?');
      } else {
        setOfflineQueue((prev) => [...prev, { type: 'log', hours: parseFloat(hours) }]);
        setSuccess('Queued offline – will sync when back online.');
      }
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
      await requestSickLeave(authUser.uid, parseFloat(hours), reason);
      setSuccess('Sick leave requested! Approval pending under MI ESTA.');
      setHours('');
      setReason('');
    } catch (err) {
      if (navigator.onLine) {
        setError(err.message || 'Request failed. Retry?');
      } else {
        setOfflineQueue((prev) => [...prev, { type: 'request', hours: parseFloat(hours), reason }]);
        setSuccess('Queued offline – will sync when back online.');
      }
    } finally {
      setLoading(false);
    }
  };

  // PDF Report (MI ESTA compliance – print/paystub)
  const SickLeaveReport = () => (
    <PDFDownloadLink document={<LeavePDF balance={balance} accrual={accrualEarned} />} fileName="esta-sick-time-report.pdf">
      {({ loading }) => (
        <button
          disabled={loading}
          className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
          aria-label="Download ESTA sick time report (MI compliance)"
        >
          {loading ? 'Generating PDF...' : 'Download ESTA Report'}
        </button>
      )}
    </PDFDownloadLink>
  );

  const LeavePDF = ({ balance, accrual }) => (
    <Document>
      <Page size="A4" style={{ padding: 40 }}>
        <View style={{ textAlign: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>ESTA Sick Time Report</Text>
          <Text style={{ fontSize: 12, marginTop: 5 }}>Michigan Earned Sick Time Act Compliance</Text>
        </View>
        <View style={{ marginBottom: 10 }}>
          <Text>Employee: {authUser.email}</Text>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
        </View>
        <View style={{ marginBottom: 10 }}>
          <Text>Current Balance: {balance.toFixed(2)} hours</Text>
          <Text>Accrual This Period: {accrual.toFixed(2)} hours (1:30 rate)</Text>
          <Text>Max Annual: {ELITE_VALIDATION.maxAccrual} hours | Max Rollover: {ELITE_VALIDATION.maxRollover} hours</Text>
        </View>
        <Text style={{ fontSize: 10, marginTop: 20 }}>Generated by ESTA Tracker – For internal use only.</Text>
      </Page>
    </Document>
  );

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
              ESTA Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sick Time Balance: <span className="font-semibold text-green-600 dark:text-green-400">{balance.toFixed(2)}</span> hours
              <br />
              Accrual Earned: <span className="font-semibold text-blue-600 dark:text-blue-400">{accrualEarned.toFixed(2)}</span> hours (1:30 rate)
            </p>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Log Hours Worked</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => debouncedSetHours(e.target.value)}
              placeholder="Hours worked"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              disabled={loading}
            />
            <button onClick={handleLogHours} className="w-full p-3 mt-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={loading || !isValidHours}>
              {loading ? 'Logging...' : 'Log Hours'}
            </button>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Request Sick Leave</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => debouncedSetHours(e.target.value)}
              placeholder="Hours requested"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              disabled={loading}
            />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for request"
              className="w-full p-3 mt-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              disabled={loading}
            />
            <button onClick={handleRequestSickLeave} className="w-full p-3 mt-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50" disabled={loading || !isFormValid}>
              {loading ? 'Requesting...' : 'Request Sick Leave'}
            </button>
          </div>

          <SickLeaveReport />

          {success && <p className="text-green-600 mt-4">{success}</p>}
          {error && <p className="text-red-600 mt-4">{error}</p>}
        </motion.div>
      </div>
    </div>
  );
}