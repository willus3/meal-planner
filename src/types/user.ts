import type { DietaryPreference, EffortLevel } from './recipe';

/** User preferences stored in Firestore at users/{uid}. */
export interface UserPreferences {
  dietaryPreferences: DietaryPreference[];
  dislikedIngredients: string[];
  defaultEffortLevel: EffortLevel;
  familySize: number;
  hasOnboarded: boolean;
}

/** Default preferences applied to new users before onboarding. */
export const DEFAULT_PREFERENCES: UserPreferences = {
  dietaryPreferences: [],
  dislikedIngredients: [],
  defaultEffortLevel: 'Average',
  familySize: 2,
  hasOnboarded: false,
};
