import { useMemo } from 'react';
import { useUserPreferencesStore } from '../lib/store';
import { MOCK_RECIPES } from '../lib/recipes';
import type { Ingredient, IngredientCategory } from '../lib/recipes';
import { ShoppingCart, Check, ListChecks } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const CATEGORY_ORDER: IngredientCategory[] = [
  'Produce', 'Meat', 'Dairy', 'Bakery', 'Pantry', 'Spices', 'Frozen', 'Other'
];

export default function ShoppingList() {
  const { weeklyPlan, checkedShoppingItems, toggleShoppingItem, clearShoppingListChecks } = useUserPreferencesStore();

  // Parse required ingredients from all assigned recipes
  const { categorizedIngredients, totalItemsCount } = useMemo(() => {
    const rawList = new Map<string, Ingredient & { computedQuantity: number; sourceRecipes: string[] }>();

    // 1. Collect and aggregate all ingredients
    Object.values(weeklyPlan).forEach(plannedMeal => {
      if (!plannedMeal) return;

      const recipe = MOCK_RECIPES.find(r => r.id === plannedMeal.recipeId);
      if (!recipe) return;

      // The multiplier is (Planned Servings) / (Base Recipe Servings)
      // Since our mock recipes don't define a base serving size, we assume base = 1 for the sake of this mock multiplier logic.
      const scalingFactor = plannedMeal.servings;

      recipe.ingredients.forEach(ingredient => {
        const uniqueKey = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;
        
        if (rawList.has(uniqueKey)) {
          const existing = rawList.get(uniqueKey)!;
          existing.computedQuantity += (ingredient.quantity * scalingFactor);
          if (!existing.sourceRecipes.includes(recipe.title)) {
            existing.sourceRecipes.push(recipe.title);
          }
        } else {
          rawList.set(uniqueKey, {
            ...ingredient,
            computedQuantity: ingredient.quantity * scalingFactor,
            sourceRecipes: [recipe.title]
          });
        }
      });
    });

    const items = Array.from(rawList.values());

    // 2. Group by category
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    // 3. Sort item names alphabetically within each category
    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
    });

    return {
      categorizedIngredients: grouped,
      totalItemsCount: items.length
    };
  }, [weeklyPlan]);

  const isEmpty = totalItemsCount === 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <ShoppingCart className="text-primary" />
            Smart Shopping List
          </h1>
          <p className="text-gray-500">Automatically generated from your weekly meal plan.</p>
        </div>
        
        {!isEmpty && (
          <button 
            onClick={clearShoppingListChecks}
            disabled={checkedShoppingItems.length === 0}
            className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ListChecks size={16} />
            Uncheck All
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
            <ShoppingCart className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Your list is empty</h3>
          <p className="text-gray-500 mb-6">Assign meals to your weekly calendar to generate a list.</p>
          <Link 
            to="/planner"
            className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors"
          >
            Go to Planner
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORY_ORDER.map(category => {
            const items = categorizedIngredients[category];
            if (!items || items.length === 0) return null;

            return (
              <div key={category} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-5 py-3 border-b flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">{category}</h3>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                
                <ul className="divide-y divide-gray-50">
                  {items.map((item) => {
                    const uniqueId = `${item.id}-${item.computedQuantity}`;
                    const isChecked = checkedShoppingItems.includes(uniqueId);
                    
                    return (
                      <li key={uniqueId} className="hover:bg-gray-50/50 transition-colors">
                        <label className={cn(
                          "flex items-start gap-4 p-4 sm:px-5 cursor-pointer group",
                          isChecked && "opacity-60"
                        )}>
                          <div className="pt-0.5 relative">
                            <input 
                              type="checkbox" 
                              className="peer sr-only"
                              checked={isChecked}
                              onChange={() => toggleShoppingItem(uniqueId)}
                            />
                            <div className="w-5 h-5 border-2 rounded shrink-0 transition-colors peer-checked:bg-primary peer-checked:border-primary border-gray-300 group-hover:border-primary">
                              {isChecked && <Check size={16} className="text-white absolute top-[2px] left-[2px] stroke-[3]" />}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className={cn(
                                "font-medium text-gray-900 transition-all",
                                isChecked && "line-through text-gray-500"
                              )}>
                                {item.name}
                              </span>
                              <span className="text-sm font-semibold text-primary">
                                {item.computedQuantity} {item.unit}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                              From: {item.sourceRecipes.join(', ')}
                            </p>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
