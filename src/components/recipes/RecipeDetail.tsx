import { Clock, ChefHat, Leaf, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Recipe } from '../../types/recipe';

interface RecipeDetailProps {
  recipe: Recipe;
}

/**
 * Full recipe view — shown inside a Modal when the user taps a recipe card.
 * Displays the photo, metadata, ingredient list, and step-by-step instructions.
 */
export default function RecipeDetail({ recipe }: RecipeDetailProps) {
  return (
    <div className="space-y-6">

      {/* Photo */}
      <div className="h-56 rounded-xl overflow-hidden bg-gray-100 -mt-2">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <ChefHat className="text-gray-300 w-12 h-12" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">
          <Clock size={14} aria-hidden="true" />
          {recipe.prepTimeMinutes}m prep
        </span>
        <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
          {recipe.effortLevel}
        </span>
        {recipe.dietaryTags.map((tag) => (
          <span
            key={tag}
            className={cn(
              'flex items-center gap-1 text-xs font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full',
              tag === 'Vegetarian' || tag === 'Vegan'
                ? 'bg-green-100 text-green-700'
                : tag === 'Gluten-Free'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-700'
            )}
          >
            {tag === 'Vegetarian' || tag === 'Vegan' ? <Leaf size={10} aria-hidden="true" /> : null}
            {tag}
          </span>
        ))}
      </div>

      {/* Description */}
      {recipe.description && (
        <p className="text-gray-600 text-sm leading-relaxed">{recipe.description}</p>
      )}

      {/* Ingredients */}
      {recipe.ingredients.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={16} className="text-primary" aria-hidden="true" />
            Ingredients
            <span className="text-xs font-normal text-gray-400">({recipe.ingredients.length} items)</span>
          </h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-800">{ing.name}</span>
                <span className="text-sm font-semibold text-primary ml-4 shrink-0">
                  {ing.quantity} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Instructions */}
      {recipe.instructions.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-gray-900 mb-3">Instructions</h3>
          <ol className="space-y-3">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
