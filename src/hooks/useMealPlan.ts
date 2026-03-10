import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  getCurrentPlan,
  saveWeeklyPlan,
  clearPlan as serviceClearPlan,
  EMPTY_SCHEDULE,
} from '../services/mealPlanService';
import type { MealPlan, DayOfWeek, WeeklySchedule } from '../types/mealplan';

interface UseMealPlanResult {
  plan: MealPlan | null;
  loading: boolean;
  error: string | null;
  /** True while a Firestore write is in flight — show a saving indicator in the UI. */
  saving: boolean;
  assignMeal: (day: DayOfWeek, recipeId: string, servings: number) => Promise<void>;
  removeMeal: (day: DayOfWeek) => Promise<void>;
  clearPlan: () => Promise<void>;
}

/**
 * Manages the user's current weekly meal plan with Firestore persistence.
 *
 * Loads the active plan on mount. All mutations update local state immediately
 * (optimistic update) and then sync to Firestore in the background. Firestore's
 * offline persistence ensures writes are queued if the user is offline.
 */
export function useMealPlan(): UseMealPlanResult {
  const { user } = useAuth();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Ref tracks the Firestore doc ID so we always update the same document
  // rather than accidentally creating a new plan on each save.
  const planIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const current = await getCurrentPlan(user.uid);
        if (current) {
          setPlan(current);
          planIdRef.current = current.id;
        }
      } catch {
        setError('Failed to load your meal plan. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  /**
   * Assigns a recipe to a day, overwriting any existing meal for that day.
   * Updates local state immediately, then persists to Firestore.
   */
  const assignMeal = async (day: DayOfWeek, recipeId: string, servings: number) => {
    if (!user) return;

    const currentSchedule: WeeklySchedule = plan?.schedule ?? { ...EMPTY_SCHEDULE };
    const updatedSchedule: WeeklySchedule = {
      ...currentSchedule,
      [day]: { recipeId, servings },
    };

    // Optimistic update — UI reflects the change before Firestore confirms
    setPlan((prev) =>
      prev
        ? { ...prev, schedule: updatedSchedule }
        : {
            id: '',
            weekStartDate: '',
            weekEndDate: '',
            schedule: updatedSchedule,
            generatedItems: [],
            manualItems: [],
            createdAt: new Date(),
            isActive: true,
          }
    );

    setSaving(true);
    try {
      const id = await saveWeeklyPlan(user.uid, updatedSchedule, planIdRef.current);
      planIdRef.current = id;
      // Update the plan's id now that we have it from Firestore
      setPlan((prev) => (prev ? { ...prev, id } : prev));
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /** Removes a meal from a specific day and saves to Firestore. */
  const removeMeal = async (day: DayOfWeek) => {
    if (!user || !plan) return;

    const updatedSchedule: WeeklySchedule = { ...plan.schedule, [day]: null };
    setPlan((prev) => (prev ? { ...prev, schedule: updatedSchedule } : prev));

    setSaving(true);
    try {
      await saveWeeklyPlan(user.uid, updatedSchedule, planIdRef.current);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /** Clears all days in the current plan. */
  const clearPlan = async () => {
    if (!user) return;

    const emptySchedule = { ...EMPTY_SCHEDULE };
    setPlan((prev) => (prev ? { ...prev, schedule: emptySchedule } : prev));

    setSaving(true);
    try {
      if (planIdRef.current) {
        await serviceClearPlan(user.uid, planIdRef.current);
      } else {
        const id = await saveWeeklyPlan(user.uid, emptySchedule);
        planIdRef.current = id;
      }
    } catch {
      setError('Failed to clear plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return { plan, loading, error, saving, assignMeal, removeMeal, clearPlan };
}
