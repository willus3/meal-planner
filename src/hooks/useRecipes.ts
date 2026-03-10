import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
  subscribeToRecipes,
  addRecipe as serviceAdd,
  updateRecipe as serviceUpdate,
  deleteRecipe as serviceDelete,
} from '../services/recipeService';
import type { Recipe } from '../types/recipe';

interface UseRecipesResult {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  addRecipe: (data: Omit<Recipe, 'id' | 'createdAt'>) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
}

/**
 * Provides the user's full recipe library with real-time Firestore sync.
 *
 * The hook subscribes to Firestore on mount and unsubscribes on unmount.
 * Any add, update, or delete immediately reflects in the `recipes` array
 * without needing a manual refresh.
 */
export function useRecipes(): UseRecipesResult {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe — returns an unsubscribe function for cleanup
    const unsubscribe = subscribeToRecipes(
      user.uid,
      (data) => {
        setRecipes(data);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );

    // React calls this cleanup function when the component using the hook unmounts,
    // which stops the Firestore listener and prevents memory leaks.
    return unsubscribe;
  }, [user]);

  const addRecipe = async (data: Omit<Recipe, 'id' | 'createdAt'>) => {
    if (!user) return;
    await serviceAdd(user.uid, data);
    // No need to manually update state — onSnapshot fires automatically after the write
  };

  const updateRecipe = async (
    id: string,
    updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>
  ) => {
    if (!user) return;
    await serviceUpdate(user.uid, id, updates);
  };

  const deleteRecipe = async (id: string) => {
    if (!user) return;
    await serviceDelete(user.uid, id);
  };

  return { recipes, loading, error, addRecipe, updateRecipe, deleteRecipe };
}
