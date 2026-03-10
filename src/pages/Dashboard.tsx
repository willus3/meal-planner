import PreferencesForm from '../components/ui/PreferencesForm';
import { useUserPreferencesStore } from '../lib/store';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Utensils } from 'lucide-react';
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
