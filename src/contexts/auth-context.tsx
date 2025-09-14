'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, updateProfile, type User } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

type AuthInfo = {
  uid: string;
  type: 'user' | 'admin';
  name: string | null;
  email: string | null;
};

interface AuthContextType {
  auth: AuthInfo | null;
  isLoading: boolean;
  logout: () => void;
  setTeamName: (teamName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const processUser = useCallback(async (user: User | null) => {
    if (user) {
        // It's important to get the fresh user data, including displayName
        await user.reload(); 
        const freshUser = getFirebaseAuth().currentUser;

        if (freshUser) {
            const isAdmin = freshUser.email?.toLowerCase() === 'admin@example.com';
            setAuthInfo({ 
                uid: freshUser.uid, 
                type: isAdmin ? 'admin' : 'user',
                name: freshUser.displayName, // This will be null for new users
                email: freshUser.email
            });
        } else {
            setAuthInfo(null);
        }
    } else {
      setAuthInfo(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, processUser);
    return () => unsubscribe();
  }, [processUser]);

  const logout = () => {
    const auth = getFirebaseAuth();
    signOut(auth).then(() => {
      setAuthInfo(null);
      router.push('/');
    });
  };

  const setTeamName = async (teamName: string) => {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { displayName: teamName });

      // Also save user info to the Realtime Database for admin viewing
      const db = getFirebaseDb();
      const userRef = ref(db, 'users/' + user.uid);
      await set(userRef, {
        name: teamName,
        email: user.email,
      });

      // After updating, re-process the user to update the context state
      await processUser(user); 
    } else {
      throw new Error("User not found. You must be logged in to set a team name.");
    }
  };

  return (
    <AuthContext.Provider value={{ auth: authInfo, isLoading, logout, setTeamName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
