'use client';

import React, { createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';

type AuthInfo = {
  type: 'user' | 'admin';
  name: string;
};

interface AuthContextType {
  auth: AuthInfo | null;
  login: (info: AuthInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useLocalStorage<AuthInfo | null>('auth', null);
  const router = useRouter();

  const login = (info: AuthInfo) => {
    setAuth(info);
    if (info.type === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    setAuth(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
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
