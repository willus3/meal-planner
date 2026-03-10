import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Firebase configuration — all values come from environment variables.
 * Never hardcode these values; they're read from .env.local at build time.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Firebase Authentication — handles Google Sign-In
export const auth = getAuth(app);

/**
 * Firestore database with offline persistence enabled.
 *
 * persistentLocalCache() + persistentMultipleTabManager() is the modern Firebase v10
 * way to enable offline support. It caches data in IndexedDB so the app keeps working
 * without internet — important for the shopping list use case (grocery store basement).
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Firebase Storage — used for uploading recipe photos
export const storage = getStorage(app);
