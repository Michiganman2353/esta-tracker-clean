// src/components/account/index.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  linkWithPopup,
  unlink,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { PasswordForgetForm } from '../PasswordForget';
import PasswordChangeForm from '../PasswordChange';
import { AuthUserContext } from '../Session';

const SIGN_IN_METHODS = [
  { id: 'password', provider: null, name: 'Email/Password' },
  { id: 'google.com', provider: GoogleAuthProvider, name: 'Google' },
  { id: 'facebook.com', provider: FacebookAuthProvider, name: 'Facebook' },
  { id: 'twitter.com', provider: TwitterAuthProvider, name: 'Twitter' },
];

const AccountPage = () => {
  const authUser = useContext(AuthUserContext);
  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Account: {authUser.email}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your login methods and security
            </p>
          </div>

          <div className="space-y-6">
            <PasswordForgetForm />
            <PasswordChangeForm />
            <LoginManagement authUser={authUser} />
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginManagement = ({ authUser }) => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const result = await auth.fetchSignInMethodsForEmail(authUser.email);
        setMethods(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMethods();
  }, [authUser.email]);

  const handleLink = async (provider) => {
    setError('');
    try {
      if (provider) {
        const providerInstance = new provider();
        await linkWithPopup(auth.currentUser, providerInstance);
      } else {
        // Email link requires password
        const password = prompt('Enter your password to link email:');
        if (!password) return;
        const credential = EmailAuthProvider.credential(authUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      const result = await auth.fetchSignInMethodsForEmail(authUser.email);
      setMethods(result);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnlink = async (providerId) => {
    setError('');
    try {
      await unlink(auth.currentUser, providerId);
      const result = await auth.fetchSignInMethodsForEmail(authUser.email);
      setMethods(result);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Login Methods
      </h2>
      <ul className="space-y-3">
        {SIGN_IN_METHODS.map((method) => {
          const isEnabled = methods.includes(method.id);
          const onlyOneLeft = methods.length === 1;

          return (
            <li
              key={method.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {method.name}
              </span>
              {isEnabled ? (
                <button
                  onClick={() => handleUnlink(method.id)}
                  disabled={onlyOneLeft}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label={`Unlink ${method.name}`}
                >
                  {onlyOneLeft ? 'Required' : 'Unlink'}
                </button>
              ) : (
                <button
                  onClick={() => handleLink(method.provider)}
                  className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition"
                  aria-label={`Link ${method.name}`}
                >
                  Link
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
};

export default AccountPage;