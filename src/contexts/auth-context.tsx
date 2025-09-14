'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase';

type AuthInfo = {
  uid: string;
  type: 'user' | 'admin';
  name: string;
};

interface AuthContextType {
  auth: AuthInfo | null;
  isLoading: boolean;
  login: (info: AuthInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user: User | null) => {
      if (user) {
        // This is a simplified way to determine admin.
        // In a real app, you'd use custom claims or check a database role.
        const isAdmin = user.email === 'admin@example.com';
        const name = isAdmin ? 'Admin' : (user.displayName || 'User');
        
        setAuth({ 
          uid: user.uid, 
          type: isAdmin ? 'admin' : 'user',
          name: name
        });
      } else {
        setAuth(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (info: AuthInfo) => {
    setAuth(info);
    // Redirects are now handled in the login pages
  };

  const logout = () => {
    signOut(firebaseAuth).then(() => {
      setAuth(null);
      router.push('/');
    });
  };

  return (
    <AuthContext.Provider value={{ auth, isLoading, login, logout }}>
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
