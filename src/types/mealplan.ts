/** The seven days of the week as string literals — used as keys in the schedule. */
export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

/** A single meal assigned to a day — links a recipe by ID with a serving count. */
export interface PlannedMeal {
  recipeId: string;
  servings: number;
}

/** The 7-day schedule map. Each day holds a meal or is empty (null). */
export type WeeklySchedule = Record<DayOfWeek, PlannedMeal | null>;

/** An item on the shopping list — either auto-generated or manually added. */
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  /** Recipes this item was sourced from (for auto-generated items). */
  sourceRecipes: string[];
  /** True if the user added this item manually (not from a recipe). */
  isManual: boolean;
}

/** A complete weekly meal plan document stored in Firestore. */
export interface MealPlan {
  id: string;
  /** ISO date string for the Monday that starts this week. */
  weekStartDate: string;
  /** ISO date string for the Sunday that ends this week. */
  weekEndDate: string;
  schedule: WeeklySchedule;
  generatedItems: ShoppingItem[];
  manualItems: ShoppingItem[];
  createdAt: Date;
  /** True for the plan currently being edited / in progress. */
  isActive: boolean;
}
