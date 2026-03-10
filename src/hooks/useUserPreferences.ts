import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserPreferences, saveUserPreferences } from '../services/userService';
import { useUserPreferencesStore } from '../lib/store';
import type { UserPreferences } from '../types/user';
import type { DietaryPreference, EffortLevel } from '../lib/store';

interface UseUserPreferencesResult {
  loading: boolean;
  error: string | null;
  save: (prefs: UserPreferences) => Promise<void>;
}

/**
 * Manages user preferences with Firestore persistence.
 *
 * On mount: loads preferences from Firestore and hydrates the Zustand store
 * so the rest of the app (recommendations, planner defaults) always has
 * the latest values without needing to prop-drill.
 *
 * On save: writes to both Firestore (durable) and Zustand (in-memory for the session).
 */
export function useUserPreferences(): UseUserPreferencesResult {
  const { user } = useAuth();
  const store = useUserPreferencesStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from Firestore on mount and hydrate Zustand
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const prefs = await getUserPreferences(user.uid);
        if (prefs) {
          // Hydrate the Zustand store so the rest of the app has correct values
          store.setDietaryPreferences(prefs.dietaryPreferences as DietaryPreference[]);
          store.setDislikedIngredients(prefs.dislikedIngredients);
          store.setDefaultEffortLevel(prefs.defaultEffortLevel as EffortLevel);
          store.setFamilySize(prefs.familySize);
          if (prefs.hasOnboarded) store.setOnboarded(true);
        }
      } catch {
        setError('Failed to load your preferences.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const save = async (prefs: UserPreferences) => {
    if (!user) return;

    // Update Zustand immediately for responsive UI
    store.setDietaryPreferences(prefs.dietaryPreferences as DietaryPreference[]);
    store.setDislikedIngredients(prefs.dislikedIngredients);
    store.setDefaultEffortLevel(prefs.defaultEffortLevel as EffortLevel);
    store.setFamilySize(prefs.familySize);
    store.setOnboarded(true);

    // Persist to Firestore
    await saveUserPreferences(user.uid, prefs);
  };

  return { loading, error, save };
}
