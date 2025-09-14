'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, updateProfile, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

type AuthInfo = {
  uid: string;
  type: 'user' | 'admin';
  name: string;
  needsTeamName: boolean;
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

  const processUser = useCallback((user: User | null) => {
    if (user) {
      const isAdmin = user.email?.toLowerCase() === 'admin@example.com';
      const name = user.displayName || 'Player';
      const needsTeamName = !user.displayName;

      setAuthInfo({ 
        uid: user.uid, 
        type: isAdmin ? 'admin' : 'user',
        name: name,
        needsTeamName: isAdmin ? false : needsTeamName,
      });
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
      // Re-process user to update context state
      processUser(user);
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
