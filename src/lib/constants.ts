import type { DietaryPreference, EffortLevel, IngredientCategory } from '../types/recipe';
import type { DayOfWeek } from '../types/mealplan';

/** All seven days of the week in calendar order. */
export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

/**
 * Grocery aisle categories in the order they should appear on the shopping list.
 * Ordered to match a typical grocery store layout (perimeter first, pantry last).
 */
export const CATEGORY_ORDER: IngredientCategory[] = [
  'Produce', 'Meat', 'Dairy', 'Bakery', 'Pantry', 'Spices', 'Frozen', 'Other',
];

/** All supported dietary preference tags. */
export const DIETARY_OPTIONS: DietaryPreference[] = [
  'None', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free',
];

/** All supported effort level options for recipes. */
export const EFFORT_OPTIONS: EffortLevel[] = [
  'Quick Weekday', 'Average', 'Long Weekend',
];

/** Maximum allowed image file size for photo uploads (10 MB). */
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

/** Number of recipe recommendations Gemini should return per request. */
export const RECOMMENDATION_COUNT = 6;

/** Number of internet recipe suggestions Gemini should return per search. */
export const INTERNET_SEARCH_COUNT = 5;

/** Maximum number of past meal plans to load in the history view. */
export const HISTORY_LIMIT = 12;
