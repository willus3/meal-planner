import type { DietaryPreference, EffortLevel } from './store';

export type IngredientCategory = 'Produce' | 'Dairy' | 'Meat' | 'Pantry' | 'Spices' | 'Bakery' | 'Frozen' | 'Other';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  effortLevel: EffortLevel;
  prepTimeMinutes: number;
  dietaryTags: DietaryPreference[];
  ingredients: Ingredient[];
  instructions: string[];
}

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Quick Veggie Stir Fry',
    description: 'A fast and healthy mix of fresh vegetables flashed in a savory soy-ginger sauce.',
    imageUrl: 'https://images.unsplash.com/photo-1548943487-a2e4d43b4859?q=80&w=800&auto=format&fit=crop',
    effortLevel: 'Quick Weekday',
    prepTimeMinutes: 20,
    dietaryTags: ['Vegetarian', 'Vegan'],
    ingredients: [
      { id: 'i1', name: 'Broccoli florets', quantity: 2, unit: 'cups', category: 'Produce' },
      { id: 'i2', name: 'Bell peppers', quantity: 2, unit: 'whole', category: 'Produce' },
      { id: 'i3', name: 'Soy sauce', quantity: 3, unit: 'tbsp', category: 'Pantry' },
      { id: 'i4', name: 'Rice noodles', quantity: 8, unit: 'oz', category: 'Pantry' }
    ],
    instructions: [
      'Boil the rice noodles according to package instructions.',
      'Chop the broccoli and bell peppers into bite-sized pieces.',
      'Stir fry the vegetables in a hot wok with oil for 5 minutes.',
      'Add the cooked noodles and soy sauce, tossing to combine.'
    ]
  },
  {
    id: '2',
    title: 'Weekend Roast Chicken',
    description: 'A comforting, slow-roasted whole chicken with herbs and root vegetables.',
    imageUrl: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=800&auto=format&fit=crop',
    effortLevel: 'Long Weekend',
    prepTimeMinutes: 120,
    dietaryTags: ['Keto', 'Paleo', 'Gluten-Free'],
    ingredients: [
      { id: 'i5', name: 'Whole Chicken', quantity: 1, unit: 'whole (4lbs)', category: 'Meat' },
      { id: 'i6', name: 'Carrots', quantity: 4, unit: 'whole', category: 'Produce' },
      { id: 'i7', name: 'Olive oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { id: 'i8', name: 'Fresh Rosemary', quantity: 2, unit: 'sprigs', category: 'Produce' }
    ],
    instructions: [
      'Preheat oven to 400°F (200°C).',
      'Rub the chicken with olive oil and stuff with rosemary.',
      'Chop carrots and place them at the bottom of a roasting pan.',
      'Place chicken on top and roast for 1.5 hours until juices run clear.'
    ]
  },
  {
    id: '3',
    title: 'Creamy Mushroom Pasta',
    description: 'Rich, earthy mushrooms in a decadent garlic parmesan cream sauce.',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=800&auto=format&fit=crop',
    effortLevel: 'Average',
    prepTimeMinutes: 45,
    dietaryTags: ['Vegetarian'],
    ingredients: [
      { id: 'i9', name: 'Fettuccine', quantity: 12, unit: 'oz', category: 'Pantry' },
      { id: 'i10', name: 'Cremini Mushrooms', quantity: 1, unit: 'lb', category: 'Produce' },
      { id: 'i11', name: 'Heavy Cream', quantity: 1, unit: 'cup', category: 'Dairy' },
      { id: 'i12', name: 'Parmesan Cheese', quantity: 0.5, unit: 'cup', category: 'Dairy' },
      { id: 'i13', name: 'Garlic', quantity: 3, unit: 'cloves', category: 'Produce' }
    ],
    instructions: [
      'Boil pasta in salted water until al dente.',
      'Sauté sliced mushrooms and minced garlic in butter until brown.',
      'Lower heat, stir in heavy cream and simmer for 5 minutes.',
      'Stir in parmesan cheese and toss with the cooked pasta.'
    ]
  },
  {
    id: '4',
    title: 'Keto Salmon & Asparagus',
    description: 'Perfectly baked salmon filets on a bed of garlic roasted asparagus.',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop',
    effortLevel: 'Quick Weekday',
    prepTimeMinutes: 25,
    dietaryTags: ['Keto', 'Paleo', 'Gluten-Free'],
    ingredients: [
      { id: 'i14', name: 'Salmon filets', quantity: 2, unit: 'filets', category: 'Meat' },
      { id: 'i15', name: 'Asparagus', quantity: 1, unit: 'bunch', category: 'Produce' },
      { id: 'i16', name: 'Lemon', quantity: 1, unit: 'whole', category: 'Produce' },
      { id: 'i17', name: 'Olive oil', quantity: 2, unit: 'tbsp', category: 'Pantry' }
    ],
    instructions: [
      'Preheat oven to 400°F (200°C).',
      'Toss trimmed asparagus in olive oil and spread on a sheet pan.',
      'Place salmon filets among the asparagus, drizzle with lemon juice.',
      'Bake for 12-15 minutes until salmon is flaky.'
    ]
  },
  {
    id: '5',
    title: 'Black Bean Quinoa Bowl',
    description: 'A hearty, protein-packed vegan bowl with fresh avocados and corn salsa.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    effortLevel: 'Average',
    prepTimeMinutes: 30,
    dietaryTags: ['Vegan', 'Vegetarian', 'Gluten-Free'],
    ingredients: [
      { id: 'i18', name: 'Quinoa', quantity: 1, unit: 'cup', category: 'Pantry' },
      { id: 'i19', name: 'Black beans', quantity: 1, unit: 'can (15oz)', category: 'Pantry' },
      { id: 'i20', name: 'Avocado', quantity: 1, unit: 'whole', category: 'Produce' },
      { id: 'i21', name: 'Corn kernels', quantity: 1, unit: 'cup', category: 'Frozen' }
    ],
    instructions: [
      'Rinse and cook quinoa according to package instructions.',
      'Warm the black beans and corn in a small skillet.',
      'Slice the avocado.',
      'Assemble bowls with quinoa base, topped with beans, corn, and avocado.'
    ]
  }
];
