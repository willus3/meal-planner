import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getAllPlans } from '../services/mealPlanService';
import { HISTORY_LIMIT } from '../lib/constants';
import type { MealPlan } from '../types/mealplan';

interface UsePlanHistoryResult {
  plans: MealPlan[];
  loading: boolean;
  error: string | null;
}

/**
 * Loads the user's past meal plans for the History page.
 * Returns up to HISTORY_LIMIT plans sorted by week start date descending.
 */
export function usePlanHistory(): UsePlanHistoryResult {
  const { user } = useAuth();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const data = await getAllPlans(user.uid, HISTORY_LIMIT);
        setPlans(data);
      } catch {
        setError('Failed to load plan history. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return { plans, loading, error };
}
