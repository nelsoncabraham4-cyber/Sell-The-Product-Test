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

  const processUser = useCallback(async (user: User | null) => {
    if (user) {
      // Force a reload of the user's profile data from Firebase
      await user.reload(); 
      const freshUser = getFirebaseAuth().currentUser;

      if (freshUser) {
        const isAdmin = freshUser.email?.toLowerCase() === 'admin@example.com';
        const name = freshUser.displayName || 'Player';
        const needsTeamName = !freshUser.displayName;

        setAuthInfo({ 
          uid: freshUser.uid, 
          type: isAdmin ? 'admin' : 'user',
          name: name,
          needsTeamName: isAdmin ? false : needsTeamName,
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
      // Re-process user to update context state after setting the name
      await processUser(user);
    } else {
        throw new Error("User not found");
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
