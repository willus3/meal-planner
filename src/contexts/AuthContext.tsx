// Context files intentionally export both the context object and the provider component.
// This is a standard React pattern — the rule exception is expected and documented here.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * AuthContext holds the current auth state and actions.
 * Consumed via the useAuth hook in hooks/useAuth.ts.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider subscribes to Firebase auth state once at the top of the component
 * tree and makes it available to all children via context.
 *
 * Why use context here? Firebase auth state should only have ONE active listener.
 * If every component subscribed independently, you'd have dozens of listeners doing
 * the same work. Context lets one subscription share its result with the whole app.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // onAuthStateChanged fires immediately with the current user (or null),
    // then again any time the user logs in or out.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Return the unsubscribe function — React calls this on unmount to clean
    // up the listener and prevent memory leaks.
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('popup-blocked')) {
          setError('Please allow popups for this site to sign in with Google.');
        } else if (err.message.includes('network-request-failed')) {
          setError('Sign-in failed. Check your internet connection.');
        } else if (err.message.includes('popup-closed-by-user')) {
          // User dismissed the popup — not an error worth surfacing
          return;
        } else {
          setError('Sign-in failed. Please try again.');
        }
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      setError('Sign-out failed. Please try again.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
