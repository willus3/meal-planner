import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthContextValue } from '../contexts/AuthContext';

/**
 * Hook to access auth state and actions from any component in the app.
 *
 * Returns: { user, loading, error, signInWithGoogle, signOut }
 *
 * Must be called inside a component that is a descendant of AuthProvider.
 * Throws an error if used outside of AuthProvider so mistakes are caught early.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider. Check that AuthProvider wraps your component in main.tsx.');
  }
  return context;
}
