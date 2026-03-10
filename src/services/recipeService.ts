import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Recipe } from '../types/recipe';
import { fetchStockPhoto } from './unsplashService';

/** Returns a Firestore collection reference for a user's recipes. */
const recipesRef = (uid: string) => collection(db, 'users', uid, 'recipes');

/**
 * Subscribes to real-time updates on the user's recipe library.
 *
 * Why onSnapshot instead of getDocs?
 * onSnapshot keeps listening for changes — so if a recipe is added or deleted,
 * the UI updates automatically without needing a manual refresh.
 *
 * @returns An unsubscribe function — call it to stop listening (important for cleanup).
 */
export function subscribeToRecipes(
  uid: string,
  onData: (recipes: Recipe[]) => void,
  onError: (message: string) => void
): () => void {
  const q = query(recipesRef(uid), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const recipes = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          // Firestore stores dates as Timestamps — convert back to JS Date objects
          createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
        } as Recipe;
      });
      onData(recipes);
    },
    () => {
      onError('Failed to load recipes. Please refresh the page.');
    }
  );
}

/**
 * Adds a new recipe to the user's Firestore library.
 * If no imageUrl is provided, attempts to fetch a stock photo from Unsplash.
 */
export async function addRecipe(
  uid: string,
  data: Omit<Recipe, 'id' | 'createdAt'>
): Promise<void> {
  let imageUrl = data.imageUrl;

  // If no image was provided, try to get a stock photo using the recipe title
  if (!imageUrl) {
    const stockPhoto = await fetchStockPhoto(data.title);
    imageUrl = stockPhoto ?? '';
  }

  await addDoc(recipesRef(uid), {
    ...data,
    imageUrl,
    createdAt: Timestamp.now(),
  });
}

/**
 * Updates specific fields on an existing recipe document.
 * Only the fields you pass in will change — other fields are untouched.
 */
export async function updateRecipe(
  uid: string,
  recipeId: string,
  updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>
): Promise<void> {
  const recipeDoc = doc(db, 'users', uid, 'recipes', recipeId);
  await updateDoc(recipeDoc, updates);
}

/**
 * Permanently deletes a recipe from the user's library.
 * Note: recipes currently assigned to a meal plan will show a placeholder
 * in the planner — handled in the meal plan feature.
 */
export async function deleteRecipe(uid: string, recipeId: string): Promise<void> {
  const recipeDoc = doc(db, 'users', uid, 'recipes', recipeId);
  await deleteDoc(recipeDoc);
}
