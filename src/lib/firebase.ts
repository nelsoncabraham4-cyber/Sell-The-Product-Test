import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// ഇത് Test Firebase project ആണോ എന്ന് Console-ൽ കാണാൻ
console.log("🔥 Firebase Project:", firebaseConfig.projectId);
console.log("🔥 Firebase Auth Domain:", firebaseConfig.authDomain);

let appInstance: ReturnType<typeof initializeApp> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: ReturnType<typeof getDatabase> | null = null;
let storageInstance: ReturnType<typeof getStorage> | null = null;

function getFirebaseApp() {
  if (!appInstance) {
    appInstance =
      !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }

  return appInstance;
}

export function getFirebaseAuth() {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }

  return authInstance;
}

export function getFirebaseDb() {
  if (!dbInstance) {
    dbInstance = getDatabase(getFirebaseApp());
  }

  return dbInstance;
}

export function getFirebaseStorage() {
  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseApp());
  }

  return storageInstance;
}