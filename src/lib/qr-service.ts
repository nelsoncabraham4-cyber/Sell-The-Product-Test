import { getFirebaseDb } from '@/lib/firebase';
import { ref as dbRef, onValue, get, set } from 'firebase/database';

const playerQrCache = new Map<string, string>();
let cachedQrUrl: string = '';
let isListening = false;
let prefetchPromise: Promise<string> | null = null;
const listeners = new Set<(url: string) => void>();

/**
 * Returns the currently cached QR code URL (or Data URL) synchronously.
 */
export function getCachedQrUrl(userId?: string): string {
  if (userId && playerQrCache.has(userId)) {
    return playerQrCache.get(userId)!;
  }
  if (!cachedQrUrl && typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('cached_qr_url');
      if (stored) {
        cachedQrUrl = stored;
      }
    } catch {
      // Ignore storage errors
    }
  }
  return cachedQrUrl;
}

/**
 * Pre-warms the image decoder in browser cache.
 */
function prewarmImage(url: string) {
  if (typeof window !== 'undefined' && url) {
    try {
      const img = new Image();
      img.src = url;
    } catch {
      // Ignore image decode errors
    }
  }
}

/**
 * Updates the cached QR URL and notifies all active listeners.
 */
function updateCachedQrUrl(url: string, userId?: string) {
  if (userId) {
    playerQrCache.set(userId, url);
  }
  if (url && url !== cachedQrUrl) {
    cachedQrUrl = url;
    prewarmImage(url);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('cached_qr_url', url);
      } catch {
        // Ignore storage errors
      }
    }
    listeners.forEach((fn) => fn(url));
  }
}

/**
 * Saves a player's custom payment QR code to Realtime Database.
 */
export async function savePlayerQr(userId: string, dataUrl: string): Promise<void> {
  if (!userId) throw new Error('User ID is required to save QR code');
  const db = getFirebaseDb();
  await Promise.all([
    set(dbRef(db, `users/${userId}/qrCodeUrl`), dataUrl),
    set(dbRef(db, `users/${userId}/qrImage`), dataUrl),
    set(dbRef(db, `paymentQRCodes/${userId}`), dataUrl),
  ]);
  updateCachedQrUrl(dataUrl, userId);
}

/**
 * Fetches a player's QR code from Realtime Database with fallback.
 */
export async function fetchPlayerQr(userId?: string): Promise<string> {
  const db = getFirebaseDb();
  if (userId) {
    try {
      const snap = await get(dbRef(db, `users/${userId}/qrCodeUrl`));
      if (snap.exists()) {
        const val = snap.val();
        if (typeof val === 'string' && val.trim() !== '') {
          updateCachedQrUrl(val, userId);
          return val;
        }
      }
    } catch (err) {
      console.warn('[QR Service] fetchPlayerQr users error:', err);
    }

    try {
      const qSnap = await get(dbRef(db, `paymentQRCodes/${userId}`));
      if (qSnap.exists()) {
        const val = qSnap.val();
        if (typeof val === 'string' && val.trim() !== '') {
          updateCachedQrUrl(val, userId);
          return val;
        }
      }
    } catch (err) {
      console.warn('[QR Service] fetchPlayerQr paymentQRCodes error:', err);
    }
  }

  // Fallback to default/global if player hasn't uploaded their own QR
  try {
    const defSnap = await get(dbRef(db, 'paymentQRCodes/default'));
    if (defSnap.exists()) {
      const val = defSnap.val();
      if (typeof val === 'string' && val.trim() !== '') {
        return val;
      }
    }
  } catch {}

  try {
    const rootSnap = await get(dbRef(db, 'qrCodeUrl'));
    if (rootSnap.exists()) {
      const val = rootSnap.val();
      if (typeof val === 'string' && val.trim() !== '') {
        return val;
      }
    }
  } catch {}

  return '';
}

/**
 * Subscribes to real-time QR updates for a specific player.
 */
export function subscribePlayerQrUrl(userId: string | undefined, callback: (url: string) => void): () => void {
  if (!userId || typeof window === 'undefined') {
    return () => {};
  }
  const db = getFirebaseDb();
  const playerRef = dbRef(db, `users/${userId}/qrCodeUrl`);
  const unsubscribe = onValue(playerRef, (snap) => {
    if (snap.exists()) {
      const val = snap.val();
      if (typeof val === 'string' && val.trim() !== '') {
        updateCachedQrUrl(val, userId);
        callback(val);
        return;
      }
    }
    // Fallback if player has no QR set
    fetchPlayerQr().then((fallbackUrl) => {
      if (fallbackUrl) callback(fallbackUrl);
    });
  });

  return () => unsubscribe();
}

/**
 * Starts a real-time listener on the global QR code URL.
 */
export function initQrListener() {
  if (isListening || typeof window === 'undefined') return;
  isListening = true;

  try {
    const db = getFirebaseDb();
    const urlRef = dbRef(db, 'qrCodeUrl');
    onValue(urlRef, (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        if (typeof val === 'string' && val.trim() !== '') {
          updateCachedQrUrl(val);
          return;
        }
      }
      get(dbRef(db, 'qrImage')).then((imgSnap) => {
        if (imgSnap.exists()) {
          const imgVal = imgSnap.val();
          if (typeof imgVal === 'string' && imgVal.trim() !== '') {
            updateCachedQrUrl(imgVal);
          }
        }
      }).catch(() => {});
    });
  } catch (err) {
    console.warn('[QR Service] Failed to initialize QR listener:', err);
    isListening = false;
  }
}

/**
 * Pre-fetches the QR code from Firebase Realtime Database.
 */
export async function prefetchQrCode(userId?: string): Promise<string> {
  if (userId) {
    const cached = getCachedQrUrl(userId);
    if (cached) return cached;
    return fetchPlayerQr(userId);
  }

  const current = getCachedQrUrl();
  if (current) {
    initQrListener();
    return current;
  }

  if (prefetchPromise) return prefetchPromise;

  prefetchPromise = (async () => {
    try {
      const val = await fetchPlayerQr();
      if (val) {
        updateCachedQrUrl(val);
        initQrListener();
        return val;
      }
    } catch (err) {
      console.warn('[QR Service] Pre-fetch error:', err);
    } finally {
      prefetchPromise = null;
    }
    initQrListener();
    return '';
  })();

  return prefetchPromise;
}

/**
 * Subscribes to QR URL updates.
 */
export function subscribeQrUrl(callback: (url: string) => void): () => void {
  listeners.add(callback);
  const current = getCachedQrUrl();
  if (current) {
    callback(current);
  }
  initQrListener();
  return () => {
    listeners.delete(callback);
  };
}
