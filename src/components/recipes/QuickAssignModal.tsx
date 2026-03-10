import { useState } from 'react';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useUserPreferencesStore } from '../../lib/store';
import type { DayOfWeek } from '../../types/mealplan';
import type { Recipe } from '../../lib/recipes';
import { Calendar, Check, Minus, Plus } from 'lucide-react';
import { DAYS_OF_WEEK } from '../../lib/constants';

interface QuickAssignModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAssignModal({ recipe, isOpen, onClose }: QuickAssignModalProps) {
  const { plan, assignMeal, saving } = useMealPlan();
  const { familySize } = useUserPreferencesStore();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [servings, setServings] = useState(familySize);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!selectedDay) return;
    await assignMeal(selectedDay, recipe.id, servings);
    onClose();
  };

  const schedule = plan?.schedule;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="p-6 text-center border-b border-gray-100 bg-gray-50/50">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="text-primary w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Add to Weekly Plan</h2>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{recipe.title}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Day Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select a day:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isOccupied = schedule?.[day] != null;
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`
                      flex items-center justify-between px-4 py-3 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary
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
                    {isSelected && <Check size={16} className="text-primary" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overwrite warning */}
          {selectedDay && schedule?.[selectedDay] != null && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex items-start gap-2" role="alert">
              <span className="shrink-0 mt-0.5" aria-hidden="true">⚠️</span>
              <p>You already have a meal on {selectedDay}. This will replace it.</p>
            </div>
          )}

          {/* Servings */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Servings
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Decrease servings"
              >
                <Minus size={16} />
              </button>
              <span className="text-xl font-bold text-gray-900 w-8 text-center" aria-live="polite">
                {servings}
              </span>
              <button
                type="button"
                onClick={() => setServings((s) => Math.min(12, s + 1))}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Increase servings"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedDay || saving}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
