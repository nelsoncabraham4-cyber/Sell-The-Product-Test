'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

type AuthInfo = {
  uid: string;
  type: 'user' | 'admin';
  name: string;
};

interface AuthContextType {
  auth: AuthInfo | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        // This is a simplified way to determine admin.
        // In a real app, you'd use custom claims or check a database role.
        const isAdmin = user.email?.toLowerCase() === 'admin@example.com';
        const name = isAdmin ? 'Admin' : (user.displayName || 'User');
        
        setAuthInfo({ 
          uid: user.uid, 
          type: isAdmin ? 'admin' : 'user',
          name: name
        });
      } else {
        setAuthInfo(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = () => {
    const auth = getFirebaseAuth();
    signOut(auth).then(() => {
      setAuthInfo(null);
      router.push('/');
    });
  };

  return (
    <AuthContext.Provider value={{ auth: authInfo, isLoading, logout }}>
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
