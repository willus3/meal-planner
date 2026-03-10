import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
  subscribeToRecipes,
  addRecipe as serviceAdd,
  updateRecipe as serviceUpdate,
  deleteRecipe as serviceDelete,
} from '../services/recipeService';
import { getRecommendations } from '../services/geminiService';
import { RECOMMENDATION_COUNT } from '../lib/constants';
import type { Recipe, DietaryPreference } from '../types/recipe';

interface RecommendationPreferences {
  dietaryPreferences: string[];
  dislikedIngredients: string[];
  defaultEffortLevel: string;
}

interface UseRecipesResult {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  addRecipe: (data: Omit<Recipe, 'id' | 'createdAt'>) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  getRecommended: (preferences: RecommendationPreferences) => Promise<Recipe[]>;
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

  /**
   * Returns AI-recommended recipes from the user's library based on their preferences.
   *
   * Logic:
   * - Empty library → return [] (caller shows onboarding prompt)
   * - Fewer than 5 recipes → skip Gemini, return all (not enough to meaningfully rank)
   * - Otherwise → ask Gemini to rank titles, map back to full Recipe objects
   * - Gemini fails → fall back to client-side dietary preference filter
   */
  const getRecommended = async (preferences: RecommendationPreferences): Promise<Recipe[]> => {
    if (recipes.length === 0) return [];

    // Not enough recipes to rank — just show them all
    if (recipes.length < 5) return recipes;

    try {
      const titles = await getRecommendations(
        recipes.map((r) => ({ title: r.title, dietaryTags: r.dietaryTags, effortLevel: r.effortLevel })),
        preferences,
        RECOMMENDATION_COUNT
      );

      // Match Gemini's returned titles back to full Recipe objects.
      // Gemini occasionally returns slightly different casing — lowercase both sides to be safe.
      const matched = titles
        .map((title) =>
          recipes.find((r) => r.title.toLowerCase() === title.toLowerCase())
        )
        .filter((r): r is Recipe => r !== undefined);

      if (matched.length > 0) return matched;
    } catch {
      // Gemini unavailable — fall through to client-side fallback below
    }

    return clientSideFallback(recipes, preferences.dietaryPreferences);
  };

  return { recipes, loading, error, addRecipe, updateRecipe, deleteRecipe, getRecommended };
}

/**
 * Client-side fallback when Gemini is unavailable.
 * Filters by active dietary preferences if set, otherwise returns the first N recipes.
 */
function clientSideFallback(recipes: Recipe[], dietaryPrefs: string[]): Recipe[] {
  const active = dietaryPrefs.filter((p) => p !== 'None') as DietaryPreference[];

  if (active.length > 0) {
    const filtered = recipes.filter((r) =>
      active.some((pref) => r.dietaryTags.includes(pref))
    );
    if (filtered.length > 0) return filtered.slice(0, RECOMMENDATION_COUNT);
  }

  return recipes.slice(0, RECOMMENDATION_COUNT);
}
