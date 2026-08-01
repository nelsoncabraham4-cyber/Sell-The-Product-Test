'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, updateProfile, type User } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';

type AuthInfo = {
  uid: string;
  type: 'user' | 'admin';
  name: string | null;
  email: string | null;
  teamId: string | null;
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
      console.log('[processUser] start - email:', user.email, 'uid:', user.uid);
      // For all users, the Realtime Database is the source of truth for admin status and team info.
      const db = getFirebaseDb();
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      console.log('[processUser] snapshot exists?', snapshot.exists(), 'data:', snapshot.val());

        let isAdmin = false;
        let teamName: string | null = null;
        let teamId: string | null = null;

        // Check if user record exists in DB
        if (snapshot.exists()) {
          const userData = snapshot.val();
          isAdmin = userData.isAdmin === true;
          teamName = userData.name || null;
          teamId = userData.teamId || user.uid;
          // ----- Admin promotion check -----
          const adminEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
          console.log('[processUser] adminEnv from env:', adminEnv);
          const adminEmails = adminEnv
            ? adminEnv.split(',').map(e => e.trim().toLowerCase()).filter(e => e)
            : ['admin@example.com'];
          console.log('[processUser] parsed admin email list:', adminEmails);
          const emailMatch = user.email && adminEmails.includes(user.email.toLowerCase());
          console.log('[processUser] does logged‑in email match admin list?', emailMatch);
          if (emailMatch && userData.isAdmin !== true) {
            console.log('[processUser] promotion write – old isAdmin:', userData.isAdmin, 'new isAdmin: true', 'reason: email matches admin list');
            await set(userRef, { ...userData, isAdmin: true });
            isAdmin = true;
          } else {
            console.log('[processUser] no admin promotion needed – old isAdmin:', userData.isAdmin);
          }
          // -----------------------------------

        } else {
          // User record doesn't exist in DB - create it
          // Check for admin based on email
          const adminEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
          const adminEmails = adminEnv
            ? adminEnv.split(',').map(e => e.trim().toLowerCase()).filter(e => e)
            : ['admin@example.com'];
          isAdmin = user.email ? adminEmails.includes(user.email.toLowerCase()) : false;
          teamName = user.displayName;
          teamId = user.uid;

          // Create the database record so future logins use DB as source of truth
          console.log('[processUser] creating new user record – old isAdmin: N/A, new isAdmin:', isAdmin, 'reason: first login or missing DB record');
          await set(userRef, {
            name: teamName,
            email: user.email,
            teamId: teamId,
            isAdmin: isAdmin,
          });
        }

        setAuthInfo({
          uid: user.uid,
          type: isAdmin ? 'admin' : 'user',
          name: teamName,
          email: user.email,
          teamId: teamId,
        });
        console.log('[processUser] setAuthInfo:', {
          uid: user.uid,
          type: isAdmin ? 'admin' : 'user',
          name: teamName,
          email: user.email,
          teamId: teamId,
          isAdminRaw: isAdmin,
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
      // Update the user's profile in Firebase Auth.
      // This is what the user sees initially.
      await updateProfile(user, { displayName: teamName });

      // Also save/update user info in the Realtime Database.
      // This is the source of truth for the admin panel and for name updates.
      const db = getFirebaseDb();
      const userRef = ref(db, 'users/' + user.uid);
      const snapshot = await get(userRef);

      // Preserve existing teamId and isAdmin if they exist
      const existingData = snapshot.exists() ? snapshot.val() : {};
      const teamId = existingData.teamId || user.uid; // Use UID as teamId if not set
      const isAdmin = existingData.isAdmin === true;
      // Log before writing back to DB
      console.log('[setTeamName] updating user record – old isAdmin:', existingData.isAdmin, 'new isAdmin:', isAdmin, 'reason: preserve existing admin status');
      await set(userRef, {
        name: teamName,
        email: user.email,
        teamId: teamId,
        isAdmin: isAdmin,
      });

      // After updating, re-process the user to update the context state immediately.
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
