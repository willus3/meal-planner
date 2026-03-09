import { useState } from 'react';
import { useUserPreferencesStore } from '../lib/store';
import { MOCK_RECIPES } from '../lib/recipes';
import RecipeCard from '../components/recipes/RecipeCard';
import { QuickAssignModal } from '../components/recipes/QuickAssignModal';
import { Search } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Recipe } from '../lib/recipes';

export default function RecipeDiscovery() {
  const store = useUserPreferencesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Recommended'>('Recommended');
  const [assigningRecipe, setAssigningRecipe] = useState<Recipe | null>(null);

  // Basic filtering strategy
  const filteredRecipes = MOCK_RECIPES.filter(recipe => {
    // 1. Text Search Filter
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Recommendation Engine Filter
    let matchesRecommendations = true;
    if (activeFilter === 'Recommended') {
      // Must match at least one of the user's dietary preferences if they have one (other than 'None')
      const hasRealPreference = store.dietaryPreferences.length > 0 && !store.dietaryPreferences.includes('None');
      if (hasRealPreference) {
        matchesRecommendations = recipe.dietaryTags.some(tag => store.dietaryPreferences.includes(tag));
      }
      
      // Could also heavily weight matching the store.defaultEffortLevel here in a real app
    }
    
    return matchesSearch && matchesRecommendations;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Discover Recipes</h1>
          <p className="text-gray-500">Find new favorites to add to this week's plan.</p>
        </div>
        
        {/* Simple Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
          <button 
            onClick={() => setActiveFilter('Recommended')}
            className={cn(
              "flex-1 md:px-6 py-2 rounded-md text-sm font-medium transition-colors",
              activeFilter === 'Recommended' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Recommended for You
          </button>
          <button 
            onClick={() => setActiveFilter('All')}
            className={cn(
              "flex-1 md:px-6 py-2 rounded-md text-sm font-medium transition-colors",
              activeFilter === 'All' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            All Recipes
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search for quick pasta, healthy bowls..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors sm:text-sm"
        />
      </div>

      {/* Results Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.map(recipe => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              actionButton={
                <button 
                  onClick={() => setAssigningRecipe(recipe)}
                  className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg text-sm transition-colors border border-transparent hover:border-primary/30"
                >
                  + Add to Plan
                </button>
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-1">No recipes found</h3>
          <p className="text-gray-500">We couldn't find anything matching your search and dietary filters.</p>
        </div>
      )}
      
      {assigningRecipe && (
        <QuickAssignModal 
          recipe={assigningRecipe} 
          isOpen={!!assigningRecipe} 
          onClose={() => setAssigningRecipe(null)} 
        />
      )}
    </div>
  );
}
