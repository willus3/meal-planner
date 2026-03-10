import type { Recipe } from '../../lib/recipes';
import { Clock, Leaf, Pencil, Trash2, ChefHat } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  actionButton?: React.ReactNode;
  /** If provided, the card image/title area becomes clickable to view the full recipe. */
  onView?: () => void;
  /** If provided, shows an edit icon button on the card. */
  onEdit?: () => void;
  /** If provided, shows a delete icon button on the card. */
  onDelete?: () => void;
}

export default function RecipeCard({ recipe, actionButton, onView, onEdit, onDelete }: RecipeCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col h-full">
      {/* Image Header — clicking the photo opens the full recipe view */}
      <div
        className={cn('h-48 relative w-full overflow-hidden bg-gray-100', onView && 'cursor-pointer')}
        onClick={onView}
        role={onView ? 'button' : undefined}
        aria-label={onView ? `View ${recipe.title}` : undefined}
        tabIndex={onView ? 0 : undefined}
        onKeyDown={onView ? (e) => { if (e.key === 'Enter' || e.key === ' ') onView(); } : undefined}
      >
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="object-cover w-full h-full"
            onError={(e) => {
              // If image URL is broken, hide it and show the placeholder below
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          // Placeholder shown when no image URL is set
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <ChefHat className="text-gray-300 w-12 h-12" aria-hidden="true" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold shadow-sm text-gray-700">
          {recipe.effortLevel}
        </div>
        {/* Edit / Delete overlay buttons — only rendered if handlers are passed */}
        {(onEdit || onDelete) && (
          <div className="absolute top-3 left-3 flex gap-1.5">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="w-7 h-7 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-md shadow-sm text-gray-600 hover:text-primary hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Edit ${recipe.title}`}
              >
                <Pencil size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="w-7 h-7 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-md shadow-sm text-gray-600 hover:text-red-600 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label={`Delete ${recipe.title}`}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-4">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {recipe.title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm font-medium shrink-0 bg-gray-50 px-2 py-1 rounded-md">
            <Clock size={14} className="mr-1" />
            {recipe.prepTimeMinutes}m
          </div>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
          {recipe.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
          {recipe.dietaryTags.map(tag => (
            <span 
              key={tag} 
              className={cn(
                "text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full flex items-center",
                tag === 'Vegetarian' || tag === 'Vegan' ? "bg-green-100 text-green-700" :
                tag === 'Gluten-Free' ? "bg-yellow-100 text-yellow-800" :
                "bg-blue-100 text-blue-700"
              )}
            >
              {tag === 'Vegetarian' || tag === 'Vegan' ? <Leaf size={10} className="mr-1" /> : null}
              {tag}
            </span>
          ))}
        </div>

        {/* Action Button Injection */}
        <div className="pt-3 border-t border-gray-100 w-full">
          {actionButton ? actionButton : (
            <button
              onClick={onView}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg text-sm transition-colors border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              View Recipe
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
