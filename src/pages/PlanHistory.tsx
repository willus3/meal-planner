import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ChevronRight, ChevronLeft, RotateCcw, Calendar, AlertTriangle } from 'lucide-react';
import { usePlanHistory } from '../hooks/usePlanHistory';
import { useMealPlan } from '../hooks/useMealPlan';
import { useRecipes } from '../hooks/useRecipes';
import { useAuth } from '../hooks/useAuth';
import { useUiStore } from '../store/uiStore';
import { repeatPlan } from '../services/mealPlanService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { DAYS_OF_WEEK } from '../lib/constants';
import type { MealPlan } from '../types/mealplan';

export default function PlanHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, loading, error } = usePlanHistory();
  const { plan: currentPlan } = useMealPlan();
  const { recipes } = useRecipes();
  const { resetShoppingUi } = useUiStore();

  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [repeating, setRepeating] = useState(false);
  const [repeatError, setRepeatError] = useState<string | null>(null);

  if (loading) return <LoadingSpinner message="Loading your plan history..." />;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRepeat = async () => {
    if (!user || !selectedPlan) return;

    setRepeating(true);
    setRepeatError(null);

    try {
      // Filter out deleted recipes from the historical schedule before repeating
      const cleanedSchedule = Object.fromEntries(
        Object.entries(selectedPlan.schedule).map(([day, meal]) => {
          if (!meal) return [day, null];
          const recipeExists = recipes.some((r) => r.id === meal.recipeId);
          return [day, recipeExists ? meal : null];
        })
      ) as typeof selectedPlan.schedule;

      // Warn the user if any meals were dropped
      const droppedCount = Object.values(selectedPlan.schedule).filter(
        (meal, i) => meal && !Object.values(cleanedSchedule)[i]
      ).length;

      if (droppedCount > 0) {
        setRepeatError(
          `${droppedCount} meal${droppedCount > 1 ? 's' : ''} from this plan could not be restored because the recipe was deleted from your library.`
        );
      }

      await repeatPlan(user.uid, cleanedSchedule, currentPlan?.id);
      resetShoppingUi();
      navigate('/planner');
    } catch {
      setRepeatError('Failed to repeat this plan. Please try again.');
      setRepeating(false);
    }
  };

  // ── Detail View ──────────────────────────────────────────────────────────────

  if (selectedPlan) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
          <button
            onClick={() => { setSelectedPlan(null); setRepeatError(null); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            <ChevronLeft size={16} />
            Back to History
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{formatWeekRange(selectedPlan.weekStartDate, selectedPlan.weekEndDate)}</h1>
            {selectedPlan.isActive && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Current Week</span>
            )}
          </div>
          {!selectedPlan.isActive && (
            <button
              onClick={handleRepeat}
              disabled={repeating}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <RotateCcw size={16} className={repeating ? 'animate-spin' : ''} aria-hidden="true" />
              {repeating ? 'Repeating...' : 'Repeat This Week'}
            </button>
          )}
        </div>

        {/* Deleted recipe warning */}
        {repeatError && (
          <div role="alert" className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
            {repeatError}
          </div>
        )}

        {/* 7-day grid */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-gray-100">
            {DAYS_OF_WEEK.map((day) => {
              const meal = selectedPlan.schedule[day];
              const recipe = meal ? recipes.find((r) => r.id === meal.recipeId) : null;
              const isDeleted = !!meal && !recipe;

              return (
                <div key={day} className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-36 p-4 flex items-center shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50/30">
                    <span className="font-bold text-gray-900 text-sm">{day}</span>
                  </div>
                  <div className="flex-1 p-4">
                    {isDeleted ? (
                      <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <AlertTriangle size={14} />
                        <span className="italic">Recipe deleted</span>
                      </div>
                    ) : recipe ? (
                      <div className="flex items-center gap-3">
                        {recipe.imageUrl && (
                          <img src={recipe.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{recipe.title}</p>
                          <p className="text-xs text-gray-500">{meal?.servings} servings · {recipe.prepTimeMinutes}m</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No meal planned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── List View ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Page Header */}
      <div className="border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
          <History className="text-primary" aria-hidden="true" />
          Plan History
        </h1>
        <p className="text-gray-500">Your past weekly meal plans. Tap one to view or repeat it.</p>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Empty state */}
      {plans.length === 0 && !error && (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="No plan history yet"
          description="Your past meal plans will appear here once you've completed a week."
        />
      )}

      {/* Plan list */}
      {plans.length > 0 && (
        <div className="space-y-3">
          {plans.map((plan) => {
            const mealCount = Object.values(plan.schedule).filter(Boolean).length;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className="w-full flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{formatWeekRange(plan.weekStartDate, plan.weekEndDate)}</p>
                    {plan.isActive && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Current</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {mealCount === 0 ? 'No meals planned' : `${mealCount} meal${mealCount === 1 ? '' : 's'} planned`}
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-400 shrink-0" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Formats a week range as "Mar 3 – Mar 9". */
function formatWeekRange(weekStartDate: string, weekEndDate: string): string {
  if (!weekStartDate || !weekEndDate) return 'Unknown week';
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(new Date(weekStartDate))} – ${fmt(new Date(weekEndDate))}`;
}
