import { useState } from 'react';
import { useUserPreferencesStore } from '../../lib/store';
import type { DayOfWeek } from '../../lib/store';
import type { Recipe } from '../../lib/recipes';
import { Calendar, Check } from 'lucide-react';

interface QuickAssignModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function QuickAssignModal({ recipe, isOpen, onClose }: QuickAssignModalProps) {
  const { weeklyPlan, assignMealToDay, familySize } = useUserPreferencesStore();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);

  if (!isOpen) return null;

  const handleAssign = () => {
    if (selectedDay) {
      assignMealToDay(selectedDay, {
        recipeId: recipe.id,
        servings: familySize, // Default to their family size preference
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-100 bg-gray-50/50">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="text-primary w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Add to Weekly Plan</h2>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{recipe.title}</p>
        </div>

        {/* Day Selection */}
        <div className="p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select a day to assign this meal:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isOccupied = weeklyPlan[day] !== null;
              const isSelected = selectedDay === day;
              
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`
                    flex items-center justify-between px-4 py-3 border rounded-xl text-sm font-medium transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' 
                      : 'border-gray-200 text-gray-700 hover:border-primary/40 hover:bg-gray-50'}
                    ${day === 'Sunday' ? 'col-span-2' : ''}
                  `}
                >
                  {day}
                  {isOccupied && !isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title="Already scheduled" />
                  )}
                  {isSelected && (
                    <Check size={16} className="text-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Warning Message */}
          {selectedDay && weeklyPlan[selectedDay] !== null && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex items-start gap-2">
              <span className="shrink-0 mt-0.5" aria-hidden="true">⚠️</span>
              <p>You already have a meal scheduled for {selectedDay}. This will overwrite it.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleAssign}
            disabled={!selectedDay}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Confirm
          </button>
        </div>

      </div>
    </div>
  );
}
