import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

const players = [
  { name: 'Player 1', email: 'player1@example.com', password: '123456' },
  { name: 'Player 2', email: 'player2@example.com', password: '654321' },
  { name: 'Player 3', email: 'player3@example.com', password: '112233' },
  { name: 'Player 4', email: 'player4@example.com', password: '445566' },
  { name: 'Player 5', email: 'player5@example.com', password: '121212' },
  { name: 'Player 6', email: 'player6@example.com', password: '212121' },
  { name: 'Player 7', email: 'player7@example.com', password: '102030' },
  { name: 'Player 8', email: 'player8@example.com', password: '111222' },
  { name: 'Player 9', email: 'player9@example.com', password: '987654' },
  { name: 'Player 10', email: 'player10@example.com', password: '456789' },
  { name: 'Player 11', email: 'player11@example.com', password: '123123' },
  { name: 'Player 12', email: 'player12@example.com', password: '654654' },
  { name: 'Player 13', email: 'player13@example.com', password: '000111' },
  { name: 'Player 14', email: 'player14@example.com', password: '123321' },
  { name: 'Player 15', email: 'player15@example.com', password: '987789' },
  { name: 'Player 16', email: 'player16@example.com', password: '555666' },
  { name: 'Player 17', email: 'player17@example.com', password: '101010' },
  { name: 'Player 18', email: 'player18@example.com', password: '202020' },
  { name: 'Player 19', email: 'player19@example.com', password: '135790' },
  { name: 'Player 20', email: 'player20@example.com', password: '246800' },
  { name: 'Player 21', email: 'player21@example.com', password: '998877' },
  { name: 'Player 22', email: 'player22@example.com', password: '543210' },
  { name: 'Player 23', email: 'player23@example.com', password: '010101' },
  { name: 'Player 24', email: 'player24@example.com', password: '112211' },
  { name: 'Player 25', email: 'player25@example.com', password: '789987' },
];

const fallbackKnownPasswords = [
  '123456',
  'tempPassword123',
  'password123',
  'password',
  '654321',
  '112233',
  '445566',
  '121212',
  '212121',
  '102030',
  '111222',
  '987654',
  '456789',
  '123123',
  '654654',
  '000111',
  '123321',
  '987789',
  '555666',
  '101010',
  '202020',
  '135790',
  '246800',
  '998877',
  '543210',
  '010101',
  '112211',
  '789987',
];

async function createOrUpdatePlayer(playerData: { name: string; email: string; password: string }) {
  const appName = `auth-worker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const workerApp = initializeApp(firebaseConfig, appName);
  const workerAuth = getAuth(workerApp);
  const db = getDatabase(workerApp);

  let uid: string | null = null;

  try {
    // 1. Try to create new user in Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(workerAuth, playerData.email, playerData.password);
      uid = cred.user.uid;
      await updateProfile(cred.user, { displayName: playerData.name });
      console.log(`[AUTH CREATED] ${playerData.name} (${playerData.email}) -> UID: ${uid}`);
    } catch (createErr: any) {
      if (createErr.code === 'auth/email-already-in-use') {
        console.log(`[AUTH EXISTS] ${playerData.email} already in Auth. Authenticating & updating password...`);

        // Try signing in with the target password first
        let signedInUser = null;
        try {
          const loginCred = await signInWithEmailAndPassword(workerAuth, playerData.email, playerData.password);
          signedInUser = loginCred.user;
        } catch {
          // Try known fallback passwords
          for (const fallbackPass of fallbackKnownPasswords) {
            try {
              const fallbackCred = await signInWithEmailAndPassword(workerAuth, playerData.email, fallbackPass);
              signedInUser = fallbackCred.user;
              await updatePassword(signedInUser, playerData.password);
              console.log(`[PASSWORD UPDATED] Set required password for ${playerData.email}`);
              break;
            } catch {
              // continue trying
            }
          }
        }

        if (!signedInUser) {
          throw new Error(`Could not authenticate existing account ${playerData.email} to reset password.`);
        }

        uid = signedInUser.uid;
        await updateProfile(signedInUser, { displayName: playerData.name });
      } else {
        throw createErr;
      }
    }

    if (!uid) {
      throw new Error(`Failed to resolve UID for ${playerData.email}`);
    }

    // 2. Preserve or set Database Record in RTDB
    const userRef = ref(db, `users/${uid}`);
    const existingSnap = await get(userRef);
    const existingData = existingSnap.exists() ? existingSnap.val() : {};

    // Keep existing custom team name if it was already set, otherwise default to "Player X"
    const finalTeamName = existingData.name && existingData.name.trim() !== '' ? existingData.name : playerData.name;
    const finalTeamId = existingData.teamId || uid;

    await set(userRef, {
      email: playerData.email,
      name: finalTeamName,
      teamId: finalTeamId,
      isAdmin: false,
      deleted: false,
    });

    console.log(`[DB SYNCED] users/${uid} -> Name: "${finalTeamName}", TeamId: "${finalTeamId}", isAdmin: false, deleted: false`);

    // 3. Final Verification: Sign in with the expected credentials
    await signOut(workerAuth);
    const verifyCred = await signInWithEmailAndPassword(workerAuth, playerData.email, playerData.password);
    if (verifyCred.user.uid === uid) {
      console.log(`[VERIFIED ✓] ${playerData.name} (${playerData.email}) login verified.`);
    }

    await signOut(workerAuth);
    await deleteApp(workerApp);
    return { success: true, name: playerData.name, email: playerData.email, uid };
  } catch (err: any) {
    try {
      await deleteApp(workerApp);
    } catch {}
    console.error(`[ERROR ✗] ${playerData.name} (${playerData.email}):`, err.message || err);
    return { success: false, name: playerData.name, email: playerData.email, error: err.message };
  }
}

async function run() {
  console.log('====================================================');
  console.log('CREATING & CONFIGURING 25 FIREBASE PLAYER ACCOUNTS');
  console.log('====================================================\n');

  const results: any[] = [];
  for (const p of players) {
    const result = await createOrUpdatePlayer(p);
    results.push(result);
  }

  console.log('\n====================================================');
  console.log('SUMMARY RESULTS:');
  console.log('====================================================');
  let successCount = 0;
  let failCount = 0;
  for (const r of results) {
    if (r.success) {
      successCount++;
      console.log(`✓ ${r.name.padEnd(12)} | ${r.email.padEnd(25)} | UID: ${r.uid}`);
    } else {
      failCount++;
      console.log(`✗ ${r.name.padEnd(12)} | ${r.email.padEnd(25)} | ERROR: ${r.error}`);
    }
  }

  console.log(`\nTotal: ${players.length} | Success: ${successCount} | Failed: ${failCount}`);
  if (failCount === 0) {
    console.log('\nAll 25 Player accounts are created, configured, and verified in Firebase Authentication & Realtime Database!');
  }
}

run().catch((err) => {
  console.error('Fatal error during setup:', err);
  process.exit(1);
});
