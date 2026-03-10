import { useState } from 'react';
import { Search, ChefHat, Check, Minus, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUserPreferencesStore } from '../../lib/store';
import type { Recipe } from '../../types/recipe';
import type { DayOfWeek } from '../../types/mealplan';

interface RecipePickerModalProps {
  day: DayOfWeek;
  recipes: Recipe[];
  isOpen: boolean;
  onClose: () => void;
  /** Called when the user confirms a recipe selection. */
  onAssign: (day: DayOfWeek, recipeId: string, servings: number) => Promise<void>;
  saving: boolean;
}

/**
 * Modal for selecting a recipe to assign to a specific day from the Planner page.
 *
 * Flow:
 * 1. User sees their recipe library in a scrollable list
 * 2. They tap a recipe to select it
 * 3. They adjust servings
 * 4. They confirm — calls onAssign
 */
export default function RecipePickerModal({
  day,
  recipes,
  isOpen,
  onClose,
  onAssign,
  saving,
}: RecipePickerModalProps) {
  const { familySize } = useUserPreferencesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(familySize);

  if (!isOpen) return null;

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selectedRecipe) return;
    await onAssign(day, selectedRecipe.id, servings);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg my-8 outline-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Pick a recipe for ${day}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pick a Recipe</h2>
            <p className="text-sm text-gray-500 mt-0.5">For {day}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search your library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="Search recipes"
            />
          </div>

          {/* Recipe list */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ChefHat className="w-8 h-8 mx-auto mb-2 text-gray-300" aria-hidden="true" />
                <p className="text-sm">No recipes found</p>
              </div>
            ) : (
              filtered.map((recipe) => {
                const isSelected = selectedRecipe?.id === recipe.id;
                return (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => setSelectedRecipe(recipe)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {recipe.imageUrl ? (
                        <img src={recipe.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="text-gray-300 w-5 h-5" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{recipe.title}</p>
                      <p className="text-xs text-gray-500">{recipe.effortLevel} · {recipe.prepTimeMinutes}m</p>
                    </div>

                    {isSelected && (
                      <Check size={16} className="text-primary shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Servings — only shown after a recipe is selected */}
          {selectedRecipe && (
            <div className="pt-3 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Servings</label>
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
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedRecipe || saving}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {saving ? 'Saving...' : 'Add to Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
