import { getFirebaseDb } from '@/lib/firebase';
import { ref as dbRef, onValue, get } from 'firebase/database';

let cachedQrUrl: string = '';
let isListening = false;
let prefetchPromise: Promise<string> | null = null;
const listeners = new Set<(url: string) => void>();

/**
 * Returns the currently cached QR code URL (or Data URL) synchronously.
 */
export function getCachedQrUrl(): string {
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
function updateCachedQrUrl(url: string) {
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
 * Starts a real-time listener on the QR code URL (if not already active).
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
      // Fallback check qrImage if qrCodeUrl is not set
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
export async function prefetchQrCode(): Promise<string> {
  // Return synchronous cache if present
  const current = getCachedQrUrl();
  if (current) {
    initQrListener();
    return current;
  }

  if (prefetchPromise) return prefetchPromise;

  prefetchPromise = (async () => {
    try {
      const db = getFirebaseDb();

      // 1. Check primary path: qrCodeUrl
      const snap = await get(dbRef(db, 'qrCodeUrl'));
      if (snap.exists()) {
        const val = snap.val();
        if (typeof val === 'string' && val.trim() !== '') {
          updateCachedQrUrl(val);
          initQrListener();
          return val;
        }
      }

      // 2. Check fallback path: qrImage
      const imgSnap = await get(dbRef(db, 'qrImage'));
      if (imgSnap.exists()) {
        const imgVal = imgSnap.val();
        if (typeof imgVal === 'string' && imgVal.trim() !== '') {
          updateCachedQrUrl(imgVal);
          initQrListener();
          return imgVal;
        }
      }

      // 3. Check fallback path: paymentQRCodes/default
      const defaultSnap = await get(dbRef(db, 'paymentQRCodes/default'));
      if (defaultSnap.exists()) {
        const defaultVal = defaultSnap.val();
        if (typeof defaultVal === 'string' && defaultVal.trim() !== '') {
          updateCachedQrUrl(defaultVal);
          initQrListener();
          return defaultVal;
        }
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
