const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const { getDatabase, ref, get } = require('firebase/database');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

console.log('Verifying client logins against project:', firebaseConfig.projectId);

const targetPlayers = [
  { email: 'testplayer1@example.com', password: 'Test@Player001' },
  { email: 'testplayer2@example.com', password: 'Test@Player002' },
  { email: 'testplayer3@example.com', password: 'Test@Player003' },
  { email: 'testplayer4@example.com', password: 'Test@Player004' },
  { email: 'testplayer5@example.com', password: 'Test@Player005' },
  { email: 'testplayer6@example.com', password: 'Test@Player006' },
  { email: 'testplayer7@example.com', password: 'Test@Player007' },
  { email: 'testplayer8@example.com', password: 'Test@Player008' },
  { email: 'testplayer9@example.com', password: 'Test@Player009' },
  { email: 'testplayer10@example.com', password: 'Test@Player010' },
  { email: 'testplayer11@example.com', password: 'Test@Player011' },
  { email: 'testplayer12@example.com', password: 'Test@Player012' },
  { email: 'testplayer13@example.com', password: 'Test@Player013' },
  { email: 'testplayer14@example.com', password: 'Test@Player014' },
  { email: 'testplayer15@example.com', password: 'Test@Player015' },
  { email: 'testplayer16@example.com', password: 'Test@Player016' },
  { email: 'testplayer17@example.com', password: 'Test@Player017' },
  { email: 'testplayer18@example.com', password: 'Test@Player018' },
  { email: 'testplayer19@example.com', password: 'Test@Player019' },
  { email: 'testplayer20@example.com', password: 'Test@Player020' },
];

async function verifyPlayer(p) {
  const app = initializeApp(firebaseConfig, `verify-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const auth = getAuth(app);
  const db = getDatabase(app);

  try {
    const cred = await signInWithEmailAndPassword(auth, p.email, p.password);
    const uid = cred.user.uid;

    const snap = await get(ref(db, `users/${uid}`));
    const rtdbData = snap.exists() ? snap.val() : null;

    await signOut(auth);
    await deleteApp(app);

    return {
      success: true,
      email: p.email,
      uid,
      rtdbData,
    };
  } catch (err) {
    try { await deleteApp(app); } catch {}
    return {
      success: false,
      email: p.email,
      error: err.code || err.message,
    };
  }
}

async function run() {
  let passed = 0;
  let failed = 0;

  for (const player of targetPlayers) {
    const result = await verifyPlayer(player);
    if (result.success && result.rtdbData && result.rtdbData.isAdmin === false) {
      passed++;
      console.log(`✓ LOGIN OK: ${result.email.padEnd(25)} | UID: ${result.uid} | RTDB Name: "${result.rtdbData.name}" | isAdmin: ${result.rtdbData.isAdmin}`);
    } else {
      failed++;
      console.error(`✗ LOGIN FAILED: ${player.email} | Error: ${result.error || 'Invalid RTDB data'}`);
    }
  }

  console.log('----------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed out of ${targetPlayers.length}`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Run failed:', err);
  process.exit(1);
});
