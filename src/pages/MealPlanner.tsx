import { useUserPreferencesStore } from '../lib/store';
import type { DayOfWeek } from '../lib/store';
import { MOCK_RECIPES } from '../lib/recipes';
import { Calendar, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MealPlanner() {
  const { weeklyPlan, assignMealToDay, clearWeeklyPlan } = useUserPreferencesStore();

  const handleRemoveMeal = (day: DayOfWeek) => {
    assignMealToDay(day, null);
  };

  const isPlanEmpty = Object.values(weeklyPlan).every(meal => meal === null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <Calendar className="text-primary" />
            Weekly Meal Planner
          </h1>
          <p className="text-gray-500">Assign your discovered recipes to days of the week.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {!isPlanEmpty && (
            <button 
              onClick={clearWeeklyPlan}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              Clear Week
            </button>
          )}
          <Link 
            to="/recipes"
            className="flex-1 md:flex-none px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm text-center"
          >
            Find More Recipes
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-gray-100">
          {DAYS_OF_WEEK.map((day) => {
            const plannedMeal = weeklyPlan[day];
            const recipe = plannedMeal ? MOCK_RECIPES.find(r => r.id === plannedMeal.recipeId) : null;

            return (
              <div key={day} className="flex flex-col sm:flex-row hover:bg-gray-50/50 transition-colors">
                
                {/* Day Label */}
                <div className="w-full sm:w-48 p-4 sm:p-6 flex items-center shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50/30">
                  <h3 className="text-lg font-bold text-gray-900">{day}</h3>
                </div>

                {/* Meal Content Slot */}
                <div className="flex-1 p-4 sm:p-6">
                  {recipe ? (
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-3 shadow-sm relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{recipe.effortLevel}</div>
                        <h4 className="text-base font-bold text-gray-900 leading-tight">{recipe.title}</h4>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                          <span className="font-medium text-gray-700">{plannedMeal?.servings} Servings</span> 
                          • {recipe.prepTimeMinutes}m prep
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRemoveMeal(day)}
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors md:opacity-0 group-hover:opacity-100 mr-2"
                        title="Remove meal"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <Link 
                      to="/recipes"
                      className="h-full min-h-[5rem] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <span className="flex items-center gap-2 font-medium text-sm">
                        <Plus size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                        Add Meal
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {!isPlanEmpty && (
        <div className="flex justify-end pt-4">
          <Link 
            to="/shopping"
            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-md hover:bg-gray-800 transition-all hover:-translate-y-0.5"
          >
            Generate Shopping List →
          </Link>
        </div>
      )}
    </div>
  );
}
