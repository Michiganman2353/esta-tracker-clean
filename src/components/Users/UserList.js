// src/components/User/userList.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { useFirebase } from '../firebase/context';
import * as ROUTES from '../../constants/routes';

const PAGE_SIZE = 50;
const ITEM_HEIGHT = 80;

const UserList = () => {
  const { db } = useFirebase();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const listRef = useRef(null);
  const infiniteLoaderRef = useRef(null);

  // Load initial users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (next = false) => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError('');

    try {
      const usersRef = collection(db, 'users');
      let q = query(usersRef, orderBy('email'), limit(PAGE_SIZE));

      if (next && lastDoc) {
        q = query(usersRef, orderBy('email'), startAfter(lastDoc), limit(PAGE_SIZE));
      }

      const snapshot = await getDocs(q);
      const newUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(next ? [...users, ...newUsers] : newUsers);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message || 'Failed to load users. Retry?');
    } finally {
      setLoadingMore(false);
      setLoading(false);
    }
  };

  const isItemLoaded = (index) => !!users[index];

  const loadMoreItems = useCallback(async (startIndex, stopIndex) => {
    await loadUsers(true);
  }, [users, lastDoc, hasMore]);

  const UserRow = ({ index, style }) => {
    const user = users[index];
    if (!user) {
      return (
        <div style={style} className="p-4 animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      );
    }

    return (
      <div style={style} className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {user.username || user.email.split('@')[0]}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
          <Link
            to={`${ROUTES.ADMIN}/${user.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            Details
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Loading users...
          </p>
        </div>
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
          onClick={() => loadUsers()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No users yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Users will appear here once they sign up.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Users ({users.length})
        </h2>
      </div>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={hasMore ? users.length + 1 : users.length}
        loadMoreItems={loadMoreItems}
        ref={infiniteLoaderRef}
      >
        {({ onItemsRendered, ref }) => (
          <List
            height={600}
            itemCount={hasMore ? users.length + 1 : users.length}
            itemSize={ITEM_HEIGHT}
            onItemsRendered={onItemsRendered}
            ref={ref}
            className="scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
          >
            {UserRow}
          </List>
        )}
      </InfiniteLoader>
      {loadingMore && (
        <div className="p-4 text-center">
          <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full inline-block"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading more...</span>
        </div>
      )}
      {!hasMore && users.length > 0 && (
        <div className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            All users loaded
          </p>
        </div>
      )}
    </div>
  );
};

export default UserList;