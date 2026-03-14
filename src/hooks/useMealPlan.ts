import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  subscribeToActivePlan,
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
  updateServings: (day: DayOfWeek, servings: number) => Promise<void>;
  removeMeal: (day: DayOfWeek) => Promise<void>;
  clearPlan: () => Promise<void>;
}

/**
 * Manages the user's current weekly meal plan with Firestore persistence
 * and real-time cross-device sync.
 *
 * Subscribes to the active plan on mount — any change saved from another
 * device (phone, tablet, laptop) is pushed here automatically without a
 * page refresh. Mutations still apply an optimistic update first for
 * instant local feedback, then let the snapshot confirm the final state.
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

    // Subscribe to real-time updates — returns cleanup function
    const unsubscribe = subscribeToActivePlan(
      user.uid,
      (current) => {
        // Always sync planIdRef so mutations target the right document
        planIdRef.current = current?.id;
        setPlan(current);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );

    return unsubscribe;
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
      // saveWeeklyPlan returns the doc ID — store it so subsequent writes
      // target the same document before the onSnapshot callback fires.
      const id = await saveWeeklyPlan(user.uid, updatedSchedule, planIdRef.current);
      planIdRef.current = id;
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Updates only the serving count for an already-assigned meal.
   * Leaves the recipe unchanged — just patches the servings field.
   */
  const updateServings = async (day: DayOfWeek, servings: number) => {
    if (!user || !plan) return;
    const current = plan.schedule[day];
    if (!current) return;

    const updatedSchedule: WeeklySchedule = {
      ...plan.schedule,
      [day]: { ...current, servings },
    };

    // Optimistic update
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

  return { plan, loading, error, saving, assignMeal, updateServings, removeMeal, clearPlan };
}
