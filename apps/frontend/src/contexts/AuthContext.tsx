import { createContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserData(firebaseUser: FirebaseUser) {
    if (!db) {
      console.warn('Firestore not configured, skipping user data fetch');
      return null;
    }

    try {
      console.log('Fetching user data for:', firebaseUser.uid);
      
      // Force token refresh to get updated custom claims
      await firebaseUser.getIdToken(true);
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as User;
        
        console.log('User data fetched:', {
          uid: data.id,
          email: data.email,
          role: data.role,
          status: data.status,
        });
        
        // Ensure user data is current by merging with any updates
        if (data.status === 'pending') {
          console.warn('User status is still pending - this may block access');
        }
        
        return data;
      } else {
        console.error('User document not found in Firestore for uid:', firebaseUser.uid);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      const err = error as { code?: string; message?: string };
      
      // Provide more specific error logging
      if (err.code === 'permission-denied') {
        console.error('Permission denied - user may not have access to their own document');
      } else if (err.code === 'unavailable') {
        console.error('Firestore unavailable - check network connection');
      }
      
      return null;
    }
  }

  async function refreshUserData() {
    if (currentUser) {
      try {
        console.log('Refreshing user data...');
        // Force token refresh to get updated custom claims
        await currentUser.getIdToken(true);
        
        const data = await fetchUserData(currentUser);
        setUserData(data);
        console.log('User data refreshed successfully');
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  }

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase Auth not configured');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user data from Firestore
        const data = await fetchUserData(user);
        setUserData(data);
        
        // Log for debugging
        console.log('Auth state changed:', {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          userData: data,
        });
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signOut() {
    if (!auth) {
      throw new Error('Firebase Auth not configured');
    }
    await firebaseSignOut(auth);
    setUserData(null);
  }

  const value = {
    currentUser,
    userData,
    loading,
    signOut,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
