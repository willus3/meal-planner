/** Where the recipe came from — used to track the source in Firestore. */
export type RecipeSource = 'manual' | 'photo' | 'internet';

/** Grocery aisle categories for grouping shopping list items. */
export type IngredientCategory =
  | 'Produce'
  | 'Dairy'
  | 'Meat'
  | 'Pantry'
  | 'Spices'
  | 'Bakery'
  | 'Frozen'
  | 'Other';

/** Dietary restriction / preference tag. */
export type DietaryPreference =
  | 'Vegetarian'
  | 'Vegan'
  | 'Keto'
  | 'Paleo'
  | 'Gluten-Free'
  | 'None';

/** How much time and effort a recipe requires. */
export type EffortLevel = 'Quick Weekday' | 'Average' | 'Long Weekend';

/** A single ingredient with quantity, unit, and grocery category. */
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
}

/** A recipe stored in the user's Firestore library. */
export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  effortLevel: EffortLevel;
  prepTimeMinutes: number;
  /** How many people the recipe serves as written — used to scale ingredient quantities. */
  baseServings: number;
  dietaryTags: DietaryPreference[];
  ingredients: Ingredient[];
  instructions: string[];
  source: RecipeSource;
  createdAt: Date;
  /** Original URL for internet-sourced recipes — links back to the source page. */
  sourceUrl?: string;
}
