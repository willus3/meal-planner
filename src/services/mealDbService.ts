import type { Recipe, Ingredient, IngredientCategory } from '../types/recipe';

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

// ─── TheMealDB response types ─────────────────────────────────────────────────

interface MealDbMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strSource: string | null;
  // Ingredients and measures come as 20 numbered flat fields
  [key: string]: string | null;
}

interface MealDbResponse {
  meals: MealDbMeal[] | null;
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

/**
 * Converts fraction strings to decimal numbers.
 * Handles: "1/2" → 0.5, "1 1/2" → 1.5, "3" → 3
 */
function parseFraction(s: string): number {
  const trimmed = s.trim();
  // Mixed number: "1 1/2"
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  // Simple fraction: "3/4"
  const fraction = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fraction) return parseInt(fraction[1]) / parseInt(fraction[2]);
  // Plain decimal or integer
  const num = parseFloat(trimmed);
  return isNaN(num) ? 0 : num;
}

/**
 * Parses a TheMealDB measure string into a numeric quantity and unit string.
 * Examples:
 *   "3/4 cup"   → { quantity: 0.75, unit: "cup" }
 *   "1 1/2 tbs" → { quantity: 1.5,  unit: "tbs" }
 *   "To taste"  → { quantity: 0,    unit: "" }
 *   "2"         → { quantity: 2,    unit: "" }
 */
function parseMeasure(measure: string): { quantity: number; unit: string } {
  const m = measure.trim();
  if (!m) return { quantity: 1, unit: '' };

  const lower = m.toLowerCase();
  // Non-numeric / qualitative measures
  if (
    ['to taste', 'as needed', 'for garnish', 'for serving', 'for topping',
     'a pinch', 'pinch', 'some', 'dash', 'handful', 'spray'].some((p) => lower.includes(p))
  ) {
    return { quantity: 0, unit: '' };
  }

  // Extract leading number (mixed fraction, fraction, or decimal/integer)
  const numMatch = m.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*)/);
  if (!numMatch) {
    // No leading number — treat the whole string as a unit with quantity 1
    return { quantity: 1, unit: m };
  }

  const quantity = parseFraction(numMatch[1]);
  const unit = m.slice(numMatch[0].length).trim();
  return { quantity, unit };
}

/**
 * Maps a common ingredient name to our grocery aisle category.
 * Uses simple keyword matching — defaults to "Other" when uncertain.
 */
function guessCategory(name: string): IngredientCategory {
  const n = name.toLowerCase();

  if (/\b(chicken|beef|pork|lamb|turkey|bacon|sausage|ham|fish|salmon|tuna|shrimp|prawn|crab|lobster|steak|mince|veal|duck|venison|anchov)\b/.test(n)) return 'Meat';
  if (/\b(milk|cheese|butter|cream|yogurt|yoghurt|sour cream|cheddar|parmesan|mozzarella|ricotta|egg)\b/.test(n)) return 'Dairy';
  if (/\b(flour|sugar|salt|oil|vinegar|sauce|pasta|rice|noodle|bread crumb|stock|broth|honey|syrup|baking|cornstarch|cornflour|yeast|cocoa|chocolate|vanilla|tomato paste|canned|dried beans|lentil|chickpea|oat|nut|almond|cashew|walnut|peanut|pistachio|pecan|sesame|tahini|soy sauce|fish sauce|oyster sauce|hoisin|worcestershire|ketchup|mustard|mayonnaise|relish|jam|preserve)\b/.test(n)) return 'Pantry';
  if (/\b(basil|oregano|thyme|rosemary|cumin|paprika|turmeric|cinnamon|pepper|chili|cayenne|ginger powder|garlic powder|onion powder|bay leaf|cloves|nutmeg|saffron|cardamom|coriander seed|fennel|mustard seed|dill|tarragon|sage|marjoram|allspice|mixed spice|seasoning|spice|powder)\b/.test(n)) return 'Spices';
  if (/\b(onion|garlic|tomato|carrot|potato|lettuce|spinach|kale|broccoli|cauliflower|celery|cucumber|zucchini|courgette|capsicum|mushroom|corn|peas|leek|shallot|scallion|spring onion|cabbage|beet|asparagus|artichoke|eggplant|aubergine|sweet potato|squash|pumpkin|avocado|lemon|lime|orange|apple|banana|berr|strawberr|blueberr|raspberr|grape|mango|pineapple|peach|pear|plum|cherry|apricot|parsley|cilantro|coriander leaf|mint|chive|fresh ginger|fresh herb)\b/.test(n)) return 'Produce';
  if (/\b(frozen|ice cream)\b/.test(n)) return 'Frozen';
  if (/\b(bread|roll|bun|bagel|croissant|pastry|tortilla|pita|naan|flatbread)\b/.test(n)) return 'Bakery';

  return 'Other';
}

