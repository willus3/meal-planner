import { useState } from 'react';
import { useUserPreferencesStore } from '../../lib/store';
import { useAuth } from '../../hooks/useAuth';
import { saveUserPreferences } from '../../services/userService';
import type { DietaryPreference, EffortLevel } from '../../lib/store';
import { ChefHat, Users, Clock, Leaf, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { DIETARY_OPTIONS, EFFORT_OPTIONS } from '../../lib/constants';

export default function PreferencesForm() {
  const store = useUserPreferencesStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dietary, setDietary] = useState<DietaryPreference[]>(
    store.dietaryPreferences.length > 0 ? store.dietaryPreferences : ['None']
  );
  const [effort, setEffort] = useState<EffortLevel>(store.defaultEffortLevel);
  const [familySize, setFamilySize] = useState<number>(store.familySize);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>(
    store.dislikedIngredients
  );
  const [dislikedInput, setDislikedInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDietary = (pref: DietaryPreference) => {
    if (pref === 'None') {
      setDietary(['None']);
      return;
    }
    setDietary((prev) => {
      const without = prev.filter((p) => p !== 'None');
      if (without.includes(pref)) {
        const next = without.filter((p) => p !== pref);
        return next.length === 0 ? ['None'] : next;
      }
      return [...without, pref];
    });
  };

  const addDisliked = () => {
    const trimmed = dislikedInput.trim();
    if (!trimmed || dislikedIngredients.includes(trimmed)) return;
    setDislikedIngredients((prev) => [...prev, trimmed]);
    setDislikedInput('');
  };

  const removeDisliked = (ingredient: string) => {
    setDislikedIngredients((prev) => prev.filter((i) => i !== ingredient));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    const prefs = {
      dietaryPreferences: dietary,
      dislikedIngredients,
      defaultEffortLevel: effort,
      familySize: Math.max(1, familySize),
      hasOnboarded: true,
    };

    try {
      // Update Zustand immediately so the rest of the app reflects the change
      store.setDietaryPreferences(dietary);
      store.setDislikedIngredients(dislikedIngredients);
      store.setDefaultEffortLevel(effort);
      store.setFamilySize(prefs.familySize);
      store.setOnboarded(true);
      // Persist to Firestore
      await saveUserPreferences(user.uid, prefs);
      navigate('/recipes');
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-left">
      <div className="bg-primary/5 p-6 border-b border-primary/10">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ChefHat className="text-primary" aria-hidden="true" />
          Set Your Preferences
        </h2>
        <p className="text-gray-500 mt-2">
          Tell us how you like to eat and we'll tailor your meal recommendations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8" noValidate>

        {/* Family Size */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Users size={18} className="text-gray-500" aria-hidden="true" />
            Household Size
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setFamilySize((s) => Math.max(1, s - 1))}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Decrease household size"
            >
              −
            </button>
            <span className="text-xl font-medium w-8 text-center" aria-live="polite">{familySize}</span>
            <button
              type="button"
              onClick={() => setFamilySize((s) => Math.min(12, s + 1))}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Increase household size"
            >
              +
            </button>
          </div>
          <p className="text-sm text-gray-500">How many people are you cooking for?</p>
        </div>

        {/* Effort Level */}
        <div className="space-y-3 border-t border-gray-100 pt-6">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-gray-500" aria-hidden="true" />
            Default Effort Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EFFORT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEffort(option)}
                className={cn(
                  'p-3 rounded-lg border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  effort === option
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="space-y-3 border-t border-gray-100 pt-6">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Leaf size={18} className="text-gray-500" aria-hidden="true" />
            Dietary Preferences
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((option) => {
              const isActive = dietary.includes(option as DietaryPreference);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleDietary(option as DietaryPreference)}
                  className={cn(
                    'px-4 py-2 rounded-full border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    isActive
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Disliked Ingredients */}
        <div className="space-y-3 border-t border-gray-100 pt-6">
          <label htmlFor="disliked-input" className="block text-sm font-semibold text-gray-900">
            Ingredients to Avoid
          </label>
          <p className="text-sm text-gray-500">
            Recipes containing these will be deprioritised in recommendations.
          </p>
          <div className="flex gap-2">
            <input
              id="disliked-input"
              type="text"
              value={dislikedInput}
              onChange={(e) => setDislikedInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDisliked(); } }}
              placeholder="e.g. cilantro, blue cheese..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
            <button
              type="button"
              onClick={addDisliked}
              disabled={!dislikedInput.trim()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Add
            </button>
          </div>
          {dislikedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {dislikedIngredients.map((ing) => (
                <span
                  key={ing}
                  className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-medium"
                >
                  {ing}
                  <button
                    type="button"
                    onClick={() => removeDisliked(ing)}
                    className="text-red-400 hover:text-red-600 focus:outline-none"
                    aria-label={`Remove ${ing}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p role="alert" className="text-sm text-red-600">{error}</p>
        )}

        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {submitting ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
