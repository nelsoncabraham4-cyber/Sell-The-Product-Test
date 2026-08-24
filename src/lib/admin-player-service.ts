import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { getFirebaseDb } from '@/lib/firebase';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

export function getFriendlyAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is disabled in Firebase Console.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'PERMISSION_DENIED':
    case 'permission_denied':
      return 'Database permission denied. Ensure you are signed in with an admin account.';
    default:
      return error?.message || 'An unexpected error occurred.';
  }
}

/**
 * Creates a new Firebase Auth player account using an isolated secondary Firebase app.
 * This guarantees that the currently logged-in Admin's browser Auth session and token
 * remain 100% untouched and active.
 */
export async function createPlayerAccount(
  email: string,
  teamName: string,
  password: string
): Promise<{ uid: string }> {
  const secondaryAppName = `createPlayer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;

    // Immediately sign out and dispose the secondary app instance
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    // Use the primary database instance (authenticated with Admin session)
    const db = getFirebaseDb();
    const userRef = ref(db, `users/${uid}`);
    await set(userRef, {
      name: teamName,
      email: email,
      teamId: uid,
      isAdmin: false,
      createdAt: Date.now(),
    });

    return { uid };
  } catch (error) {
    try {
      await deleteApp(secondaryApp);
    } catch {
      // Ignore cleanup error
    }
    throw error;
  }
}
