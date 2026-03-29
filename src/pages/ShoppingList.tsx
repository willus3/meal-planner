import { useMemo, useState, useEffect } from 'react';
import { ShoppingCart, Check, ListChecks, Trash2 } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useMealPlan } from '../hooks/useMealPlan';
import { useRecipes } from '../hooks/useRecipes';
import { useAuth } from '../hooks/useAuth';
import { useUiStore } from '../store/uiStore';
import { saveManualItems } from '../services/mealPlanService';
import AddItemInput from '../components/shopping/AddItemInput';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { CATEGORY_ORDER } from '../lib/constants';
import type { ShoppingItem } from '../types/mealplan';
import type { IngredientCategory } from '../types/recipe';

export default function ShoppingList() {
  const { user } = useAuth();
  const { plan, loading: planLoading } = useMealPlan();
  const { recipes, loading: recipesLoading } = useRecipes();
  const { checkedItemIds, hiddenItemIds, toggleItem, hideItem, clearChecked, syncPlanId } = useUiStore();

  // Manual items are loaded from Firestore (stored on the plan doc) and kept in local state.
  const [manualItems, setManualItems] = useState<ShoppingItem[]>([]);
  const [manualItemsReady, setManualItemsReady] = useState(false);

  // When the plan loads (or changes), sync the UI store's plan ID.
  // If it differs from what was persisted in localStorage, checked/hidden
  // state is auto-cleared — no manual cache clearing needed.
  useEffect(() => {
    if (plan?.id) {
      syncPlanId(plan.id);
    }
  }, [plan?.id, syncPlanId]);

  // Initialize manual items from the plan once it loads
  useEffect(() => {
    if (plan && !manualItemsReady) {
      setManualItems(plan.manualItems ?? []);
      setManualItemsReady(true);
    }
  }, [plan, manualItemsReady]);

  /**
   * Derives the shopping list from the current meal plan + recipe library.
   *
   * Algorithm:
   * 1. For each day with a meal, find the recipe
   * 2. Calculate scaling factor: plannedServings / recipe.baseServings
   * 3. Multiply every ingredient quantity by the scaling factor
   * 4. Aggregate: same name + unit → combine quantities, track source recipes
   */
  const generatedItems = useMemo<ShoppingItem[]>(() => {
    if (!plan?.schedule) return [];

    const itemMap = new Map<string, ShoppingItem>();

    Object.values(plan.schedule).forEach((plannedMeal) => {
      if (!plannedMeal) return;

      const recipe = recipes.find((r) => r.id === plannedMeal.recipeId);
      if (!recipe) return; // deleted recipe — skip

      // How much to scale: e.g. recipe serves 4, user wants 6 → factor = 1.5
      const scalingFactor = plannedMeal.servings / (recipe.baseServings ?? 4);

      recipe.ingredients.forEach((ing) => {
        // Normalised key so "Olive Oil (tbsp)" and "olive oil (tbsp)" merge
        const key = `${(ing.name ?? '').toLowerCase().trim()}-${normalizeUnit(ing.unit ?? '')}`;

        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          existing.quantity = round2dp(existing.quantity + ing.quantity * scalingFactor);
          if (!existing.sourceRecipes.includes(recipe.title)) {
            existing.sourceRecipes.push(recipe.title);
          }
        } else {
          itemMap.set(key, {
            id: `gen-${key.replace(/[^a-z0-9]/g, '-')}`,
            name: ing.name ?? '',
            quantity: round2dp((ing.quantity ?? 1) * scalingFactor),
            unit: normalizeUnit(ing.unit ?? ''),
            category: ing.category,
            sourceRecipes: [recipe.title],
            isManual: false,
          });
        }
      });
    });

    return Array.from(itemMap.values());
  }, [plan, recipes]);

  // All items to display: generated (minus hidden) + manual
  const allVisibleItems = useMemo(
    () => [
      ...generatedItems.filter((item) => !hiddenItemIds.includes(item.id)),
      ...manualItems,
    ],
    [generatedItems, manualItems, hiddenItemIds]
  );

  const isEmpty = allVisibleItems.length === 0;
  const allChecked = !isEmpty && allVisibleItems.every((item) => checkedItemIds.includes(item.id));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddManualItem = async (name: string) => {
    if (!user || !plan?.id) return;
    const newItem: ShoppingItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      quantity: 1,
      unit: '',
      category: 'Other',
      sourceRecipes: [],
      isManual: true,
    };
    const updated = [...manualItems, newItem];
    setManualItems(updated);
    await saveManualItems(user.uid, plan.id, updated);
  };

  const handleDeleteItem = async (item: ShoppingItem) => {
    if (item.isManual) {
      if (!user || !plan?.id) return;
      const updated = manualItems.filter((i) => i.id !== item.id);
      setManualItems(updated);
      await saveManualItems(user.uid, plan.id, updated);
    } else {
      hideItem(item.id);
    }
  };

  if (planLoading || recipesLoading) return <LoadingSpinner message="Loading your shopping list..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <ShoppingCart className="text-primary" aria-hidden="true" />
            Shopping List
          </h1>
          <p className="text-gray-500">
            {isEmpty ? 'Add meals to your planner to generate a list.' : `${allVisibleItems.length} items`}
          </p>
        </div>

        {!isEmpty && (
          <button
            onClick={clearChecked}
            disabled={checkedItemIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <ListChecks size={16} aria-hidden="true" />
            Uncheck All
          </button>
        )}
      </div>

      {/* Add item input — always visible so users can add extras at any time */}
      {plan && (
        <AddItemInput onAdd={handleAddManualItem} />
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
            <ShoppingCart className="text-gray-300 w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">Your list is empty</h2>
          <p className="text-gray-500 mb-6 text-sm">Assign meals to your weekly plan to generate a list.</p>
          <RouterLink
            to="/planner"
            className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors"
          >
            Go to Planner
          </RouterLink>
        </div>
      )}

      {/* All items checked — completion message */}
      {allChecked && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl" role="status">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
            <Check size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-green-800">You're all set!</p>
            <p className="text-sm text-green-700">Everything's in the cart.</p>
          </div>
        </div>
      )}

      {/* Grouped list */}
      {!isEmpty && (
        <div className="space-y-6">
          {buildCategoryGroups(allVisibleItems).map(({ label, items }) => {
            if (items.length === 0) return null;

            // Sort: unchecked first (alpha), checked last (alpha)
            const sorted = [...items].sort((a, b) => {
              const aChecked = checkedItemIds.includes(a.id);
              const bChecked = checkedItemIds.includes(b.id);
              if (aChecked && !bChecked) return 1;
              if (!aChecked && bChecked) return -1;
              return a.name.localeCompare(b.name);
            });

            const checkedCount = sorted.filter((i) => checkedItemIds.includes(i.id)).length;

            return (
              <div key={label} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-800">{label}</h2>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                    {checkedCount}/{items.length}
                  </span>
                </div>

                <ul className="divide-y divide-gray-50">
                  {sorted.map((item) => {
                    const isChecked = checkedItemIds.includes(item.id);
                    const quantityDisplay = formatQuantity(item.quantity);

                    return (
                      <li key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <div className={cn('flex items-center gap-3 px-4 sm:px-5 py-3', isChecked && 'opacity-50')}>

                          {/* Checkbox */}
                          <label className="relative flex-shrink-0 cursor-pointer">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={isChecked}
                              onChange={() => toggleItem(item.id)}
                              aria-label={`Mark ${item.name} as ${isChecked ? 'needed' : 'got it'}`}
                            />
                            <div className="w-5 h-5 border-2 rounded transition-colors peer-checked:bg-primary peer-checked:border-primary border-gray-300 hover:border-primary peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-1">
                              {isChecked && (
                                <Check size={14} className="text-white absolute top-[3px] left-[2px] stroke-[3]" aria-hidden="true" />
                              )}
                            </div>
                          </label>

                          {/* Item info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <span className={cn('font-medium text-gray-900 text-sm', isChecked && 'line-through text-gray-400')}>
                                {item.name}
                              </span>
                              {(item.quantity > 0 || item.unit) && (
                                <span className="text-sm font-semibold text-primary shrink-0">
                                  {quantityDisplay}{item.unit ? ` ${item.unit}` : ''}
                                </span>
                              )}
                            </div>
                            {item.sourceRecipes.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                From: {item.sourceRecipes.join(', ')}
                              </p>
                            )}
                            {item.isManual && (
                              <p className="text-xs text-gray-400 mt-0.5">Added manually</p>
                            )}
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-400"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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

/**
 * Groups items by category, mapping any non-standard categories (e.g. from
 * Gemini) into the closest known category so no items are silently dropped.
 * Known categories appear in CATEGORY_ORDER; anything unrecognised falls
 * into "Other".
 */
function buildCategoryGroups(items: ShoppingItem[]): { label: string; items: ShoppingItem[] }[] {
  const groups = new Map<string, ShoppingItem[]>();
  for (const cat of CATEGORY_ORDER) groups.set(cat, []);

  for (const item of items) {
    const mapped = normalizeCategory(item.category);
    groups.get(mapped)!.push(item);
  }

  return Array.from(groups.entries()).map(([label, groupItems]) => ({ label, items: groupItems }));
}

/**
 * Maps non-standard ingredient categories (often returned by Gemini) to the
 * closest match in CATEGORY_ORDER. Returns "Other" for anything unrecognised.
 */
function normalizeCategory(category: string): IngredientCategory {
  if ((CATEGORY_ORDER as string[]).includes(category)) return category as IngredientCategory;

  const c = category.toLowerCase();
  if (['seafood', 'poultry', 'protein', 'fish', 'meat & seafood', 'deli'].includes(c)) return 'Meat';
  if (['fruits', 'fruit', 'vegetables', 'vegetable', 'fresh produce', 'herbs', 'fresh herbs'].includes(c)) return 'Produce';
  if (['grains', 'grain', 'pasta', 'rice', 'canned goods', 'canned', 'condiments', 'condiment', 'oils', 'oil', 'sauces', 'sauce', 'baking', 'baking supplies', 'dry goods', 'staples', 'legumes', 'nuts', 'cereals'].includes(c)) return 'Pantry';
  if (['seasoning', 'seasonings', 'herbs & spices', 'spice', 'herb'].includes(c)) return 'Spices';
  if (['milk', 'eggs', 'cheese', 'dairy & eggs', 'dairy products'].includes(c)) return 'Dairy';
  if (['bread', 'breads', 'baked goods'].includes(c)) return 'Bakery';
  if (['frozen foods', 'freezer'].includes(c)) return 'Frozen';

  return 'Other';
}

/** Rounds a number to 2 decimal places and strips trailing zeros. */
function round2dp(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Formats a quantity for display — strips unnecessary decimals. */
function formatQuantity(n: number): string {
  if (n === 0) return '';
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Maps common unit spelling variations to a single canonical form.
 * This prevents "1 tbsp olive oil" and "1 tablespoon olive oil" from
 * appearing as two separate shopping list entries.
 */
function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase().trim();
  if (['tbsp', 'tbs', 'tablespoon', 'tablespoons'].includes(u)) return 'tbsp';
  if (['tsp', 'teaspoon', 'teaspoons'].includes(u)) return 'tsp';
  if (['cup', 'cups', 'c'].includes(u)) return 'cup';
  if (['oz', 'ounce', 'ounces'].includes(u)) return 'oz';
  if (['lb', 'lbs', 'pound', 'pounds'].includes(u)) return 'lb';
  if (['g', 'gram', 'grams'].includes(u)) return 'g';
  if (['kg', 'kilogram', 'kilograms'].includes(u)) return 'kg';
  if (['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(u)) return 'ml';
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(u)) return 'l';
  if (['clove', 'cloves'].includes(u)) return 'clove';
  if (['slice', 'slices'].includes(u)) return 'slice';
  if (['piece', 'pieces'].includes(u)) return 'piece';
  if (['can', 'cans'].includes(u)) return 'can';
  if (['pkg', 'package', 'packages', 'pack'].includes(u)) return 'pkg';
  // Count-based units all mean "each" — normalize to empty string so
  // "1 whole onion" and "2 medium onions" merge into "3 onions"
  if (['whole', 'each', 'medium', 'large', 'small', 'head', 'bunch', 'sprig', 'sprigs'].includes(u)) return '';
  return u; // return as-is if no known mapping
}
