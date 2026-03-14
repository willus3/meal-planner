import { useState } from 'react';
import { Calendar, Plus, Minus, X, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMealPlan } from '../hooks/useMealPlan';
import { useRecipes } from '../hooks/useRecipes';
import RecipePickerModal from '../components/recipes/RecipePickerModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { DAYS_OF_WEEK } from '../lib/constants';
import type { DayOfWeek } from '../types/mealplan';

export default function MealPlanner() {
  const { plan, loading, error, saving, assignMeal, updateServings, removeMeal, clearPlan } = useMealPlan();
  const { recipes, loading: recipesLoading } = useRecipes();

  // The day whose empty slot was tapped — opens RecipePickerModal
  const [pickingForDay, setPickingForDay] = useState<DayOfWeek | null>(null);

  const schedule = plan?.schedule;
  const isPlanEmpty = !schedule || Object.values(schedule).every((meal) => meal === null);

  if (loading || recipesLoading) return <LoadingSpinner message="Loading your meal plan..." />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <Calendar className="text-primary" aria-hidden="true" />
            Weekly Meal Planner
          </h1>
          <p className="text-gray-500">
            {saving ? (
              <span className="text-primary text-sm font-medium animate-pulse">Saving...</span>
            ) : (
              'Assign meals to each day of the week.'
            )}
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {!isPlanEmpty && (
            <button
              onClick={clearPlan}
              disabled={saving}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Clear Week
            </button>
          )}
          <Link
            to="/recipes"
            className="flex-1 md:flex-none px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm text-center"
          >
            Browse Recipes
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* 7-Day Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-gray-100">
          {DAYS_OF_WEEK.map((day) => {
            const plannedMeal = schedule?.[day] ?? null;
            const recipe = plannedMeal
              ? recipes.find((r) => r.id === plannedMeal.recipeId)
              : null;

            // Recipe was deleted from the library but still referenced in the plan
            const isDeleted = !!plannedMeal && !recipe;

            return (
              <div key={day} className="flex flex-col sm:flex-row hover:bg-gray-50/50 transition-colors">

                {/* Day Label */}
                <div className="w-full sm:w-48 p-4 sm:p-6 flex items-center shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50/30">
                  <h2 className="text-lg font-bold text-gray-900">{day}</h2>
                </div>

                {/* Meal Slot */}
                <div className="flex-1 p-4 sm:p-6">
                  {isDeleted ? (
                    // Recipe was deleted — show a warning placeholder
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" aria-hidden="true" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">Recipe deleted</p>
                        <p className="text-xs text-amber-700">This recipe was removed from your library.</p>
                      </div>
                      <button
                        onClick={() => setPickingForDay(day)}
                        className="text-xs font-medium text-amber-700 underline hover:no-underline focus:outline-none"
                      >
                        Reassign
                      </button>
                      <button
                        onClick={() => removeMeal(day)}
                        className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center hover:bg-amber-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                        aria-label={`Remove deleted meal from ${day}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : recipe ? (
                    // Recipe found — show the assigned meal card
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-3 shadow-sm relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        {recipe.imageUrl ? (
                          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Calendar className="text-gray-300 w-6 h-6" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                          {recipe.effortLevel}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">{recipe.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {/* Inline serving size adjuster */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateServings(day, Math.max(1, (plannedMeal?.servings ?? 1) - 1))}
                              disabled={saving || (plannedMeal?.servings ?? 1) <= 1}
                              className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-primary"
                              aria-label="Decrease servings"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-sm font-medium text-gray-700 w-20 text-center">
                              {plannedMeal?.servings} servings
                            </span>
                            <button
                              onClick={() => updateServings(day, Math.min(12, (plannedMeal?.servings ?? 1) + 1))}
                              disabled={saving || (plannedMeal?.servings ?? 1) >= 12}
                              className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-primary"
                              aria-label="Increase servings"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <span className="text-sm text-gray-400">· {recipe.prepTimeMinutes}m prep</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMeal(day)}
                        disabled={saving}
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors md:opacity-0 group-hover:opacity-100 mr-2 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-30"
                        aria-label={`Remove ${recipe.title} from ${day}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    // Empty slot — tap to open recipe picker
                    <button
                      onClick={() => setPickingForDay(day)}
                      className="h-full w-full min-h-[5rem] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <span className="flex items-center gap-2 font-medium text-sm">
                        <Plus size={18} className="text-gray-400 group-hover:text-primary transition-colors" aria-hidden="true" />
                        Add Meal
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate Shopping List — only shown once at least one meal is assigned */}
      {!isPlanEmpty && (
        <div className="flex justify-end pt-4">
          <Link
            to="/shopping"
            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-md hover:bg-gray-800 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            Generate Shopping List →
          </Link>
        </div>
      )}

      {/* Recipe Picker Modal — opened when user taps an empty day slot */}
      {pickingForDay && (
        <RecipePickerModal
          day={pickingForDay}
          recipes={recipes}
          isOpen={!!pickingForDay}
          onClose={() => setPickingForDay(null)}
          onAssign={assignMeal}
          saving={saving}
        />
      )}
    </div>
  );
}
