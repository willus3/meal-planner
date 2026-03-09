import { useState } from 'react';
import { useUserPreferencesStore } from '../../lib/store';
import type { DietaryPreference, EffortLevel } from '../../lib/store';
import { ChefHat, Users, Clock, Leaf } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const DIETARY_OPTIONS: DietaryPreference[] = ['None', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free'];
const EFFORT_OPTIONS: EffortLevel[] = ['Quick Weekday', 'Average', 'Long Weekend'];

export default function PreferencesForm() {
  const store = useUserPreferencesStore();
  const navigate = useNavigate();
  
  const [dietary, setDietary] = useState<DietaryPreference[]>(store.dietaryPreferences.length > 0 ? store.dietaryPreferences : ['None']);
  const [effort, setEffort] = useState<EffortLevel>(store.defaultEffortLevel);
  const [familySize, setFamilySize] = useState<number>(store.familySize);

  const toggleDietary = (pref: DietaryPreference) => {
    if (pref === 'None') {
      setDietary(['None']);
      return;
    }
    
    setDietary(prev => {
      const newPrefs = prev.filter(p => p !== 'None');
      if (newPrefs.includes(pref)) {
        return newPrefs.filter(p => p !== pref).length === 0 ? ['None'] : newPrefs.filter(p => p !== pref);
      }
      return [...newPrefs, pref];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.setDietaryPreferences(dietary);
    store.setDefaultEffortLevel(effort);
    store.setFamilySize(familySize);
    store.setOnboarded(true);
    
    // Once saved, generate first batch of recipes or take them to discovery
    navigate('/recipes');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-left">
      <div className="bg-primary/5 p-6 border-b border-primary/10">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ChefHat className="text-primary" />
          Set Your Preferences
        </h2>
        <p className="text-gray-500 mt-2">
          Tell us how you like to eat, and we'll tailor your meal plans perfectly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* Family Size */}
        <div className="space-y-4">
          <label htmlFor="familySize" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Users size={18} className="text-gray-500" />
            Family Size (Portions)
          </label>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => setFamilySize(Math.max(1, familySize - 1))}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Decrease family size"
            >
              -
            </button>
            <span className="text-xl font-medium w-8 text-center">{familySize}</span>
            <button 
              type="button"
              onClick={() => setFamilySize(familySize + 1)}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Increase family size"
            >
              +
            </button>
          </div>
          <p className="text-sm text-gray-500">How many people are you cooking for on average?</p>
        </div>

        {/* Effort Level */}
        <div className="space-y-4 border-t border-gray-100 pt-6">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-gray-500" />
            Default Effort Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EFFORT_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setEffort(option)}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer",
                  effort === option 
                    ? "bg-primary text-white border-primary shadow-sm" 
                    : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500">You can adjust this filter individually when searching for recipes.</p>
        </div>

        {/* Dietary Preferences */}
        <div className="space-y-4 border-t border-gray-100 pt-6">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Leaf size={18} className="text-gray-500" />
            Dietary Restrictions
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(option => {
              const isActive = dietary.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleDietary(option)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer",
                    isActive 
                      ? "bg-primary/10 text-primary border-primary/30" 
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button 
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