/**
 * Splits TheMealDB's single block-of-text instructions into individual steps.
 * TheMealDB uses \r\n line breaks and sometimes numbers its steps.
 */
function parseInstructions(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/\r\n|\r|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    // Strip leading step numbers like "1." "Step 1:" "STEP 1 -"
    .map((s) => s.replace(/^(step\s+)?\d+[\.\)\-:]\s*/i, '').trim())
    .filter((s) => s.length > 0);
}

/**
 * Extracts the 20 possible ingredient+measure pairs from a TheMealDB meal object
 * and converts them to our Ingredient format.
 */
function parseIngredients(meal: MealDbMeal): Ingredient[] {
  const ingredients: Ingredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = ((meal[`strIngredient${i}`] ?? '') as string).trim();
    const measure = ((meal[`strMeasure${i}`] ?? '') as string).trim();
    if (!name) continue;

    const { quantity, unit } = parseMeasure(measure);
    ingredients.push({
      id: `ing-${meal.idMeal}-${i}`,
      name,
      quantity,
      unit,
      category: guessCategory(name),
    });
  }
  return ingredients;
}

/**
 * Converts a raw TheMealDB meal object into our internal Recipe format.
 * Fields TheMealDB doesn't provide (prep time, servings, effort level) get
 * sensible defaults — the user can edit them after saving.
 */
function toRecipe(meal: MealDbMeal): Omit<Recipe, 'id' | 'createdAt' | 'source'> {
  // TheMealDB has Vegetarian and Vegan as actual category names
  const dietaryTags: Recipe['dietaryTags'] = [];
  if (meal.strCategory === 'Vegetarian') dietaryTags.push('Vegetarian');
  if (meal.strCategory === 'Vegan') dietaryTags.push('Vegan');

  const area = meal.strArea && meal.strArea !== 'Unknown' ? `${meal.strArea} ` : '';

  return {
    title: meal.strMeal,
    description: `${area}${meal.strCategory ?? 'recipe'}.`,
    imageUrl: meal.strMealThumb ?? '',
    sourceUrl: meal.strSource || undefined,
    effortLevel: 'Average',
    prepTimeMinutes: 30,
    baseServings: 4,
    dietaryTags,
    ingredients: parseIngredients(meal),
    instructions: parseInstructions(meal.strInstructions ?? ''),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Searches TheMealDB for real recipes matching the query string.
 * Returns real recipes with real photos and source URLs — no AI generation.
 * No API key required.
 *
 * @throws Error with a user-friendly message on network failure
 */
export async function searchMealDb(
  query: string
): Promise<Omit<Recipe, 'id' | 'createdAt' | 'source'>[]> {
  let data: MealDbResponse;
  try {
    const response = await fetch(
      `${MEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Recipe search failed: ${detail}`);
  }

  // TheMealDB returns null (not an empty array) when there are no results
  if (!data.meals) return [];

  return data.meals.map(toRecipe);
}
