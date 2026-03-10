import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DIETARY_OPTIONS, EFFORT_OPTIONS } from '../../lib/constants';
import type { Recipe, Ingredient, IngredientCategory, DietaryPreference, EffortLevel } from '../../types/recipe';

type RecipeFormData = Omit<Recipe, 'id' | 'createdAt' | 'source'>;

interface RecipeFormProps {
  /** Pre-populated values for edit mode. Leave undefined for add mode. */
  initialValues?: Partial<RecipeFormData>;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const CATEGORY_OPTIONS: IngredientCategory[] = [
  'Produce', 'Meat', 'Dairy', 'Pantry', 'Spices', 'Bakery', 'Frozen', 'Other',
];

/** Creates a blank ingredient row with a temporary ID. */
function blankIngredient(): Ingredient {
  return {
    id: `ing-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '',
    quantity: 1,
    unit: '',
    category: 'Produce',
  };
}

export default function RecipeForm({ initialValues, onSubmit, onCancel, submitLabel = 'Save Recipe' }: RecipeFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? '');
  const [effortLevel, setEffortLevel] = useState<EffortLevel>(initialValues?.effortLevel ?? 'Average');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(initialValues?.prepTimeMinutes ?? 30);
  const [baseServings, setBaseServings] = useState(initialValues?.baseServings ?? 4);
  const [dietaryTags, setDietaryTags] = useState<DietaryPreference[]>(
    (initialValues?.dietaryTags ?? []).filter((t) => t !== 'None')
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialValues?.ingredients?.length ? initialValues.ingredients : [blankIngredient()]
  );
  const [instructions, setInstructions] = useState<string[]>(
    initialValues?.instructions?.length ? initialValues.instructions : ['']
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // --- Dietary tag toggle ---
  const toggleTag = (tag: DietaryPreference) => {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // --- Ingredient list helpers ---
  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const addIngredient = () => setIngredients((prev) => [...prev, blankIngredient()]);

  const removeIngredient = (id: string) => {
    // Always keep at least one ingredient row
    setIngredients((prev) => (prev.length > 1 ? prev.filter((ing) => ing.id !== id) : prev));
  };

  // --- Instructions list helpers ---
  const updateInstruction = (index: number, value: string) => {
    setInstructions((prev) => prev.map((step, i) => (i === index ? value : step)));
  };

  const addInstruction = () => setInstructions((prev) => [...prev, '']);

  const removeInstruction = (index: number) => {
    setInstructions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // --- Validation ---
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Recipe title is required.';
    if (!description.trim()) newErrors.description = 'A short description is required.';
    if (prepTimeMinutes < 1) newErrors.prepTime = 'Prep time must be at least 1 minute.';

    const filledIngredients = ingredients.filter((i) => i.name.trim());
    if (filledIngredients.length === 0) {
      newErrors.ingredients = 'Add at least one ingredient.';
    }

    const filledSteps = instructions.filter((s) => s.trim());
    if (filledSteps.length === 0) {
      newErrors.instructions = 'Add at least one instruction step.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        effortLevel,
        prepTimeMinutes,
        baseServings,
        dietaryTags,
        // Filter out any blank ingredient rows before saving
        ingredients: ingredients.filter((i) => i.name.trim()),
        // Filter out blank instruction steps
        instructions: instructions.filter((s) => s.trim()),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="recipe-title" className="block text-sm font-semibold text-gray-700">
          Recipe Name <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="recipe-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Creamy Tomato Pasta"
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors',
            errors.title ? 'border-red-400' : 'border-gray-200'
          )}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="text-xs text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="recipe-desc" className="block text-sm font-semibold text-gray-700">
          Description <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <textarea
          id="recipe-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short summary of the dish..."
          rows={2}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none',
            errors.description ? 'border-red-400' : 'border-gray-200'
          )}
          aria-describedby={errors.description ? 'desc-error' : undefined}
        />
        {errors.description && (
          <p id="desc-error" role="alert" className="text-xs text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Effort + Prep Time + Servings row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Effort Level</label>
          <div className="flex flex-col gap-1.5">
            {EFFORT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEffortLevel(option)}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary',
                  effortLevel === option
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="prep-time" className="block text-sm font-semibold text-gray-700">
            Prep Time (minutes)
          </label>
          <input
            id="prep-time"
            type="number"
            min={1}
            value={prepTimeMinutes}
            onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
            className={cn(
              'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary',
              errors.prepTime ? 'border-red-400' : 'border-gray-200'
            )}
            aria-describedby={errors.prepTime ? 'prep-error' : undefined}
          />
          {errors.prepTime && (
            <p id="prep-error" role="alert" className="text-xs text-red-600">{errors.prepTime}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="base-servings" className="block text-sm font-semibold text-gray-700">
            Serves
          </label>
          <input
            id="base-servings"
            type="number"
            min={1}
            max={50}
            value={baseServings}
            onChange={(e) => setBaseServings(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-describedby="base-servings-hint"
          />
          <p id="base-servings-hint" className="text-xs text-gray-400">
            How many people this recipe feeds as written.
          </p>
        </div>
      </div>

      {/* Dietary Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Dietary Tags</label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.filter((t) => t !== 'None').map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag as DietaryPreference)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary',
                dietaryTags.includes(tag as DietaryPreference)
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Ingredients <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        {errors.ingredients && (
          <p role="alert" className="text-xs text-red-600">{errors.ingredients}</p>
        )}
        <div className="space-y-2">
          {ingredients.map((ing, index) => (
            <div key={ing.id} className="grid grid-cols-12 gap-2 items-center">
              {/* Name — widest column */}
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                placeholder="Ingredient"
                aria-label={`Ingredient ${index + 1} name`}
                className="col-span-4 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {/* Quantity */}
              <input
                type="number"
                min={0}
                step="any"
                value={ing.quantity}
                onChange={(e) => updateIngredient(ing.id, 'quantity', Number(e.target.value))}
                aria-label={`Ingredient ${index + 1} quantity`}
                className="col-span-2 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {/* Unit */}
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                placeholder="Unit"
                aria-label={`Ingredient ${index + 1} unit`}
                className="col-span-3 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {/* Category */}
              <select
                value={ing.category}
                onChange={(e) => updateIngredient(ing.id, 'category', e.target.value)}
                aria-label={`Ingredient ${index + 1} category`}
                className="col-span-2 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {/* Remove */}
              <button
                type="button"
                onClick={() => removeIngredient(ing.id)}
                className="col-span-1 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label={`Remove ingredient ${index + 1}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          <Plus size={16} />
          Add Ingredient
        </button>
      </div>

      {/* Instructions */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Instructions <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        {errors.instructions && (
          <p role="alert" className="text-xs text-red-600">{errors.instructions}</p>
        )}
        <div className="space-y-2">
          {instructions.map((step, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="shrink-0 w-6 h-6 mt-2 flex items-center justify-center text-xs font-bold text-gray-400 bg-gray-100 rounded-full">
                {index + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) => updateInstruction(index, e.target.value)}
                placeholder={`Step ${index + 1}...`}
                rows={2}
                aria-label={`Instruction step ${index + 1}`}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                className="mt-2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label={`Remove step ${index + 1}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addInstruction}
          className="flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          <Plus size={16} />
          Add Step
        </button>
      </div>

      {/* Optional image URL */}
      <div className="space-y-1">
        <label htmlFor="recipe-image" className="block text-sm font-semibold text-gray-700">
          Photo URL <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="recipe-image"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://... (leave blank for auto stock photo)"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-gray-400">
          Leave blank and a food photo will be found automatically once your Unsplash key is active.
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
