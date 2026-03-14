import PreferencesForm from '../components/ui/PreferencesForm';
import { useUserPreferencesStore } from '../lib/store';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Utensils, BookOpen, Calendar, ShoppingCart, Sparkles, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const store = useUserPreferencesStore();
  // Loads preferences from Firestore on mount and hydrates the Zustand store
  useUserPreferences();
  
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">Welcome to Meal Planner Pro</h1>
        <p className="text-lg text-gray-600">Your personalized guide to stress-free weekly dinners.</p>
      </div>
      
      {/* ── What can this app do? ───────────────────────────────────────────── */}
      <details className="group bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <summary className="flex items-center justify-between gap-3 px-6 py-4 cursor-pointer select-none list-none hover:bg-gray-50 transition-colors">
          <span className="text-base font-semibold text-gray-800">What can this app do?</span>
          {/* Chevron rotates when open */}
          <svg
            className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>

        <div className="px-6 pb-6 pt-2 space-y-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Meal Planner Pro is your personal kitchen assistant that takes the stress out of deciding what to cook.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen size={16} className="text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Recipe Library</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add recipes manually, scan a photo from a cookbook, search thousands of real recipes online, or paste any recipe URL to import it automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Weekly Meal Planner</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Assign recipes to each day of the week. Adjust serving sizes per night — perfect for busy weekdays or feeding a bigger crowd on the weekend.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingCart size={16} className="text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Smart Shopping List</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ingredients are automatically scaled to your serving sizes, duplicates are combined, and everything is sorted by grocery aisle. Add your own items too.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">AI Recommendations</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Not sure what to make? The Recommended tab suggests recipes from your library based on your dietary preferences and how much time you want to spend cooking.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:col-span-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Link2 size={16} className="text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Everything Syncs</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your recipes, plans, and shopping lists are saved to your account and available on any device, any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </details>

      {store.hasOnboarded ? (
        <div className="bg-primary/5 rounded-xl p-8 border border-primary/20 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <Utensils className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">You're all set up!</h2>
          <p className="text-gray-600 max-w-md mx-auto">
             Your preferences are saved. Ready to find some delicious meals for your family of {store.familySize}?
          </p>
          <div className="pt-4 flex justify-center gap-4">
             <Link 
               to="/recipes" 
               className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
             >
               Discover Recipes
             </Link>
             <button 
               onClick={() => store.setOnboarded(false)}
               className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
             >
               Edit Preferences
             </button>
          </div>
        </div>
      ) : (
        <PreferencesForm />
      )}
    </div>
  );
}
