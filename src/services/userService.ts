import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserPreferences } from '../types/user';

/** Returns a Firestore document reference for the user's profile. */
const userDoc = (uid: string) => doc(db, 'users', uid);

/**
 * Loads the user's preferences from their Firestore profile document.
 * Returns null if the user has not yet completed onboarding.
 */
export async function getUserPreferences(uid: string): Promise<UserPreferences | null> {
  const snapshot = await getDoc(userDoc(uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserPreferences;
}

/**
 * Saves user preferences to Firestore.
 * Uses merge:true so we never accidentally overwrite other fields on the user doc.
 */
export async function saveUserPreferences(
  uid: string,
  prefs: UserPreferences
): Promise<void> {
  await setDoc(userDoc(uid), prefs, { merge: true });
}
