/**
 * Database Migration Script
 * 
 * This script migrates existing data to support server-side security rules.
 * It adds:
 * 1. teamId to existing sales records (based on userId)
 * 2. teamId and isAdmin to existing user records
 * 
 * Run this script in Firebase Console or using Node.js with Firebase Admin SDK.
 * 
 * Instructions for Firebase Console:
 * 1. Go to Firebase Console → Realtime Database
 * 2. Click on the "..." menu → Import JSON
 * 3. Or run this script in the Console's JavaScript console
 */

// Option 1: Run in Firebase Console JavaScript Console
// Copy and paste this into the Firebase Console → Realtime Database → Console

const migrateDatabase = async () => {
  const database = firebase.database();
  
  console.log('Starting database migration...');
  
  // Migration 1: Add teamId to existing sales
  console.log('Migrating sales...');
  const salesRef = database.ref('sales');
  const salesSnapshot = await salesRef.once('value');
  const salesUpdates = {};
  let salesCount = 0;
  
  salesSnapshot.forEach((childSnapshot) => {
    const sale = childSnapshot.val();
    if (!sale.teamId && sale.userId) {
      salesUpdates[`${childSnapshot.key}/teamId`] = sale.userId;
      salesCount++;
    }
  });
  
  if (salesCount > 0) {
    await salesRef.update(salesUpdates);
    console.log(`✅ Migrated ${salesCount} sales with teamId`);
  } else {
    console.log('ℹ️  No sales needed migration');
  }
  
  // Migration 2: Add teamId and isAdmin to existing users
  console.log('Migrating users...');
  const usersRef = database.ref('users');
  const usersSnapshot = await usersRef.once('value');
  const userUpdates = {};
  let usersCount = 0;
  
  usersSnapshot.forEach((childSnapshot) => {
    const user = childSnapshot.val();
    const uid = childSnapshot.key;
    const updates = {};
    
    // Add teamId if missing (use UID as teamId)
    if (!user.teamId) {
      updates.teamId = uid;
    }
    
    // Add isAdmin if missing (check if email matches admin email)
    if (user.isAdmin === undefined) {
      const adminEmail = 'admin@example.com'; // Update this to your admin email
      updates.isAdmin = user.email === adminEmail;
    }
    
    if (Object.keys(updates).length > 0) {
      userUpdates[uid] = updates;
      usersCount++;
    }
  });
  
  if (usersCount > 0) {
    await usersRef.update(userUpdates);
    console.log(`✅ Migrated ${usersCount} users with teamId and isAdmin`);
  } else {
    console.log('ℹ️  No users needed migration');
  }
  
  console.log('✅ Database migration complete!');
};

// Run the migration
migrateDatabase().catch((error) => {
  console.error('❌ Migration failed:', error);
});

// Option 2: Run as Node.js script with Firebase Admin SDK
// Save this as migrate-database.js and run with: node migrate-database.js

/*
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://selltheproduct-2026-default-rtdb.firebaseio.com'
});

const db = admin.database();

async function migrate() {
  console.log('Starting migration...');
  
  // Migrate sales
  const salesRef = db.ref('sales');
  const salesSnapshot = await salesRef.once('value');
  const salesUpdates = {};
  let salesCount = 0;
  
  salesSnapshot.forEach((childSnapshot) => {
    const sale = childSnapshot.val();
    if (!sale.teamId && sale.userId) {
      salesUpdates[`${childSnapshot.key}/teamId`] = sale.userId;
      salesCount++;
    }
  });
  
  if (salesCount > 0) {
    await salesRef.update(salesUpdates);
    console.log(`Migrated ${salesCount} sales`);
  }
  
  // Migrate users
  const usersRef = db.ref('users');
  const usersSnapshot = await usersRef.once('value');
  const userUpdates = {};
  let usersCount = 0;
  
  usersSnapshot.forEach((childSnapshot) => {
    const user = childSnapshot.val();
    const uid = childSnapshot.key;
    const updates = {};
    
    if (!user.teamId) {
      updates.teamId = uid;
    }
    
    if (user.isAdmin === undefined) {
      const adminEmail = 'admin@selltheproduct.com';
      updates.isAdmin = user.email === adminEmail;
    }
    
    if (Object.keys(updates).length > 0) {
      userUpdates[uid] = updates;
      usersCount++;
    }
  });
  
  if (usersCount > 0) {
    await usersRef.update(userUpdates);
    console.log(`Migrated ${usersCount} users`);
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
*/
