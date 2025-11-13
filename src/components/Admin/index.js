// src/components/admin/index.js
import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthUserContext } from '../Session';
import { UserList } from '../Users/UserList';
import { UserItem } from '../Users/UserItem';
import * as ROLES from '../../constants/roles';
import * as ROUTES from '../../constants/routes';

const AdminPage = () => {
  const authUser = useContext(AuthUserContext);
  
  if (!authUser || !authUser.roles?.[ROLES.ADMIN]) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage users and system settings
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            <Routes>
              <Route path={ROUTES.ADMIN_DETAILS} element={<UserItem />} />
              <Route path={ROUTES.ADMIN} element={<UserList />} />
              <Route path="*" element={<Navigate to={ROUTES.ADMIN} replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;