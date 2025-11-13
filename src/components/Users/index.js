// src/components/Users/Index.js
import UserList from './UserList';
import UserItem from './UserItem';

// Hook for easy users management
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useFirebase } from '../firebase/context';

export const useUsers = (pageSize = 50) => {
  const { db } = useFirebase();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('email'), limit(pageSize));
        const snapshot = await getDocs(q);
        const loadedUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(loadedUsers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [db, pageSize]);

  return { users, loading, error };
};

// Default exports
export default { UserList, UserItem };

// Named exports
export { UserList, UserItem, useUsers };