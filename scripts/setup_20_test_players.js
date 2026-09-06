const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local to confirm environment configuration
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
console.log('----------------------------------------------------');
console.log('Target Project ID from .env.local:', projectId);
if (projectId !== 'sell-the-product-test') {
  console.error('CRITICAL SAFETY CHECK FAILED: Project ID is NOT sell-the-product-test! Aborting.');
  process.exit(1);
}

// Load test service account key
const testKey = require(path.resolve(__dirname, '../../test-firebase-key.json'));
if (testKey.project_id !== 'sell-the-product-test') {
  console.error('CRITICAL SAFETY CHECK FAILED: Key project_id is NOT sell-the-product-test! Aborting.');
  process.exit(1);
}

const app = initializeApp({
  credential: cert(testKey),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://sell-the-product-test-default-rtdb.firebaseio.com'
});

const auth = getAuth(app);
const db = getDatabase(app);

// 20 test player accounts with unique passwords specified in requirement
const targetPlayers = [
  { email: 'testplayer1@example.com', password: 'Test@Player001', name: 'Test Player 1' },
  { email: 'testplayer2@example.com', password: 'Test@Player002', name: 'Test Player 2' },
  { email: 'testplayer3@example.com', password: 'Test@Player003', name: 'Test Player 3' },
  { email: 'testplayer4@example.com', password: 'Test@Player004', name: 'Test Player 4' },
  { email: 'testplayer5@example.com', password: 'Test@Player005', name: 'Test Player 5' },
  { email: 'testplayer6@example.com', password: 'Test@Player006', name: 'Test Player 6' },
  { email: 'testplayer7@example.com', password: 'Test@Player007', name: 'Test Player 7' },
  { email: 'testplayer8@example.com', password: 'Test@Player008', name: 'Test Player 8' },
  { email: 'testplayer9@example.com', password: 'Test@Player009', name: 'Test Player 9' },
  { email: 'testplayer10@example.com', password: 'Test@Player010', name: 'Test Player 10' },
  { email: 'testplayer11@example.com', password: 'Test@Player011', name: 'Test Player 11' },
  { email: 'testplayer12@example.com', password: 'Test@Player012', name: 'Test Player 12' },
  { email: 'testplayer13@example.com', password: 'Test@Player013', name: 'Test Player 13' },
  { email: 'testplayer14@example.com', password: 'Test@Player014', name: 'Test Player 14' },
  { email: 'testplayer15@example.com', password: 'Test@Player015', name: 'Test Player 15' },
  { email: 'testplayer16@example.com', password: 'Test@Player016', name: 'Test Player 16' },
  { email: 'testplayer17@example.com', password: 'Test@Player017', name: 'Test Player 17' },
  { email: 'testplayer18@example.com', password: 'Test@Player018', name: 'Test Player 18' },
  { email: 'testplayer19@example.com', password: 'Test@Player019', name: 'Test Player 19' },
  { email: 'testplayer20@example.com', password: 'Test@Player020', name: 'Test Player 20' },
];

async function syncPlayer(p) {
  let userRecord;
  let isNew = false;
  try {
    userRecord = await auth.getUserByEmail(p.email);
    // User exists: update password and displayName
    await auth.updateUser(userRecord.uid, {
      password: p.password,
      displayName: p.name,
      disabled: false
    });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      // User does not exist: create user
      userRecord = await auth.createUser({
        email: p.email,
        password: p.password,
        displayName: p.name,
      });
      isNew = true;
    } else {
      throw err;
    }
  }

  const uid = userRecord.uid;

  // Realtime Database sync under users/{uid}
  const userRef = db.ref(`users/${uid}`);
  const snap = await userRef.once('value');
  const existingData = snap.exists() ? snap.val() : {};

  // Preserve existing customized team name / teamId if present, else use default
  const finalName = (existingData.name && existingData.name.trim() !== '') ? existingData.name : p.name;
  const finalTeamId = existingData.teamId || uid;

  const record = {
    email: p.email,
    name: finalName,
    teamId: finalTeamId,
    isAdmin: false,
    deleted: false,
  };

  await userRef.set(record);

  // Ensure user is not marked as deleted in deletedUsers
  const deletedRef = db.ref(`deletedUsers/${uid}`);
  const delSnap = await deletedRef.once('value');
  if (delSnap.exists()) {
    await deletedRef.remove();
  }

  return {
    email: p.email,
    uid: uid,
    name: finalName,
    password: p.password,
    action: isNew ? 'CREATED' : 'UPDATED'
  };
}

async function run() {
  console.log('Starting sync for 20 TEST players in project:', projectId);
  console.log('----------------------------------------------------');

  const results = [];
  for (const player of targetPlayers) {
    try {
      const res = await syncPlayer(player);
      results.push({ success: true, ...res });
      console.log(`[${res.action}] ${res.email.padEnd(26)} | UID: ${res.uid} | Name: "${res.name}"`);
    } catch (e) {
      results.push({ success: false, email: player.email, error: e.message });
      console.error(`[FAILED] ${player.email}:`, e.message);
    }
  }

  console.log('----------------------------------------------------');
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.error(`Encountered ${failed.length} failures.`);
    process.exit(1);
  }

  console.log(`All ${results.length} test players successfully synchronized in Firebase Auth and RTDB!`);
  
  // Verify Admin account remains untouched
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@gmail.com';
  try {
    const adminUser = await auth.getUserByEmail(adminEmail);
    const adminSnap = await db.ref(`users/${adminUser.uid}`).once('value');
    const adminData = adminSnap.val();
    console.log(`\nAdmin account check: ${adminEmail}`);
    console.log(`UID: ${adminUser.uid}`);
    console.log(`RTDB record:`, adminData);
    if (!adminData || adminData.isAdmin !== true) {
      console.warn('WARNING: Admin account does not have isAdmin: true in RTDB!');
    } else {
      console.log('Admin account is intact and verified with isAdmin: true.');
    }
  } catch (err) {
    console.error('Failed to verify admin account:', err);
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
