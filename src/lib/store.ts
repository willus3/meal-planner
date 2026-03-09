import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DietaryPreference = 'Vegetarian' | 'Vegan' | 'Keto' | 'Paleo' | 'Gluten-Free' | 'None';
export type EffortLevel = 'Quick Weekday' | 'Average' | 'Long Weekend';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface PlannedMeal {
  recipeId: string;
  servings: number;
}

interface UserPreferencesState {
  hasOnboarded: boolean;
  dietaryPreferences: DietaryPreference[];
  dislikedIngredients: string[];
  defaultEffortLevel: EffortLevel;
  familySize: number;
  weeklyPlan: Record<DayOfWeek, PlannedMeal | null>;
  checkedShoppingItems: string[];
  
  // Actions
  setOnboarded: (status: boolean) => void;
  setDietaryPreferences: (prefs: DietaryPreference[]) => void;
  setDislikedIngredients: (ingredients: string[]) => void;
  setDefaultEffortLevel: (level: EffortLevel) => void;
  setFamilySize: (size: number) => void;
  assignMealToDay: (day: DayOfWeek, meal: PlannedMeal | null) => void;
  clearWeeklyPlan: () => void;
  toggleShoppingItem: (itemId: string) => void;
  clearShoppingListChecks: () => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      dietaryPreferences: [],
      dislikedIngredients: [],
      defaultEffortLevel: 'Average',
      familySize: 2,
      weeklyPlan: {
        Monday: null,
        Tuesday: null,
        Wednesday: null,
        Thursday: null,
        Friday: null,
        Saturday: null,
        Sunday: null,
      },
      checkedShoppingItems: [],

      setOnboarded: (status) => set({ hasOnboarded: status }),
      setDietaryPreferences: (prefs) => set({ dietaryPreferences: prefs }),
      setDislikedIngredients: (ingredients) => set({ dislikedIngredients: ingredients }),
      setDefaultEffortLevel: (level) => set({ defaultEffortLevel: level }),
      setFamilySize: (size) => set({ familySize: size }),
      assignMealToDay: (day, meal) => 
        set((state) => ({ 
          weeklyPlan: { ...state.weeklyPlan, [day]: meal } 
        })),
      clearWeeklyPlan: () => 
        set(() => ({ 
          weeklyPlan: { Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null, Saturday: null, Sunday: null } 
        })),
      toggleShoppingItem: (itemId) => 
        set((state) => {
          const isChecked = state.checkedShoppingItems.includes(itemId);
          return {
            checkedShoppingItems: isChecked 
              ? state.checkedShoppingItems.filter(id => id !== itemId)
              : [...state.checkedShoppingItems, itemId]
          };
        }),
      clearShoppingListChecks: () => set({ checkedShoppingItems: [] }),
    }),
    {
      name: 'meal-planner-preferences',
    }
  )
);
